import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  RefreshCw,
  Edit3,
  Plus,
  ArrowLeft,
  ArrowRight,
  Info,
  AlertTriangle,
  User,
  Briefcase,
  Code2,
  Activity,
  Layers,
  ThumbsUp,
  Bookmark
} from 'lucide-react';
import type { PortfolioData, ProjectItem } from '../types.js';

import { calculatePortfolioMetrics, type ScoreBreakdown } from '../utils/scoring.js';

interface AIContentEnhancementProps {
  initialData: PortfolioData;
  slug: string;
  token: string;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  breakdown: ScoreBreakdown;
  setBreakdown: React.Dispatch<React.SetStateAction<ScoreBreakdown>>;
  onNext: (updatedData: PortfolioData) => void;
  onCancel: () => void;
}

// Rewriting styles map
const REWRITE_STYLES = {
  Professional: {
    tagline: {
      heading: "Software Engineer",
      explanation: "Specializing in building highly performant, secure, and scalable web applications that deliver exceptional business value."
    },
    bio: "Accomplished software engineer dedicated to building performant and clean full-stack web architectures. Skilled at translating product scope into structured, production-ready modules.",
    bullets: {
      api: "Developed scalable REST APIs using Node.js and Express, improving backend maintainability and enabling seamless frontend integration.",
      query: "Optimized database query performance by 40% utilizing indexed views and query path refactoring.",
      migration: "Managed the migrations of deprecated services onto cloud clusters, reducing infrastructure overhead."
    }
  },
  'Startup Founder': {
    tagline: {
      heading: "Startup Developer",
      explanation: "Building scalable products with a focus on shipping fast, solving user problems, and rapid prototyping."
    },
    bio: "Product-focused developer building from zero to one. Obsessed with high delivery rates, user interaction paradigms, rapid prototyping, and business scalability metrics.",
    bullets: {
      api: "Designed and launched an end-to-end user acquisition tool from scratch in 3 weeks, handling backend APIs.",
      query: "Boosted query speeds by 40% to sustain a rapid 2x growth in concurrent platform registrations.",
      migration: "Spearheaded the swift transition from legacy monolithic systems to agile containers."
    }
  },
  Researcher: {
    tagline: {
      heading: "Computer Scientist",
      explanation: "Exploring algorithmic complexity to engineer data-driven solutions that solve complex mathematical constraints."
    },
    bio: "Computer scientist specializing in algorithmic design, data validation models, and exploring the mathematical limitations of machine learning systems.",
    bullets: {
      api: "Engineered robust, secure APIs with strict interface schemas for mathematical model computation.",
      query: "Reduced SQL search latency by 40% through custom cache policies and execution index research.",
      migration: "Managed architectural containerization to ensure mathematical repeatability across servers."
    }
  },
  Creative: {
    tagline: {
      heading: "Creative Developer",
      explanation: "Designing immersive user interfaces with a focus on crafting memorable and highly interactive digital experiences."
    },
    bio: "Design-minded developer operating at the intersection of beautiful aesthetic interfaces and fluid web layouts. Crafting high-grade interactive experiences.",
    bullets: {
      api: "Crafted interactive APIs that powered a fluid, drag-and-drop web experience for client apps.",
      query: "Streamlined data-fetch cycles by 40% to achieve smooth 60fps animations in live dashboards.",
      migration: "Re-architected microservice environments with highly organized code standards."
    }
  },
  Minimal: {
    tagline: {
      heading: "Minimalist Developer",
      explanation: "Simplicity in design focusing on lightweight, performant code bases with zero unnecessary external dependencies."
    },
    bio: "Focused developer crafting lightweight code bases. Devoted to clean architectures, zero dependencies, and low CPU footprint software solutions.",
    bullets: {
      api: "Authored lean, dependency-free API microservices in clean, self-documenting Node.js modules.",
      query: "Reduced DB execution patterns by 40% by pruning redundant database checks and keys.",
      migration: "Consolidated infrastructure clusters, cutting server costs and configuration overhead."
    }
  },
  Developer: {
    tagline: {
      heading: "Full-Stack Developer",
      explanation: "Specializing in building modern web applications with clean architecture and robust backend systems."
    },
    bio: "Passionate full-stack developer who enjoys debugging backend services, crafting responsive client layouts, and scripting utility tools.",
    bullets: {
      api: "Built full-stack APIs using Express and SQLite, supporting real-time web UI dashboard widgets.",
      query: "Debugged and indexed slow database query loops, resulting in a 40% faster loading page response.",
      migration: "Migrated legacy servers to modern Node.js environments, ensuring zero platform downtime."
    }
  }
};

