import { Response, NextFunction } from 'express';
import { prisma } from '../utils/db.js';
import { AuthRequest } from '../middleware/auth.js';
import { PdfExtractorService } from '../services/pdfExtractor.js';
import { GroqService } from '../services/groq.js';
import { GithubService } from '../services/github.js';
import { PortfolioData } from '../types/index.js';

export class PortfolioController {
  /**
   * Generates a portfolio from uploaded resume, LinkedIn text, and optional GitHub handle.
   */
  public static async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF resume file.' });
      }

      const { githubUrl, linkedinText } = req.body;

      // Extract raw text from the uploaded PDF
      console.log('Extracting text from PDF resume...');
      const resumeText = await PdfExtractorService.extractText(req.file.buffer);

      // Perform AI structured extraction and content enhancement
      console.log('Synthesizing career narratives using Groq AI...');
      const generatedProfile = await GroqService.generatePortfolioData(
        resumeText,
        linkedinText || ''
      );

      // Save raw PDF resume as base64 string in generatedProfile
      generatedProfile.resumePdfBase64 = req.file.buffer.toString('base64');

      // Integrate GitHub stats if username is provided
      if (githubUrl) {
        const usernameMatch = githubUrl.match(/github\.com\/([^/]+)/) || [null, githubUrl];
        const githubUsername = usernameMatch[1]?.trim();

        if (githubUsername) {
          try {
            console.log(`Fetching GitHub portfolio assets for: ${githubUsername}...`);
            const githubData = await GithubService.fetchProfileData(githubUsername);
            
            // Append Github stats & repositories to generated profile
            generatedProfile.socials = {
              ...generatedProfile.socials,
              github: `https://github.com/${githubUsername}`,
            };
            
            // Inject GitHub project listings into the portfolio projects
            const formattedGitProjects = githubData.repos.map((repo) => ({
              name: repo.name,
              description: repo.description,
              details: `GitHub repository containing codebase for ${repo.name}. Main language: ${repo.language}.`,
              challengesSolved: 'Code architecture organized for public distribution and code quality standard metrics.',
              techStack: [repo.language],
              githubLink: repo.url,
            }));

            // Deduplicate and combine projects, prioritizing resume projects
            generatedProfile.projects = [...generatedProfile.projects, ...formattedGitProjects];
            
            // Add github stats to custom basics metadata or let client render it.
            // Let's store Github data inside an extra property of profileData
            (generatedProfile as any).githubData = githubData;
          } catch (gitErr: any) {
            console.warn('GitHub aggregation skipped due to error:', gitErr.message || gitErr);
          }
        }
      }

      // Generate a unique URL slug based on user's name
      const baseSlug = generatedProfile.basics.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      let slug = baseSlug || 'portfolio';
      let count = 0;
      
      while (true) {
        const currentSlug = count === 0 ? slug : `${slug}-${count}`;
        const existingSlug = await prisma.portfolio.findUnique({
          where: { slug: currentSlug },
        });

        if (!existingSlug) {
          slug = currentSlug;
          break;
        }
        count++;
      }

      // Upsert user's portfolio
      const portfolio = await prisma.portfolio.upsert({
        where: { userId },
        update: {
          slug,
          profileData: JSON.stringify(generatedProfile),
        },
        create: {
          userId,
          slug,
          profileData: JSON.stringify(generatedProfile),
        },
      });

      // Invalidate response cache for this slug
      if ((global as any).responseCache) {
        const cache = (global as any).responseCache;
        Object.keys(cache).forEach((key) => {
          if (key.startsWith(`${slug}:`)) {
            delete cache[key];
          }
        });
      }

      return res.status(200).json({
        message: 'Portfolio generated successfully!',
        slug: portfolio.slug,
        portfolio: generatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves the current user's portfolio.
   */
  public static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'No portfolio found for this user.' });
      }

      return res.json({
        slug: portfolio.slug,
        theme: portfolio.theme,
        profileData: JSON.parse(portfolio.profileData),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates user portfolio settings or text.
   */
  public static async updateMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { theme, profileData, slug } = req.body;

      // Validate slug uniqueness if changed
      if (slug) {
        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '');
        const existing = await prisma.portfolio.findUnique({
          where: { slug: cleanSlug },
        });

        if (existing && existing.userId !== userId) {
          return res.status(409).json({ error: 'This URL slug is already taken.' });
        }
      }

      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId },
      });
      const oldSlug = existingPortfolio?.slug;

      const updated = await prisma.portfolio.update({
        where: { userId },
        data: {
          ...(theme && { theme }),
          ...(slug && { slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, '') }),
          ...(profileData && { profileData: JSON.stringify(profileData) }),
        },
      });

      // Invalidate response cache for old and new slug
      if ((global as any).responseCache) {
        const cache = (global as any).responseCache;
        Object.keys(cache).forEach((key) => {
          if ((oldSlug && key.startsWith(`${oldSlug}:`)) || key.startsWith(`${updated.slug}:`)) {
            delete cache[key];
          }
        });
      }

      return res.json({
        message: 'Portfolio updated successfully.',
        slug: updated.slug,
        theme: updated.theme,
        profileData: JSON.parse(updated.profileData),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public route to serve portfolio by slug.
   */
  public static async getPublic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;

      const portfolio = await prisma.portfolio.findUnique({
        where: { slug },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio page not found.' });
      }

      // Increment view count in the background
      prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { views: { increment: 1 } },
      }).catch(err => console.error('Error incrementing views:', err));

      return res.json({
        theme: portfolio.theme,
        profileData: JSON.parse(portfolio.profileData),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Visitors chat with the candidate's AI copilot.
   */
  public static async chatCopilot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const { message, history } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      const portfolio = await prisma.portfolio.findUnique({
        where: { slug },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found.' });
      }

      const profileJson = JSON.parse(portfolio.profileData) as PortfolioData;

      // Simple in-memory cache to save API quota on exact repeated questions, scoped to portfolio slug
      if (!(global as any).responseCache) {
        (global as any).responseCache = {};
      }
      const cacheKey = `${slug}:${message.toLowerCase().trim()}`;
      // Bypass cache if there is conversational history, as answers depend on history context
      let responseText = history && history.length > 0 ? null : (global as any).responseCache[cacheKey];

      if (responseText) {
        console.log(`[Cache Hit] Serving cached response for key: "${cacheKey}"`);
      } else {
        // Request Copilot Response
        responseText = await GroqService.answerCopilotQuery(
          profileJson,
          message,
          history || []
        );
        // Only save to cache if history is empty (one-off query)
        if (!history || history.length === 0) {
          (global as any).responseCache[cacheKey] = responseText;
        }
      }

      // Infer Company / Organization from query text (heuristic rules)
      let inferredOrg: string | null = null;
      const recruiterMatch = message.match(/(?:at|from|representing|hiring for)\s+([A-Z][a-zA-Z0-9]+)/);
      if (recruiterMatch && recruiterMatch[1]) {
        inferredOrg = recruiterMatch[1];
      } else if (/\b(?:google|stripe|meta|netflix|amazon|microsoft|apple|uber|airbnb)\b/i.test(message)) {
        const matched = message.match(/\b(google|stripe|meta|netflix|amazon|microsoft|apple|uber|airbnb)\b/i);
        if (matched) inferredOrg = matched[1].charAt(0).toUpperCase() + matched[1].slice(1).toLowerCase();
      }

      // Log conversation telemetry in the background
      const ip = req.ip || req.socket.remoteAddress || null;
      prisma.chatLog.create({
        data: {
          portfolioId: portfolio.id,
          visitorIp: ip,
          query: message,
          response: responseText,
          inferredOrg,
        },
      }).catch(err => console.error('Failed to log telemetry:', err));

      return res.json({ reply: responseText });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetches dashboard analytics (views and copilot chat logs).
   */
  public static async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;

      const portfolio = await prisma.portfolio.findUnique({
        where: { userId },
        include: {
          chatLogs: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!portfolio) {
        return res.status(404).json({ error: 'No portfolio generated yet.' });
      }

      // Compute aggregate stats
      const totalViews = portfolio.views;
      const totalConversations = portfolio.chatLogs.length;

      // Group logs by organization
      const orgCounts: Record<string, number> = {};
      portfolio.chatLogs.forEach((log) => {
        if (log.inferredOrg) {
          orgCounts[log.inferredOrg] = (orgCounts[log.inferredOrg] || 0) + 1;
        }
      });

      const topOrgs = Object.entries(orgCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return res.json({
        views: totalViews,
        chatVolume: totalConversations,
        topInteractingOrgs: topOrgs,
        recentLogs: portfolio.chatLogs,
      });
    } catch (error) {
      next(error);
    }
  }
}
