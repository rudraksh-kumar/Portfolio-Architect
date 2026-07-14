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
  resumePdfBase64?: string;
  readinessAssessment?: ReadinessAssessment;
}