// Help highlight words in AI bullets
const highlightBulletText = (text: string) => {
  const keywords = {
    action: ['developed', 'optimized', 'managed', 'designed', 'engineered', 'crafted', 'authored', 'built', 'spearheaded', 'boosted', 'reduced', 'streamlined', 're-architected', 'implemented'],
    tech: ['node.js', 'express', 'apis', 'rest', 'database', 'sql', 'microservice', 'react', 'sqlite', 'cloud', 'containerization', 'architectures', 'indexing'],
    impact: ['40%', '3 weeks', '2x', '60fps', 'low-latency', 'scalable', 'maintainability', 'overheads', 'downtime']
  };

  const words = text.split(/(\s+)/);
  return words.map((word, idx) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9.%]/g, '');
    if (keywords.action.includes(cleanWord)) {
      return <span key={idx} className="text-purple-400 font-bold underline decoration-purple-500/30" title="Action Verb">{word}</span>;
    }
    if (keywords.tech.includes(cleanWord)) {
      return <span key={idx} className="text-blue-400 font-semibold" title="Tech Keyword">{word}</span>;
    }
    if (keywords.impact.includes(cleanWord)) {
      return <span key={idx} className="text-green-400 font-extrabold font-mono" title="Impact metric">{word}</span>;
    }
    return word;
  });
};

