interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export class GithubService {
  /**
   * Fetches public GitHub repositories and language profile for a given username.
   */
  public static async fetchProfileData(username: string): Promise<{
    repos: { name: string; description: string; url: string; stars: number; language: string }[];
    stats: { stars: number; forks: number; totalRepos: number };
    languages: { name: string; percentage: number }[];
  }> {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      throw new Error('GitHub username is required.');
    }

    try {
      // Fetch user profile and repos in parallel
      const reposResponse = await fetch(`https://api.github.com/users/${cleanUsername}/repos?per_page=100`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ai-portfolio-architect-app',
        },
      });

      if (reposResponse.status === 404) {
        throw new Error(`GitHub user "${cleanUsername}" was not found.`);
      }

      if (!reposResponse.ok) {
        const errorMsg = await reposResponse.text();
        throw new Error(`GitHub API error: ${reposResponse.status} - ${errorMsg}`);
      }

      const reposData = (await reposResponse.json()) as GithubRepo[];

      let totalStars = 0;
      let totalForks = 0;
      const languageCounts: Record<string, number> = {};

      const processedRepos = reposData
        .map((repo) => {
          totalStars += repo.stargazers_count;
          totalForks += repo.forks_count;

          if (repo.language) {
            languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
          }

          return {
            name: repo.name,
            description: repo.description || 'No description provided.',
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language || 'Unknown',
          };
        })
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 6); // Keep top 6 repos

      // Calculate language percentages
      const languageTotal = Object.values(languageCounts).reduce((sum, val) => sum + val, 0);
      const languages = Object.entries(languageCounts)
        .map(([name, count]) => ({
          name,
          percentage: languageTotal > 0 ? Math.round((count / languageTotal) * 100) : 0,
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5);

      return {
        repos: processedRepos,
        stats: {
          stars: totalStars,
          forks: totalForks,
          totalRepos: reposData.length,
        },
        languages,
      };
    } catch (error: any) {
      console.error(`Error fetching GitHub data for ${cleanUsername}:`, error);
      throw new Error(error.message || 'Failed to fetch GitHub profile information.');
    }
  }
}
