import type { PortfolioData } from '../types.js';

export interface ScoreBreakdown {
  writing: number;
  techDepth: number;
  recruiterAppeal: number;
  readiness: number;
  ats: number;
  storytelling: number;
}

export interface ReviewBreakdown {
  content: number;
  projects: number;
  design: number;
  recruiter: number;
  seo: number;
  visual: number;
}

export interface CalculatedMetrics {
  score: number;
  enhancementBreakdown: ScoreBreakdown;
  reviewBreakdown: ReviewBreakdown;
}

export const calculatePortfolioMetrics = (portfolio: PortfolioData): CalculatedMetrics => {
  // 1. Core heuristic parameters (same as in AIContentEnhancement.tsx fallback check)
  let techDepth = 60;
  let writing = 65;
  let recruiterAppeal = 55;
  let ats = 50;
  let storytelling = 60;

  // Projects complexity checklist
  if (portfolio.projects && portfolio.projects.length >= 3) {
    techDepth += 20;
  } else if (portfolio.projects && portfolio.projects.length > 0) {
    techDepth += 10;
  }

  // Penalize generic template project names
  const genericKeywords = ['todo', 'calculator', 'weather', 'chat', 'clone', 'counter', 'basic'];
  const hasGenericProjects = portfolio.projects 
    ? portfolio.projects.some(p => genericKeywords.some(keyword => p.name.toLowerCase().includes(keyword)))
    : false;
  if (hasGenericProjects) {
    techDepth -= 15;
  }

  // Experience quality check
  if (portfolio.experience && portfolio.experience.length > 0) {
    writing += 15;
    recruiterAppeal += 15;

    // Check if bullet points use metrics (numbers)
    const hasMetrics = portfolio.experience.some(exp =>
      exp.bullets && exp.bullets.some(b => /\d+/.test(b))
    );
    if (hasMetrics) {
      writing += 10;
      ats += 15;
    }
  }

  // Social connectivity checklist
  if (portfolio.socials) {
    if (portfolio.socials.github) {
      recruiterAppeal += 15;
      ats += 5;
    }
    if (portfolio.socials.linkedin) {
      recruiterAppeal += 10;
      ats += 5;
    }
  }

  // Standardize boundaries [40, 95]
  techDepth = Math.max(40, Math.min(techDepth, 95));
  writing = Math.max(40, Math.min(writing, 95));
  recruiterAppeal = Math.max(40, Math.min(recruiterAppeal, 95));
  ats = Math.max(40, Math.min(ats, 95));
  storytelling = Math.max(40, Math.min(storytelling, 95));

  // Overall base score
  const score = Math.round((techDepth + writing + recruiterAppeal + ats + storytelling) / 5);

  // Logical mappings for Review Dashboard Categories
  const hasTheme = !!portfolio.themeName;
  const hasLayout = !!portfolio.layoutStyle;
  const designScore = hasTheme && hasLayout ? 92 : hasTheme || hasLayout ? 75 : 55;

  const hasBio = portfolio.basics && !!portfolio.basics.bio;
  const seoScore = Math.min((hasBio ? 85 : 55) + (portfolio.socials?.linkedin ? 10 : 0), 95);

  const visualScore = Math.min(Math.round((techDepth + recruiterAppeal) / 2) + 12, 95);

  const reviewBreakdown: ReviewBreakdown = {
    content: Math.round((writing + storytelling) / 2),
    projects: techDepth,
    design: designScore,
    recruiter: recruiterAppeal,
    seo: seoScore,
    visual: visualScore
  };

  const enhancementBreakdown: ScoreBreakdown = {
    writing,
    techDepth,
    recruiterAppeal,
    readiness: score,
    ats,
    storytelling
  };

  // If a readiness assessment is present from database, we merge and scale values based on it
  if (portfolio.readinessAssessment) {
    const dbScore = portfolio.readinessAssessment.score;
    const dbBreakdown = portfolio.readinessAssessment.breakdown;
    
    const mergedEnhancement = {
      writing: dbBreakdown.writing || writing,
      techDepth: dbBreakdown.techDepth || techDepth,
      recruiterAppeal: dbBreakdown.recruiterAppeal || recruiterAppeal,
      readiness: dbScore || score,
      ats: dbBreakdown.ats || ats,
      storytelling: dbBreakdown.storytelling || storytelling
    };

    const mergedReview = {
      content: Math.round(((dbBreakdown.writing || writing) + (dbBreakdown.storytelling || storytelling)) / 2),
      projects: dbBreakdown.techDepth || techDepth,
      design: designScore,
      recruiter: dbBreakdown.recruiterAppeal || recruiterAppeal,
      seo: seoScore,
      visual: visualScore
    };

    return {
      score: dbScore || score,
      enhancementBreakdown: mergedEnhancement,
      reviewBreakdown: mergedReview
    };
  }

  return {
    score,
    enhancementBreakdown,
    reviewBreakdown
  };
};