export const AIContentEnhancement: React.FC<AIContentEnhancementProps> = ({
  initialData,
  slug: _slug,
  token: _token,
  score,
  setScore,
  breakdown,
  setBreakdown,
  onNext,
  onCancel
}) => {
  const [data, setData] = useState<PortfolioData>(() => {
    // Inject narrative properties into projects if missing
    const enhancedProjects = initialData.projects.map((p) => ({
      ...p,
      problemStatement: p.problemStatement || `Handling high request density and data synchronization issues within a React environment.`,
      keyFeatures: p.keyFeatures || [`Real-time data visualization`, `Secure OAuth access`, `Responsive layout adapters`],
      technicalHighlights: p.technicalHighlights || [`Custom hook query buffers`, `Indexed database local caches`, `Dynamic routing patterns`],
      portfolioTagline: p.portfolioTagline || `A high-performance ${p.name} built with ${p.techStack.slice(0, 2).join(' and ')}.`
    }));
    return {
      ...initialData,
      projects: enhancedProjects
    };
  });

  const [baseScore] = useState(() => calculatePortfolioMetrics(initialData).score);
  const [baseBreakdown] = useState(() => calculatePortfolioMetrics(initialData).enhancementBreakdown);

  // Accepting state trackers
  const [aboutAccepted, setAboutAccepted] = useState(false);
  const [experienceAcceptance, setExperienceAcceptance] = useState<Record<string, boolean>>({});
  const [projectAcceptance, setProjectAcceptance] = useState<Record<string, boolean>>({});

  // Editing state trackers
  interface PopupField {
    key: string;
    label: string;
    value: string;
    type: 'text' | 'textarea';
  }

  interface PopupModalConfig {
    type: 'about' | 'experience' | 'project-desc' | 'project-problem' | 'project-tagline' | 'project-feature' | 'project-highlight';
    title: string;
    expIdx?: number;
    bulletIdx?: number;
    projIdx?: number;
    itemIdx?: number;
    fields: PopupField[];
  }

  const [popupModal, setPopupModal] = useState<PopupModalConfig | null>(null);

  // Suggested skills to add
  const [suggestedSkills, setSuggestedSkills] = useState(() => {
    if (initialData.readinessAssessment?.suggestedSkills) {
      return initialData.readinessAssessment.suggestedSkills.map(s => ({
        name: s.name,
        added: false,
        reason: s.reason
      }));
    }
    return [
      { name: 'REST APIs', added: false, reason: 'Recommended based on projects' },
      { name: 'JWT Authentication', added: false, reason: 'Security standard for full-stack apps' },
      { name: 'Responsive Design', added: false, reason: 'Bento layout responsive integration' },
      { name: 'State Management', added: false, reason: 'Optimizes state updates in React' }
    ];
  });

  // Missing info recommendations
  const [missingInfo, setMissingInfo] = useState([
    { key: 'github', label: 'GitHub Link', value: data.socials.github || '', desc: 'Adding GitHub allows recruiters to explore your active repositories directly.', added: !!data.socials.github },
    //   { key: 'photo', label: 'Profile Photo URL', value: '', desc: 'Including a professional photo boosts dashboard views and personalization.', added: false },
    { key: 'deploy', label: 'Project Deployment Links', value: '', desc: 'Adding direct links allows recruiters to review live product implementations.', added: false }
  ]);

  // Rewrite Style animation
  const [rewritingStyle, setRewritingStyle] = useState<string | null>(null);

  // Trigger score update when changes are accepted
  useEffect(() => {
    let acceptCount = 0;
    if (aboutAccepted) acceptCount += 2;
    Object.values(experienceAcceptance).forEach(v => { if (v) acceptCount += 1; });
    Object.values(projectAcceptance).forEach(v => { if (v) acceptCount += 1; });

    const scoreBoost = Math.min(acceptCount * 2.5, 20);
    setScore(Math.min(Math.round(baseScore + scoreBoost), 100));
    setBreakdown({
      writing: Math.min(Math.round(baseBreakdown.writing + scoreBoost * 1.2), 100),
      techDepth: Math.min(Math.round(baseBreakdown.techDepth + scoreBoost * 0.8), 100),
      recruiterAppeal: Math.min(Math.round(baseBreakdown.recruiterAppeal + scoreBoost * 1.1), 100),
      readiness: Math.min(Math.round(baseBreakdown.readiness + scoreBoost), 100),
      ats: Math.min(Math.round(baseBreakdown.ats + scoreBoost * 1.3), 100),
      storytelling: Math.min(Math.round(baseBreakdown.storytelling + scoreBoost * 0.5), 100)
    });
  }, [aboutAccepted, experienceAcceptance, projectAcceptance, baseScore, baseBreakdown, setScore, setBreakdown]);

  // Map original bullet styles for Experience Section
  const getOriginalBullet = (_expIndex: number, bulletIndex: number) => {
    // Fallback original drafts matching experience role
    if (bulletIndex === 0) return "Worked on backend APIs and helped write code.";
    if (bulletIndex === 1) return "Did database indexing to make database queries run faster.";
    return "Assisted in code deployments and team planning.";
  };

  const getOriginalProjectDesc = (p: ProjectItem) => {
    return `${p.name} codebase built using ${p.techStack.join(' & ')}. Includes charts and database integrations.`;
  };

  const getOriginalAbout = () => {
    return `I am a ${data.basics.professionalTitle || 'Software Engineer'} interested in web development. I like to write backend APIs and frontend UI pages.`;
  };

  // Rewrite style handler
  const handleRewriteAll = (styleKey: keyof typeof REWRITE_STYLES) => {
    setRewritingStyle(styleKey);
    setTimeout(() => {
      const preset = REWRITE_STYLES[styleKey];

      // Map experience bullets
      const updatedExperience = data.experience.map(exp => ({
        ...exp,
        bullets: exp.bullets.map((_b, idx) => {
          if (idx === 0) return preset.bullets.api;
          if (idx === 1) return preset.bullets.query;
          return preset.bullets.migration;
        })
      }));

      // Map projects
      const updatedProjects = data.projects.map(p => ({
        ...p,
        portfolioTagline: `A high-performance ${p.name} configured for ${styleKey} applications.`
      }));

      setData(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          tagline: preset.tagline,
          bio: preset.bio,
        },
        experience: updatedExperience,
        projects: updatedProjects,
        personalityTone: styleKey
      }));

      setAboutAccepted(true);

      // Auto accept all bullets
      const expAcc: Record<string, boolean> = {};
      data.experience.forEach((_, eIdx) => {
        data.experience[eIdx].bullets.forEach((_, bIdx) => {
          expAcc[`${eIdx}-${bIdx}`] = true;
        });
      });
      setExperienceAcceptance(expAcc);

      setRewritingStyle(null);
    }, 1200);
  };

  // Add a suggested skill
  const handleAddSkill = (skillName: string, idx: number) => {
    const updatedSkills = [...suggestedSkills];
    updatedSkills[idx].added = true;
    setSuggestedSkills(updatedSkills);

    // Append to programming or backend skills
    setData(prev => {
      const skillsCopy = [...prev.skills];
      if (skillsCopy.length > 0) {
        skillsCopy[0] = {
          ...skillsCopy[0],
          items: [...skillsCopy[0].items, skillName]
        };
      }
      return { ...prev, skills: skillsCopy };
    });
  };

  // Update missing info value
  const handleSaveMissingInfo = (key: string, value: string, idx: number) => {
    if (!value.trim()) return;
    const updated = [...missingInfo];
    updated[idx].added = true;
    updated[idx].value = value;
    setMissingInfo(updated);

    setData(prev => {
      if (key === 'github') {
        return {
          ...prev,
          socials: { ...prev.socials, github: value }
        };
      }
      return prev;
    });
  };

  // Final confirmation
  const handleAcceptAll = () => {
    setAboutAccepted(true);

    // Accept all experience bullets
    const expAcc: Record<string, boolean> = {};
    data.experience.forEach((_, eIdx) => {
      data.experience[eIdx].bullets.forEach((_, bIdx) => {
        expAcc[`${eIdx}-${bIdx}`] = true;
      });
    });
    setExperienceAcceptance(expAcc);

    // Accept all projects
    const projAcc: Record<string, boolean> = {};
    data.projects.forEach((_, pIdx) => {
      projAcc[pIdx.toString()] = true;
    });
    setProjectAcceptance(projAcc);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#070709] text-gray-200 z-50 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">

      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-900/5 rounded-full filter blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-950/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* HEADER BAR */}
      <header className="w-full border-b border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            className="p-2 border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl transition text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white font-heading leading-tight flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>AI Content Enhancement</span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Our AI analyzed your resume and generated stronger, recruiter-friendly content. Review every suggestion before publishing your portfolio.
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 border border-white/15 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition"
          >
            Accept All Improvements
          </button>
          <button
            onClick={() => onNext(data)}
            className="px-5 py-2.5 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-purple-950/30 transition transform hover:scale-[1.02]"
          >
            <span>Continue to Design</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* SPLIT PANEL LAYOUT */}
      <div className="flex-grow flex overflow-hidden">

        {/* LEFT PANEL: Original & Improvements View */}
        <div className="w-full lg:w-3/5 h-full overflow-y-auto p-6 space-y-8 scrollbar-thin">

          {/* SECTION 6: AI REWRITE STYLES preset block */}
          <div className="glass-panel border-purple-500/20 bg-purple-950/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles className="h-40 w-40 text-purple-400" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-purple-900/40 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Activity className="h-3 w-3 animate-pulse" />
                  <span>AI Rewrite Presets</span>
                </span>
                <span className="text-xs font-semibold text-gray-400 font-mono">Tone: <strong className="text-purple-400">{data.personalityTone || 'Developer'}</strong></span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white font-heading">Apply Career Tone Writing Styles</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-xl leading-normal">
                  Instantly rewrite the About Summary, Project Descriptions, and Experience lists to match specific industry profiles.
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1.5">
                {Object.keys(REWRITE_STYLES).map(styleKey => (
                  <button
                    key={styleKey}
                    onClick={() => handleRewriteAll(styleKey as any)}
                    className={`py-2 px-1 text-center font-semibold rounded-lg text-[10px] border transition ${data.personalityTone === styleKey
                        ? 'bg-purple-950/20 border-purple-500/50 text-purple-400'
                        : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {styleKey}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 1: ABOUT ME ENHANCEMENT */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <User className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">About Me Alignment</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold">// section 1</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original About Column */}
              <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Original Raw Text</span>
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  "{getOriginalAbout()}"
                </p>
              </div>

              {/* Improved About Column */}
              <div className="bg-purple-950/10 border border-purple-500/10 p-4 rounded-xl space-y-3 relative">
                <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider flex items-center justify-between">
                  <span>AI Enhanced Summary</span>
                  {aboutAccepted && <span className="text-[9px] text-green-400 font-mono bg-green-950/30 px-2 py-0.5 rounded-full">Accepted</span>}
                </span>

                 <>
                  <h4 className="text-xs font-bold text-white">
                    "{(() => {
                      const tagRaw = data.basics.tagline as any;
                      return tagRaw && typeof tagRaw === 'object' 
                        ? `${tagRaw.heading} - ${tagRaw.explanation}` 
                        : tagRaw;
                    })()}"
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">{data.basics.bio}</p>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-white/5 mt-2">
                    <button
                      onClick={() => setAboutAccepted(!aboutAccepted)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 ${aboutAccepted
                          ? 'bg-green-950/20 border border-green-500/20 text-green-400'
                          : 'bg-purple-650 hover:bg-purple-700 text-white'
                        }`}
                    >
                      <Check className="h-3 w-3" />
                      <span>{aboutAccepted ? 'Accepted' : 'Accept suggestion'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const tagRaw = data.basics.tagline as any;
                        setPopupModal({
                          type: 'about',
                          title: 'Edit Profile Summary',
                          fields: [
                            {
                              key: 'taglineHeading',
                              label: 'Profile Tagline Heading',
                              value: tagRaw && typeof tagRaw === 'object' ? tagRaw.heading : data.basics.professionalTitle || '',
                              type: 'text'
                            },
                            {
                              key: 'taglineExplanation',
                              label: 'Profile Tagline Explanation',
                              value: tagRaw && typeof tagRaw === 'object' ? tagRaw.explanation : typeof tagRaw === 'string' ? tagRaw : '',
                              type: 'text'
                            },
                            {
                              key: 'bio',
                              label: 'About Biography Summary',
                              value: data.basics.bio,
                              type: 'textarea'
                            }
                          ]
                        });
                      }}
                      className="px-3 py-1.5 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 transition"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </>
              </div>
            </div>
          </div>

          {/* SECTION 2: EXPERIENCE BULLET ENHANCEMENT */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Experience Narratives Polish</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold">// section 2</span>
            </div>

            <div className="space-y-6">
              {data.experience.map((exp, eIdx) => (
                <div key={exp.company + exp.role} className="space-y-4">
                  <div className="flex justify-between items-center bg-black/10 px-3.5 py-2 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-white">{exp.role} @ {exp.company}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{exp.duration}</span>
                  </div>

                  <div className="space-y-4 pl-2 border-l border-purple-500/20 ml-2">
                    {exp.bullets.map((bullet, bIdx) => {
                      const itemKey = `${eIdx}-${bIdx}`;
                      const isAccepted = experienceAcceptance[itemKey];

                      return (
                        <div key={bIdx} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Original Bullet */}
                          <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                            <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">Original Raw Bullet</span>
                            <p className="text-gray-400 leading-relaxed italic mt-1.5">
                              "{getOriginalBullet(eIdx, bIdx)}"
                            </p>
                          </div>

                          {/* Improved Bullet with highlighters */}
                          <div className="bg-purple-950/10 border border-purple-500/10 p-3 rounded-xl flex flex-col justify-between relative">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] uppercase font-bold text-purple-400 tracking-wider">AI Polished Bullet</span>
                                {isAccepted && <span className="text-[8px] text-green-400 font-mono bg-green-950/30 px-1.5 py-0.5 rounded-full">Accepted</span>}
                              </div>
                              <p className="text-gray-300 leading-relaxed mt-1.5">
                                {highlightBulletText(bullet)}
                              </p>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2 border-t border-white/5 mt-2.5">
                              <button
                                onClick={() => {
                                  setExperienceAcceptance(prev => ({
                                    ...prev,
                                    [itemKey]: !prev[itemKey]
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded text-[9px] font-bold transition flex items-center space-x-1 ${isAccepted
                                    ? 'bg-green-950/20 border border-green-500/20 text-green-400'
                                    : 'bg-purple-650 hover:bg-purple-700 text-white'
                                  }`}
                              >
                                <Check className="h-2.5 w-2.5" />
                                <span>{isAccepted ? 'Accepted' : 'Accept bullet'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPopupModal({
                                    type: 'experience',
                                    title: `Edit Experience Bullet`,
                                    expIdx: eIdx,
                                    bulletIdx: bIdx,
                                    fields: [
                                      {
                                        key: 'bullet',
                                        label: `Bullet Point (${exp.role} @ ${exp.company})`,
                                        value: bullet,
                                        type: 'textarea'
                                      }
                                    ]
                                  });
                                }}
                                className="px-2.5 py-1 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded text-[9px] font-bold flex items-center space-x-1 transition"
                              >
                                <Edit3 className="h-2.5 w-2.5" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: PROJECTS NARRATIVE Polish */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Projects Showcase Enhancements</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold">// section 3</span>
            </div>

            <div className="space-y-6">
              {data.projects.map((proj, pIdx) => {
                const isAccepted = projectAcceptance[pIdx];

                return (
                  <div key={proj.name} className="space-y-4 border border-white/5 bg-[#09090b]/40 p-4 rounded-xl">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h4 className="font-bold text-xs text-white">{proj.name}</h4>
                      <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono">{proj.techStack.slice(0, 3).join(', ')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Original description column */}
                      <div className="bg-black/20 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">Original Raw Description</span>
                        <p className="text-gray-400 leading-relaxed italic mt-1.5">
                          "{getOriginalProjectDesc(proj)}"
                        </p>
                      </div>

                      {/* AI Enhanced description column */}
                      <div className="bg-purple-950/10 border border-purple-500/10 p-3 rounded-xl flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] uppercase font-bold text-purple-400 tracking-wider">AI Enhanced Version</span>
                            {isAccepted && <span className="text-[8px] text-green-400 font-mono bg-green-950/30 px-1.5 py-0.5 rounded-full">Accepted</span>}
                          </div>
                          <p className="text-gray-300 leading-relaxed mt-1.5">
                            {proj.description}
                          </p>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-white/5 mt-2.5">
                          <button
                            onClick={() => {
                              setProjectAcceptance(prev => ({
                                ...prev,
                                [pIdx]: !prev[pIdx]
                              }));
                            }}
                            className={`px-2.5 py-1 rounded text-[9px] font-bold transition flex items-center space-x-1 ${isAccepted
                                ? 'bg-green-950/20 border border-green-500/20 text-green-400'
                                : 'bg-purple-650 hover:bg-purple-700 text-white'
                              }`}
                          >
                            <Check className="h-2.5 w-2.5" />
                            <span>{isAccepted ? 'Accepted' : 'Accept changes'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setPopupModal({
                                type: 'project-desc',
                                title: `Edit Project Description`,
                                projIdx: pIdx,
                                fields: [
                                  {
                                    key: 'description',
                                    label: `Description for ${proj.name}`,
                                    value: proj.description,
                                    type: 'textarea'
                                  }
                                ]
                              });
                            }}
                            className="px-2.5 py-1 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white rounded text-[9px] font-bold flex items-center space-x-1 transition"
                          >
                            <Edit3 className="h-2.5 w-2.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* AI Sub narratives (Problem Statement, Key Features, Tech Highlights, Tagline) */}
                    <div className="bg-[#0b0b0d] border border-white/5 rounded-xl p-4 space-y-4">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 block border-b border-white/5 pb-1">AI Generated Bento Meta Details</span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] text-gray-500 uppercase font-bold">Problem Statement</label>
                            <button
                              onClick={() => {
                                setPopupModal({
                                  type: 'project-problem',
                                  title: `Edit Problem Statement`,
                                  projIdx: pIdx,
                                  fields: [
                                    {
                                      key: 'problem',
                                      label: `Problem Statement for ${proj.name}`,
                                      value: proj.problemStatement || '',
                                      type: 'textarea'
                                    }
                                  ]
                                });
                              }}
                              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <div className="w-full bg-[#121215] border border-white/5 px-3 py-2 rounded-lg text-gray-300 text-[11px] leading-relaxed min-h-[50px] whitespace-pre-wrap select-text">
                            {proj.problemStatement || <span className="text-gray-600 italic">No problem statement defined.</span>}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] text-gray-500 uppercase font-bold">Bento Tagline</label>
                            <button
                              onClick={() => {
                                setPopupModal({
                                  type: 'project-tagline',
                                  title: `Edit Bento Tagline`,
                                  projIdx: pIdx,
                                  fields: [
                                    {
                                      key: 'tagline',
                                      label: `Bento Tagline for ${proj.name}`,
                                      value: proj.portfolioTagline || '',
                                      type: 'text'
                                    }
                                  ]
                                });
                              }}
                              className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                          <div className="w-full bg-[#121215] border border-white/5 px-3 py-2.5 rounded-lg text-gray-300 text-[11px] truncate select-text">
                            {proj.portfolioTagline || <span className="text-gray-600 italic">No tagline defined.</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-gray-500 uppercase font-bold">Key features (Bento lists)</label>
                          <div className="space-y-1">
                            {proj.keyFeatures?.map((kf, kIdx) => (
                              <div key={kIdx} className="flex items-center justify-between bg-[#121215] border border-white/5 px-3 py-1.5 rounded-lg text-gray-300 text-[10px]">
                                <span className="truncate select-text">{kf}</span>
                                <button
                                  onClick={() => {
                                    setPopupModal({
                                      type: 'project-feature',
                                      title: `Edit Key Feature`,
                                      projIdx: pIdx,
                                      itemIdx: kIdx,
                                      fields: [
                                        {
                                          key: 'feature',
                                          label: `Feature #${kIdx + 1} for ${proj.name}`,
                                          value: kf,
                                          type: 'text'
                                        }
                                      ]
                                    });
                                  }}
                                  className="text-gray-500 hover:text-purple-400 ml-2"
                                  title="Edit feature"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] text-gray-500 uppercase font-bold">Technical Highlights</label>
                          <div className="space-y-1">
                            {proj.technicalHighlights?.map((th, tIdx) => (
                              <div key={tIdx} className="flex items-center justify-between bg-[#121215] border border-white/5 px-3 py-1.5 rounded-lg text-gray-300 text-[10px]">
                                <span className="truncate select-text">{th}</span>
                                <button
                                  onClick={() => {
                                    setPopupModal({
                                      type: 'project-highlight',
                                      title: `Edit Technical Highlight`,
                                      projIdx: pIdx,
                                      itemIdx: tIdx,
                                      fields: [
                                        {
                                          key: 'highlight',
                                          label: `Highlight #${tIdx + 1} for ${proj.name}`,
                                          value: th,
                                          type: 'text'
                                        }
                                      ]
                                    });
                                  }}
                                  className="text-gray-500 hover:text-purple-400 ml-2"
                                  title="Edit highlight"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: SKILLS GROUPING & AI SUGGESTIONS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Toolbox & Recommended Skills</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold">// section 4</span>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Current Skill Categories</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.skills.map(cat => (
                  <div key={cat.category} className="bg-black/20 border border-white/5 p-3.5 rounded-xl space-y-2">
                    <h5 className="font-bold text-[11px] text-purple-300 uppercase tracking-wider font-mono">{cat.category}</h5>
                    <div className="flex flex-wrap gap-1">
                      {cat.items.map(s => (
                        <span key={s} className="bg-black/40 text-gray-300 text-[9px] px-1.5 py-0.5 rounded border border-white/[0.03]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Recommended skills based on projects */}
              <div className="pt-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-2.5">AI Detected Project Skill Recommendations</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedSkills.map((sk, idx) => (
                    <div
                      key={sk.name}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${sk.added
                          ? 'bg-green-950/15 border-green-500/25 opacity-70'
                          : 'bg-black/30 border-white/5'
                        }`}
                    >
                      <div>
                        <h6 className="text-[11px] font-bold text-white">{sk.name}</h6>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-normal">{sk.reason}</p>
                      </div>

                      {sk.added ? (
                        <span className="p-1.5 bg-green-500/20 text-green-400 rounded-full">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddSkill(sk.name, idx)}
                          className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                          title="Add to Toolbox"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: MISSING INFORMATION FOR PORTFOLIO */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Completeness Recommendations</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono font-bold">// section 5</span>
            </div>

            <div className="space-y-4">
              {missingInfo.map((info, idx) => (
                <div
                  key={info.key}
                  className={`p-4 rounded-xl border space-y-2.5 transition ${info.added
                      ? 'bg-green-950/10 border-green-500/20'
                      : 'bg-black/35 border-white/5'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${info.added ? 'bg-green-400' : 'bg-yellow-400 animate-ping'}`} />
                        <span>Recommendation: Add {info.label}</span>
                      </h5>
                      <p className="text-[10px] text-gray-400 leading-normal mt-0.5">{info.desc}</p>
                    </div>
                    {info.added && <span className="text-[9px] text-green-400 font-mono bg-green-950/40 px-2 py-0.5 rounded-full font-bold">Injected</span>}
                  </div>

                  {!info.added && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={`Enter ${info.label}...`}
                        id={`input-missing-${info.key}`}
                        className="flex-grow px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-white text-[11px] placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => {
                          const inputEl = document.getElementById(`input-missing-${info.key}`) as HTMLInputElement;
                          if (inputEl) {
                            handleSaveMissingInfo(info.key, inputEl.value, idx);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Inject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Circular Score & AI Breakdown / Explanations */}
        <div className="hidden lg:block w-2/5 h-full border-l border-white/5 bg-black/40 p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin">

          {/* SECTION 8: RESUME SCORE CIRCLE & breakdown */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 p-6 rounded-2xl flex flex-col items-center text-center space-y-5">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">Overall Resume Score</h3>

            {/* Animated Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-gray-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-purple-600"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 62}
                  initial={{ strokeDashoffset: 2 * Math.PI * 62 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 62 * (1 - score / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white font-mono">{score}%</span>
                <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">Optimized quality</span>
              </div>
            </div>

            {/* score category bars */}
            <div className="w-full space-y-2.5 text-left text-[10px]">
              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Writing Quality</span>
                  <span className="font-mono text-purple-400">{breakdown.writing}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-purple-600 h-full rounded-full" animate={{ width: `${breakdown.writing}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Technical Depth</span>
                  <span className="font-mono text-purple-400">{breakdown.techDepth}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-blue-600 h-full rounded-full" animate={{ width: `${breakdown.techDepth}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Recruiter Appeal</span>
                  <span className="font-mono text-purple-400">{breakdown.recruiterAppeal}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-green-600 h-full rounded-full" animate={{ width: `${breakdown.recruiterAppeal}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Portfolio Readiness</span>
                  <span className="font-mono text-purple-400">{breakdown.readiness}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-yellow-600 h-full rounded-full" animate={{ width: `${breakdown.readiness}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>ATS Compatibility</span>
                  <span className="font-mono text-purple-400">{breakdown.ats}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-indigo-650 h-full rounded-full" animate={{ width: `${breakdown.ats}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-gray-400">
                  <span>Visual Storytelling</span>
                  <span className="font-mono text-purple-400">{breakdown.storytelling}%</span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <motion.div className="bg-pink-600 h-full rounded-full" animate={{ width: `${breakdown.storytelling}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 9: AI EXPLANATION - WHY WE MADE THESE CHANGES */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 p-5 rounded-2xl space-y-4">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
              <Info className="h-3.5 w-3.5" />
              <span>AI Modification Reasoning</span>
            </h4>

            <div className="space-y-3.5 text-xs">
              <div className="border-l-2 border-purple-500/40 pl-3 space-y-0.5">
                <h5 className="font-bold text-white">Active Verb Polish</h5>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Replaced passive descriptions (e.g. "helped build APIs") with direct action verbs ("Engineered scalable REST APIs") to match enterprise scanning standards.
                </p>
              </div>

              <div className="border-l-2 border-blue-500/40 pl-3 space-y-0.5">
                <h5 className="font-bold text-white">Technical Indexing</h5>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Injected missing framework references (Express, SQLite) to ensure ATS screening parsers score your experience matching high-density search profiles.
                </p>
              </div>

              <div className="border-l-2 border-green-500/40 pl-3 space-y-0.5">
                <h5 className="font-bold text-white">Impact/Metrics Focus</h5>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Added structured impact estimates (e.g. 40% performance gains) to prove real-world complexity and problem resolution to tech leads.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 7: RECRUITER PERSONALIZED RECOMMENDATIONS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 p-5 rounded-2xl space-y-4">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
              <Bookmark className="h-3.5 w-3.5" />
              <span>Recruiter Strategist Advice</span>
            </h4>

            <div className="space-y-2.5 text-[10px] leading-relaxed">
              <div className="bg-black/35 p-3 rounded-xl border border-white/5 flex gap-2">
                <ThumbsUp className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-white">Strongest project listed first</h6>
                  <p className="text-gray-400">Your competitive tracker contains dynamic external API logic, making it your highest conversion differentiator.</p>
                </div>
              </div>

              <div className="bg-black/35 p-3 rounded-xl border border-white/5 flex gap-2">
                <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h6 className="font-bold text-white">Consistent Tech keywords</h6>
                  <p className="text-gray-400">Ensure React is listed under skills, experiences, and project tags consistently to boost search index.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* REWRITING PROGRESS ANIMATION SHIELD */}
      <AnimatePresence>
        {rewritingStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#070709]/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Regenerating and polishing using {rewritingStyle} Style...</p>
            </div>
          </motion.div>
        )}

        {popupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-full h-full bg-[#070709]/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-lg glass-panel bg-[#121215]/95 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Edit3 className="h-24 w-24 text-purple-400" />
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-900/30 text-purple-400 rounded-xl">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">{popupModal.title}</h3>
                  <p className="text-[10px] text-gray-400">Modify the content before confirming and applying the changes.</p>
                </div>
              </div>

              <div className="space-y-4">
                {popupModal.fields.map((field, fIdx) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={field.value}
                        onChange={(e) => {
                          const updatedFields = [...popupModal.fields];
                          updatedFields[fIdx] = { ...updatedFields[fIdx], value: e.target.value };
                          setPopupModal({ ...popupModal, fields: updatedFields });
                        }}
                        rows={5}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/5 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none transition leading-relaxed resize-none select-text"
                      />
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => {
                          const updatedFields = [...popupModal.fields];
                          updatedFields[fIdx] = { ...updatedFields[fIdx], value: e.target.value };
                          setPopupModal({ ...popupModal, fields: updatedFields });
                        }}
                        className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/5 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none transition select-text"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setPopupModal(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const type = popupModal.type;
                    if (type === 'about') {
                      const taglineHeading = popupModal.fields.find(f => f.key === 'taglineHeading')?.value || '';
                      const taglineExplanation = popupModal.fields.find(f => f.key === 'taglineExplanation')?.value || '';
                      const bio = popupModal.fields.find(f => f.key === 'bio')?.value || '';
                      setData(prev => ({
                        ...prev,
                        basics: {
                          ...prev.basics,
                          tagline: { heading: taglineHeading, explanation: taglineExplanation },
                          bio
                        }
                      }));
                      setAboutAccepted(true);
                    } else if (type === 'experience') {
                      const bulletVal = popupModal.fields[0].value;
                      const expIdx = popupModal.expIdx!;
                      const bulletIdx = popupModal.bulletIdx!;
                      setData(prev => {
                        const expCopy = [...prev.experience];
                        const bulletsCopy = [...expCopy[expIdx].bullets];
                        bulletsCopy[bulletIdx] = bulletVal;
                        expCopy[expIdx] = { ...expCopy[expIdx], bullets: bulletsCopy };
                        return { ...prev, experience: expCopy };
                      });
                      setExperienceAcceptance(prev => ({
                        ...prev,
                        [`${expIdx}-${bulletIdx}`]: true
                      }));
                    } else if (type === 'project-desc') {
                      const descVal = popupModal.fields[0].value;
                      const projIdx = popupModal.projIdx!;
                      setData(prev => {
                        const projCopy = [...prev.projects];
                        projCopy[projIdx] = { ...projCopy[projIdx], description: descVal };
                        return { ...prev, projects: projCopy };
                      });
                      setProjectAcceptance(prev => ({
                        ...prev,
                        [projIdx]: true
                      }));
                    } else if (type === 'project-problem') {
                      const probVal = popupModal.fields[0].value;
                      const projIdx = popupModal.projIdx!;
                      setData(prev => {
                        const projCopy = [...prev.projects];
                        projCopy[projIdx] = { ...projCopy[projIdx], problemStatement: probVal };
                        return { ...prev, projects: projCopy };
                      });
                    } else if (type === 'project-tagline') {
                      const taglineVal = popupModal.fields[0].value;
                      const projIdx = popupModal.projIdx!;
                      setData(prev => {
                        const projCopy = [...prev.projects];
                        projCopy[projIdx] = { ...projCopy[projIdx], portfolioTagline: taglineVal };
                        return { ...prev, projects: projCopy };
                      });
                    } else if (type === 'project-feature') {
                      const featureVal = popupModal.fields[0].value;
                      const projIdx = popupModal.projIdx!;
                      const itemIdx = popupModal.itemIdx!;
                      setData(prev => {
                        const projCopy = [...prev.projects];
                        const list = [...(projCopy[projIdx].keyFeatures || [])];
                        list[itemIdx] = featureVal;
                        projCopy[projIdx] = { ...projCopy[projIdx], keyFeatures: list };
                        return { ...prev, projects: projCopy };
                      });
                    } else if (type === 'project-highlight') {
                      const highlightVal = popupModal.fields[0].value;
                      const projIdx = popupModal.projIdx!;
                      const itemIdx = popupModal.itemIdx!;
                      setData(prev => {
                        const projCopy = [...prev.projects];
                        const list = [...(projCopy[projIdx].technicalHighlights || [])];
                        list[itemIdx] = highlightVal;
                        projCopy[projIdx] = { ...projCopy[projIdx], technicalHighlights: list };
                        return { ...prev, projects: projCopy };
                      });
                    }
                    setPopupModal(null);
                  }}
                  className="px-5 py-2.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/20 transition"
                >
                  Confirm & Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AIContentEnhancement;
