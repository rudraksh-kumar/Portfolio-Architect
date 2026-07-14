export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  bullets: string[];
  techStack: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  details: string;
  challengesSolved: string;
  techStack: string[];
  githubLink?: string;
  liveLink?: string;
  problemStatement?: string;
  keyFeatures?: string[];
  technicalHighlights?: string[];
  portfolioTagline?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  duration: string;
  highlights: string[];
}

export interface AchievementItem {
  title: string;
  awarder?: string;
  date?: string;
  description?: string;
}

export interface Socials {
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
}

export interface GitHubStats {
  stars: number;
  forks: number;
  totalRepos: number;
}

export interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

export interface GitHubLang {
  name: string;
  percentage: number;
}

export interface PortfolioData {
  basics: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    tagline: {
      heading: string;
      explanation: string;
    };
    bio: string;
    professionalTitle: string;
    alternateSummaries?: string[];
  };
  skills: SkillCategory[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  achievements: AchievementItem[];
  socials: Socials;
  githubData?: {
    repos: GitHubRepo[];
    stats: GitHubStats;
    languages: GitHubLang[];
  };
  themeName?: string;
  colorAccent?: string;
  fontFamilyHeading?: string;
  fontFamilyBody?: string;
  layoutStyle?: string;
  animationStyle?: string;
  sectionOrdering?: string[];
  personalityTone?: string;
  seoSettings?: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  };
  resumePdfBase64?: string;
  readinessAssessment?: ReadinessAssessment;
}

export interface ReadinessAssessment {
  score: number;
  breakdown: {
    writing: number;
    techDepth: number;
    recruiterAppeal: number;
    readiness: number;
    ats: number;
    storytelling: number;
  };
  suggestedSkills: { name: string; reason: string }[];
}

