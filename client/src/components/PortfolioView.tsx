import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, Award, MessageSquare, Send, X, ExternalLink, ArrowRight, ArrowUpRight, Home, Sun, Menu } from 'lucide-react';
import { GitHubCalendar } from 'react-github-calendar';
import type { PortfolioData } from '../types.js';
import AICopilotSection from './AICopilotSection.js';

const mapThemeValueToName = (val: string): string => {
  switch (val) {
    case 'dark-glass':
    case 'dev': return 'Developer Pro';
    case 'minimal':
    case 'light-clean': return 'Minimal Modern';
    case 'glass': return 'Glassmorphism';
    case 'startup': return 'Startup Founder';
    case 'creative': return 'Creative Designer';
    case 'research': return 'Research Portfolio';
    case 'corp': return 'Corporate Professional';
    case 'cyberpunk': return 'Cyberpunk';
    case 'apple': return 'Apple Inspired';
    case 'notion': return 'Notion Style';
    case 'terminal': return 'Terminal Portfolio';
    default: return 'Developer Pro';
  }
};

const ensureAbsoluteUrl = (url: string | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^(mailto|tel):/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const parseTaglineParts = (tagline: string, professionalTitle: string) => {
  const trimmed = tagline.trim().replace(/\.$/, '');
  
  // Define split markers in order of preference
  const markers = [
    { key: ' with a focus on ', replacement: 'With a focus on ' },
    { key: ' specializing in ', replacement: 'Specializing in ' },
    { key: ' focusing on ', replacement: 'Focusing on ' },
    { key: ' to ', replacement: 'To ' },
    { key: ' and ', replacement: 'And ' },
    { key: ' building ', replacement: 'Building ' },
    { key: ',', replacement: '' }
  ];

  for (const marker of markers) {
    const idx = trimmed.toLowerCase().indexOf(marker.key);
    if (idx !== -1) {
      const headingPart = trimmed.slice(0, idx).trim();
      const explanationPart = trimmed.slice(idx + marker.key.length).trim();
      
      const explanationCapitalized = explanationPart.charAt(0).toUpperCase() + explanationPart.slice(1);
      
      let finalExplanation = explanationCapitalized;
      if (marker.replacement && !explanationCapitalized.toLowerCase().startsWith(marker.replacement.toLowerCase())) {
        finalExplanation = marker.replacement + explanationCapitalized.charAt(0).toLowerCase() + explanationCapitalized.slice(1);
      }

      const formattedHeading = headingPart.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const headingWordCount = formattedHeading.split(/\s+/).length;
      
      if (headingWordCount >= 2 && headingWordCount <= 6) {
        return {
          heading: formattedHeading,
          explanation: finalExplanation + '.'
        };
      }
    }
  }

  // Word-based split fallback
  const words = trimmed.split(/\s+/);
  if (words.length >= 5) {
    const splitIdx = words.length >= 6 ? 4 : 3;
    const headingPart = words.slice(0, splitIdx).join(' ');
    const explanationPart = words.slice(splitIdx).join(' ');
    
    const formattedHeading = headingPart.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const formattedExplanation = explanationPart.charAt(0).toUpperCase() + explanationPart.slice(1) + '.';
    
    return {
      heading: formattedHeading,
      explanation: formattedExplanation
    };
  }

  const formattedHeading = professionalTitle.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    heading: formattedHeading || 'Systems Architecture & Design',
    explanation: trimmed + '.'
  };
};

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const selectLast60Days = (contributions: any[]) => {
  return contributions.slice(-60);
};


interface PortfolioViewProps {
  slug: string;
  isPreview?: boolean;
  previewData?: PortfolioData;
  highlightedSection?: string;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ slug, isPreview = false, previewData, highlightedSection }) => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Project Challenges modal state
  const [activeModalProject, setActiveModalProject] = useState<any | null>(null);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);



  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const fetchPortfolio = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/portfolio/p/${slug}`);
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to fetch portfolio data.');
      }
      const profileData = resData.profileData;
      if (profileData) {
        if (resData.theme) {
          profileData.themeName = mapThemeValueToName(resData.theme);
        }
        if (!profileData.colorAccent) {
          profileData.colorAccent = '#9333ea';
        }
        if (!profileData.layoutStyle) {
          profileData.layoutStyle = 'Hero Centered';
        }
        if (!profileData.animationStyle) {
          profileData.animationStyle = 'Smooth Fade';
        }
      }
      setData(profileData);
    } catch (err: any) {
      setError(err.message || 'Error connecting to portfolio host.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPreview && previewData) {
      setData(previewData);
      setLoading(false);
    } else {
      fetchPortfolio();
    }
  }, [slug, isPreview, previewData]);



  // Load custom typography preview links dynamically
  useEffect(() => {
    if (data?.fontFamilyHeading) {
      const fontName = data.fontFamilyHeading.split(',')[0].replace(/['"]/g, '');
      const linkId = 'portfolio-view-google-fonts';
      let linkElement = document.getElementById(linkId) as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.id = linkId;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
      }
      linkElement.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}&display=swap`;
    }
  }, [data]);

  // Handle modal escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalProject(null);
      }
    };
    if (activeModalProject) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalProject]);



  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactSuccess('');

    // Simulate standard contact message submission
    setTimeout(() => {
      setContactSuccess('Your message was delivered successfully!');
      setContactName('');
      setContactEmail('');
      setContactMsg('');
      setContactLoading(false);
    }, 1000);
  };

  const handleDownloadResume = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (data?.resumePdfBase64) {
      e.preventDefault();
      try {
        const base64Content = data.resumePdfBase64;
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${basics.name.replace(/\s+/g, '_')}_Resume.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to download resume PDF:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-900/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 font-medium">Baking Bento Layout...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-center">
        <X className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Failed to load Portfolio</h2>
        <p className="text-gray-400 mt-2 max-w-sm">{error || 'Portfolio page does not exist.'}</p>
        <a href="/" className="mt-6 px-6 py-3 bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-semibold transition">
          Return Home
        </a>
      </div>
    );
  }

  const { basics, skills, experience, projects, achievements, socials = {}, githubData } = data;
  const githubUsername = socials.github?.match(/github\.com\/([^/]+)/)?.[1];

  const accentColor = data.colorAccent || '#9333ea';
  const fontFamily = data.fontFamilyBody || 'inherit';

  const getThemeClass = () => {
    switch (data.themeName) {
      case 'Apple Inspired': return 'theme-apple';
      case 'Notion Style': return 'theme-notion';
      case 'Terminal Portfolio': return 'theme-terminal';
      case 'Cyberpunk': return 'theme-cyberpunk';
      case 'Minimal Modern': return 'theme-minimal';
      case 'Research Portfolio': return 'theme-research';
      case 'Corporate Professional': return 'theme-corp';
      case 'Creative Designer': return 'theme-creative';
      case 'Startup Founder': return 'theme-startup';
      case 'Glassmorphism': return 'theme-glass';
      default: return '';
    }
  };

  const getLayoutClass = () => {
    switch (data.layoutStyle) {
      case 'Hero Centered': return 'layout-centered';
      case 'Sidebar Navigation': return 'layout-sidebar';
      case 'Landing Page Style': return 'layout-landing';
      case 'Timeline Layout': return 'layout-timeline';
      case 'Developer Dashboard': return 'layout-dashboard';
      case 'Split Screen': return 'layout-split';
      case 'Minimal': return 'layout-minimal';
      case 'Scrolling Story': return 'layout-story';
      default: return 'layout-centered';
    }
  };

  const getAnimationClass = () => {
    switch (data.animationStyle) {
      case 'Minimal Motion': return 'anim-minimal';
      case 'Smooth Fade': return 'anim-fade';
      case 'Modern Glass': return 'anim-glass-hover';
      case 'Floating Cards': return 'anim-float';
      case '3D Hover': return 'anim-3d';
      case 'Parallax': return 'anim-parallax';
      case 'Gradient Glow': return 'anim-glow';
      default: return 'anim-fade';
    }
  };

  const renderAboutSection = () => (
    <section id="about" key="about" className={`py-4 space-y-4 transition-all duration-500 rounded-3xl ${highlightedSection === 'about' ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.6)] scale-[1.01] bg-purple-950/10' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: About Me (Span 7) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-8 rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// background</span>
                <h3 className="text-2xl font-bold text-white font-heading">About Me</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {basics.bio}
              </p>
            </div>
            {basics.location && (
              <div className="pt-4 text-xs text-gray-500 flex items-center gap-2 border-t border-white/5">
                <span>📍</span> <span>{basics.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: GitHub Contribution & Stats (Span 5) */}
        <div className="lg:col-span-5">
          {githubUsername ? (
            <div className="glass-panel p-8 rounded-3xl space-y-6 h-full flex flex-col justify-between bg-black/10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    <h3 className="text-xl font-bold text-white font-heading">GitHub Activity</h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-950/40 border border-purple-800/30 text-purple-400 font-mono">
                    Last 60 Days
                  </span>
                </div>

                {/* GitHub Contribution Calendar */}
                {githubUsername ? (
                  <div className="flex justify-center bg-gray-900/10 border border-gray-900/40 p-4 rounded-xl overflow-x-auto w-full select-none">
                    <div className="scale-95 origin-center">
                      <GitHubCalendar 
                        username={githubUsername} 
                        colorScheme="dark"
                        transformData={selectLast60Days}
                        showTotalCount={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-zinc-800 rounded-xl">
                    No GitHub profile linked to display contributions.
                  </div>
                )}
              </div>

              {githubData ? (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                  <div className="p-3 bg-zinc-900/30 border border-white/5 rounded-xl text-center">
                    <p className="text-lg font-bold text-white">{githubData.stats.stars}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Stars</p>
                  </div>
                  <div className="p-3 bg-zinc-900/30 border border-white/5 rounded-xl text-center">
                    <p className="text-lg font-bold text-white">{githubData.stats.forks}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Forks</p>
                  </div>
                  <div className="p-3 bg-zinc-900/30 border border-white/5 rounded-xl text-center">
                    <p className="text-lg font-bold text-white">{githubData.stats.totalRepos}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Repos</p>
                  </div>
                </div>
              ) : (
                <div className="pt-2 text-center text-[10px] text-gray-500 border-t border-white/5 font-mono">
                  // synchronized with live profile
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl text-center text-gray-500 h-full flex items-center justify-center">
              <p>GitHub username not provided.</p>
            </div>
          )}
        </div>

        {/* Core Competencies (Span 12) */}
        <div className={`lg:col-span-12 transition-all duration-500 rounded-3xl ${highlightedSection === 'skills' ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.6)] scale-[1.01] bg-purple-950/10' : ''}`}>
          <div className="glass-panel p-8 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// stack</span>
                <h3 className="text-2xl font-bold text-white font-heading">Core Competencies</h3>
              </div>
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">{skills.length} categories</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {skills.map((skillCat, index) => (
                <div key={index} className="space-y-3 p-4 bg-zinc-900/30 border border-white/5 rounded-2xl">
                  <h4 className="font-bold text-xs text-purple-300 uppercase tracking-wider font-mono">{skillCat.category}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skillCat.items.map((skill, sIdx) => (
                      <span key={sIdx} className="bg-zinc-900 text-gray-300 text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.03] hover:border-purple-500/30 transition">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );

  const renderProjectsSection = () => (
    <section id="projects" className={`py-4 space-y-4 transition-all duration-500 rounded-3xl ${highlightedSection === 'projects' ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.6)] scale-[1.01] bg-purple-950/10' : ''}`}>
      <div className="space-y-1">
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// codebases</span>
        <h3 className="text-2xl font-extrabold text-white tracking-tight font-heading">Featured Engineering Projects</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-purple-500/20 transition duration-300">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-white font-heading">{project.name}</h4>
                <div className="flex space-x-2 shrink-0">
                  {project.githubLink && (
                    <a href={ensureAbsoluteUrl(project.githubLink)} target="_blank" rel="noreferrer" className="p-1.5 border border-white/5 hover:border-white/20 bg-zinc-900/50 rounded-lg text-gray-400 hover:text-white transition">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    </a>
                  )}
                  {project.liveLink && (
                    <a href={ensureAbsoluteUrl(project.liveLink)} target="_blank" rel="noreferrer" className="p-1.5 border border-white/5 hover:border-white/20 bg-zinc-900/50 rounded-lg text-gray-400 hover:text-purple-400 transition">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 font-medium leading-relaxed">{project.description}</p>
              
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.map((tech, tIdx) => (
                  <span key={tIdx} className="bg-zinc-900 text-gray-400 border border-white/[0.04] text-[10px] px-2 py-0.5 rounded font-mono">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <button
                onClick={() => setActiveModalProject(project)}
                className="flex items-center justify-between w-full text-xs text-purple-400 hover:text-purple-300 font-bold transition focus:outline-none cursor-pointer group"
              >
                <span>Explore System Challenges</span>
                <ArrowRight className="h-3 w-3 transform group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderExperienceSection = () => (
    <section id="experience" className={`py-4 space-y-4 transition-all duration-500 rounded-3xl ${highlightedSection === 'experience' ? 'ring-4 ring-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.6)] scale-[1.01] bg-purple-950/10' : ''}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Timeline (Span 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// timeline</span>
            <div className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5 text-purple-400" />
              <h3 className="text-2xl font-bold text-white font-heading">Experiences &amp; Extracurriculars</h3>
            </div>
          </div>
          
          <div className="relative pl-6 border-l border-white/5 space-y-6 max-h-[500px] overflow-y-auto pr-2">
            {experience.map((exp, idx) => (
              <div key={idx} className="relative space-y-2 pb-2">
                <div className="absolute top-1.5 left-0 -translate-x-[29px] w-3 h-3 bg-purple-500 rounded-full border-2 border-background-dark shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                <div className="flex flex-col sm:flex-row justify-between text-sm sm:items-center">
                  <h4 className="font-bold text-white text-base font-heading">{exp.role} @ {exp.company}</h4>
                  <span className="text-xs text-gray-500 font-mono font-semibold">{exp.duration}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-400 text-xs leading-relaxed">
                  {exp.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
                {exp.techStack && exp.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exp.techStack.map((tech, tIdx) => (
                      <span key={tIdx} className="bg-purple-950/20 text-purple-300 border border-purple-500/10 text-[10px] px-2 py-0.5 rounded font-mono">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Achievements (Span 5) */}
        <div className="lg:col-span-5 space-y-6 lg:border-l lg:border-white/5 lg:pl-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// highlights</span>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-400" />
                <h3 className="text-2xl font-bold text-white font-heading">Achievements</h3>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {achievements && achievements.length > 0 ? (
                achievements.map((ach, idx) => (
                  <div key={idx} className="space-y-2 p-4 bg-zinc-900/20 border border-white/[0.03] rounded-xl hover:border-purple-500/10 transition">
                    <p className="font-bold text-xs text-gray-200">{ach.title}</p>
                    {ach.description && <p className="text-[10px] text-gray-400 leading-relaxed mt-1">{ach.description}</p>}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-xs bg-zinc-900/20 border border-white/[0.03] rounded-xl">
                  No achievements listed.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );

  const renderName = () => {
    const parts = basics.name.trim().split(/\s+/);
    const firstWord = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() : '';
    const restOfName = parts.slice(1).join(' ');
    const secondWord = restOfName ? restOfName.charAt(0).toUpperCase() + restOfName.slice(1).toLowerCase() + '.' : '.';
    
    return (
      <h1 className="text-5xl sm:text-7xl md:text-[100px] lg:text-[120px] font-black tracking-tight text-white flex flex-col items-start font-heading leading-[0.95] select-text">
        <span className="block">{firstWord}</span>
        {secondWord && <span className="block">{secondWord}</span>}
      </h1>
    );
  };

  const renderTaglineBlock = () => {
    const fallbackTagline = `I engineer algorithmic systems at the intersection of mathematics and code.`;
    const tagline = basics.tagline || fallbackTagline;
    const { heading, explanation } = parseTaglineParts(tagline, basics.professionalTitle);
    
    return (
      <div className="space-y-3 max-w-xl text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-purple-400 tracking-tight leading-snug">
          &gt; {heading}
        </h2>
        <p className="text-sm sm:text-base text-gray-400 font-normal leading-relaxed">
          {explanation}
        </p>
      </div>
    );
  };

  const renderOrderedSections = () => {
    const rendered = new Set<string>();
    const order = data.sectionOrdering || ['Skills', 'Projects', 'Experience'];
    return (
      <div className="space-y-10">
        {order.map(name => {
          let mappedName = name;
          if (name === 'Skills' || name === 'About') mappedName = 'About';
          if (name === 'Experience' || name === 'Achievements' || name === 'Education') mappedName = 'Experience';
          
          if (rendered.has(mappedName)) return null;
          rendered.add(mappedName);

          if (mappedName === 'About') return renderAboutSection();
          if (mappedName === 'Projects') return renderProjectsSection();
          if (mappedName === 'Experience') return renderExperienceSection();
          return null;
        })}
      </div>
    );
  };

  const renderContactForm = () => (
    <div className="glass-panel p-0 rounded-3xl border border-white/5 flex flex-col w-full max-w-lg h-full overflow-hidden">
      {/* Window control bar */}
      <div className="bg-zinc-900/60 border-b border-white/5 px-4 py-3 flex justify-between items-center select-none">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
          <span className="w-3 h-3 rounded-full bg-[#27c93f]"></span>
        </div>
        <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
          <span>contact.ts</span>
          <span className="px-1 py-0.5 bg-purple-950 text-purple-300 text-[9px] font-bold rounded">TypeScript</span>
        </span>
        <div className="w-16"></div>
      </div>

      <div className="p-8 space-y-6 flex-grow flex flex-col justify-between bg-black/20 h-full">
        <div className="space-y-1">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// compiler</span>
          <h3 className="text-xl font-bold text-white font-heading">Submit Message</h3>
        </div>

        {contactSuccess && (
          <div className="p-4 bg-green-950/40 border border-green-500/30 text-green-400 text-xs font-mono rounded-xl animate-fadeIn">
            [SUCCESS] Message compiled successfully. Status code: 200 OK.
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4 font-mono text-xs flex-grow flex flex-col justify-between">
          <div className="p-5 bg-black border border-white/5 rounded-2xl space-y-4 flex-grow">
            
            {/* Name field */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1 border-b border-white/5">
              <span className="text-purple-400 font-bold shrink-0">const</span>
              <span className="text-blue-400 font-semibold shrink-0">senderName</span>
              <span className="text-white shrink-0">=</span>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={`"${basics.name}"`}
                className="flex-grow bg-transparent border-none text-purple-300 placeholder-gray-600 focus:outline-none p-1 text-xs"
              />
            </div>

            {/* Email field */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1 border-b border-white/5">
              <span className="text-purple-400 font-bold shrink-0">const</span>
              <span className="text-blue-400 font-semibold shrink-0">senderEmail</span>
              <span className="text-white shrink-0">=</span>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder='"you@example.com"'
                className="flex-grow bg-transparent border-none text-purple-300 placeholder-gray-600 focus:outline-none p-1 text-xs"
              />
            </div>

            {/* Message field */}
            <div className="flex flex-col gap-2 py-1">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 font-bold">const</span>
                <span className="text-blue-400 font-semibold">messageText</span>
                <span className="text-white">=</span>
              </div>
              <textarea
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder='`Describe your project proposal, role details, or other collaboration opportunities...`'
                className="w-full h-20 bg-transparent border-none text-purple-300 placeholder-gray-600 focus:outline-none p-1 text-xs resize-none leading-relaxed"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={contactLoading}
              className="px-6 py-3 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-purple-900/10"
            >
              <span>~/run submit_message.sh</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderContactSection = () => (
    <section id="contact" className="py-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Heading and direct contact buttons (Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-6 glass-panel p-6 rounded-3xl border border-white/5">
        <div className="space-y-4">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// connectivity</span>
          <div className="space-y-3 font-heading">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tight leading-[0.95] uppercase select-none">
              <span className="text-white block">Let's</span>
              <span className="text-purple-500 italic block mt-1">talk.</span>
            </h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Targeting Software Engineering, systems development, and problem solving opportunities. Open to discussions about system architecture, roles, or technical collaborations.
          </p>
        </div>

        {/* Quick links buttons - square format */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-2">Direct Channels</p>
          <div className="flex flex-wrap gap-3">
            {socials.linkedin && (
              <a 
                href={ensureAbsoluteUrl(socials.linkedin)} 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300"
                title="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            )}
            
            {socials.github && (
              <a 
                href={ensureAbsoluteUrl(socials.github)} 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300"
                title="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            )}

            {socials.twitter && (
              <a 
                href={ensureAbsoluteUrl(socials.twitter)} 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300"
                title="Twitter / X"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            )}

            {basics.email && (
              <a 
                href={`mailto:${basics.email}`} 
                className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300"
                title="Direct Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: reduced-width contact form (Span 7) */}
      <div className="lg:col-span-7 flex justify-end w-full h-full">
        {renderContactForm()}
      </div>
    </section>
  );

  const renderContactLeftPane = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest font-mono">// connectivity</span>
        <h3 className="text-3xl font-extrabold text-white font-heading">Get in Touch</h3>
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          Targeting Software Engineering, systems development, and problem solving opportunities.
        </p>
      </div>
      
      {/* Direct channel icons */}
      <div className="flex flex-wrap gap-3">
        {socials.linkedin && (
          <a href={ensureAbsoluteUrl(socials.linkedin)} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300">
            <Linkedin className="h-4.5 w-4.5" />
          </a>
        )}
        {socials.github && (
          <a href={ensureAbsoluteUrl(socials.github)} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-white transition duration-300">
            <Github className="h-4.5 w-4.5" />
          </a>
        )}
        {basics.email && (
          <a href={`mailto:${basics.email}`} className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 transition duration-300">
            <Mail className="h-4.5 w-4.5" />
          </a>
        )}
      </div>

      <div className="pt-2 w-full">
        {renderContactForm()}
      </div>
    </div>
  );

  return (
    <div 
      className={`min-h-screen bg-background-dark text-gray-100 flex flex-col font-sans select-none relative overflow-hidden pb-24 ${getThemeClass()} ${getAnimationClass()} ${getLayoutClass()}`}
      style={{ fontFamily: fontFamily }}
    >
      <style>{`
        :root {
          --accent-glow: ${accentColor}4D;
          --accent-color-glow: ${accentColor}AA;
        }

        /* CUSTOM ACCENT overrides */
        .text-purple-400, .text-purple-500, .text-purple-350, .text-purple-300, .text-purple-600, .text-purple-700 {
          color: ${accentColor} !important;
        }
        .bg-purple-650, .bg-purple-600, .bg-purple-500, .bg-purple-700, .bg-purple-400 {
          background-color: ${accentColor} !important;
        }
        .hover\\:bg-purple-700:hover, .hover\\:bg-purple-600:hover {
          background-color: ${accentColor}cc !important;
        }
        .border-purple-500, .border-purple-500\\/10, .border-purple-500\\/20, .border-purple-500\\/30, .border-purple-950\\/40, .border-purple-900\\/30, .border-purple-805\\/30, .border-purple-800\\/30 {
          border-color: ${accentColor}55 !important;
        }
        .bg-purple-950\\/20, .bg-purple-950\\/40 {
          background-color: ${accentColor}15 !important;
        }
        .text-gradient {
          background: linear-gradient(135deg, ${accentColor}, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .focus\\:border-purple-500:focus {
          border-color: ${accentColor} !important;
        }
        
        /* NOTION THEME OVERRIDES */
        .theme-notion {
          background-color: #ffffff !important;
          color: #37352f !important;
        }
        .theme-notion .glass-panel, 
        .theme-notion .bg-zinc-900\\/20, 
        .theme-notion .bg-zinc-900\\/30, 
        .theme-notion .bg-black\\/10, 
        .theme-notion .bg-black\\/20 {
          background-color: #f7f6f3 !important;
          border: 1px solid #e9e9e6 !important;
          border-radius: 8px !important;
          box-shadow: none !important;
        }
        .theme-notion h1, 
        .theme-notion h2, 
        .theme-notion h3, 
        .theme-notion h4, 
        .theme-notion h5, 
        .theme-notion span, 
        .theme-notion p, 
        .theme-notion li {
          color: #37352f !important;
          font-family: Courier, monospace !important;
        }
        .theme-notion nav {
          background-color: #f7f6f3d9 !important;
          border-color: #e9e9e6 !important;
        }
        .theme-notion nav a {
          color: #37352f !important;
        }
        .theme-notion input, .theme-notion textarea {
          background-color: #ffffff !important;
          color: #37352f !important;
          border: 1px solid #e9e9e6 !important;
        }
        
        /* APPLE THEME OVERRIDES */
        .theme-apple {
          background-color: #f5f5f7 !important;
          color: #1d1d1f !important;
        }
        .theme-apple .glass-panel, 
        .theme-apple .bg-zinc-900\\/20, 
        .theme-apple .bg-zinc-900\\/30, 
        .theme-apple .bg-black\\/10, 
        .theme-apple .bg-black\\/20 {
          background-color: #ffffff !important;
          border: 1px solid #d2d2d7 !important;
          border-radius: 20px !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02) !important;
        }
        .theme-apple h1, 
        .theme-apple h2, 
        .theme-apple h3, 
        .theme-apple h4, 
        .theme-apple h5, 
        .theme-apple span, 
        .theme-apple p, 
        .theme-apple li {
          color: #1d1d1f !important;
        }
        .theme-apple nav {
          background-color: #ffffffd9 !important;
          border-color: #d2d2d7 !important;
        }
        .theme-apple nav a {
          color: #1d1d1f !important;
        }
        .theme-apple input, .theme-apple textarea {
          background-color: #f5f5f7 !important;
          color: #1d1d1f !important;
          border: 1px solid #d2d2d7 !important;
        }
 
        /* TERMINAL THEME OVERRIDES */
        .theme-terminal {
          background-color: #000000 !important;
          color: #33ff33 !important;
        }
        .theme-terminal .glass-panel, 
        .theme-terminal .bg-zinc-900\\/20, 
        .theme-terminal .bg-zinc-900\\/30, 
        .theme-terminal .bg-black\\/10, 
        .theme-terminal .bg-black\\/20 {
          background-color: #000000 !important;
          border: 1px solid #33ff33 !important;
          border-radius: 0px !important;
          box-shadow: none !important;
        }
        .theme-terminal h1, 
        .theme-terminal h2, 
        .theme-terminal h3, 
        .theme-terminal h4, 
        .theme-terminal h5, 
        .theme-terminal span, 
        .theme-terminal p, 
        .theme-terminal li {
          color: #33ff33 !important;
          font-family: 'Courier New', monospace !important;
          border-radius: 0px !important;
          text-shadow: 0 0 3px #33ff33;
        }
        .theme-terminal nav {
          background-color: #000000cc !important;
          border-color: #33ff33 !important;
        }
        .theme-terminal nav a {
          color: #33ff33 !important;
        }
 
        /* CYBERPUNK THEME OVERRIDES */
        .theme-cyberpunk {
          background-color: #0c0813 !important;
          color: #00ffff !important;
        }
        .theme-cyberpunk .glass-panel, 
        .theme-cyberpunk .bg-zinc-900\\/20, 
        .theme-cyberpunk .bg-zinc-900\\/30, 
        .theme-cyberpunk .bg-black\\/10, 
        .theme-cyberpunk .bg-black\\/20 {
          background-color: #120b24cc !important;
          border: 1px solid #ff007f !important;
          box-shadow: 0 0 8px #ff007f4d !important;
        }
        .theme-cyberpunk h1, 
        .theme-cyberpunk h2, 
        .theme-cyberpunk h3, 
        .theme-cyberpunk h4, 
        .theme-cyberpunk h5, 
        .theme-cyberpunk span, 
        .theme-cyberpunk p, 
        .theme-cyberpunk li {
          color: #00ffff !important;
          text-shadow: 0 0 3px #00ffff;
        }
        .theme-cyberpunk nav {
          background-color: #120b24d9 !important;
          border-color: #ff007f !important;
        }
        .theme-cyberpunk nav a {
          color: #00ffff !important;
        }

        /* MINIMAL MODERN THEME OVERRIDES */
        .theme-minimal {
          background-color: #080808 !important;
          color: #f3f4f6 !important;
        }
        .theme-minimal .glass-panel, 
        .theme-minimal .bg-zinc-900\\/20, 
        .theme-minimal .bg-zinc-900\\/30, 
        .theme-minimal .bg-black\\/10, 
        .theme-minimal .bg-black\\/20 {
          background-color: transparent !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          box-shadow: none !important;
        }
        .theme-minimal h1, 
        .theme-minimal h2, 
        .theme-minimal h3, 
        .theme-minimal h4, 
        .theme-minimal h5 {
          color: #ffffff !important;
          letter-spacing: -0.025em !important;
        }
        .theme-minimal p, 
        .theme-minimal li, 
        .theme-minimal span {
          color: #9ca3af !important;
        }
        .theme-minimal nav {
          background-color: rgba(8,8,8,0.85) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .theme-minimal nav a {
          color: #9ca3af !important;
        }
        .theme-minimal input, .theme-minimal textarea {
          background-color: #0c0c0c !important;
          color: #ffffff !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 8px !important;
        }

        /* GLASSMORPHISM THEME OVERRIDES */
        .theme-glass {
          background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #0f172a 90%) !important;
          color: #f8fafc !important;
        }
        .theme-glass .glass-panel, 
        .theme-glass .bg-zinc-900\\/20, 
        .theme-glass .bg-zinc-900\\/30, 
        .theme-glass .bg-black\\/10, 
        .theme-glass .bg-black\\/20 {
          background-color: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-radius: 24px !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2) !important;
        }
        .theme-glass h1, 
        .theme-glass h2, 
        .theme-glass h3, 
        .theme-glass h4, 
        .theme-glass h5 {
          color: #ffffff !important;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }
        .theme-glass p, 
        .theme-glass li, 
        .theme-glass span {
          color: #cbd5e1 !important;
        }
        .theme-glass nav {
          background-color: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        .theme-glass nav a {
          color: #cbd5e1 !important;
        }
        .theme-glass input, .theme-glass textarea {
          background-color: rgba(255, 255, 255, 0.02) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 12px !important;
        }

        /* STARTUP FOUNDER THEME OVERRIDES */
        .theme-startup {
          background-color: #0b0f19 !important;
          color: #f1f5f9 !important;
        }
        .theme-startup .glass-panel, 
        .theme-startup .bg-zinc-900\\/20, 
        .theme-startup .bg-zinc-900\\/30, 
        .theme-startup .bg-black\\/10, 
        .theme-startup .bg-black\\/20 {
          background-color: #111827 !important;
          border: 1px solid #1f2937 !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .theme-startup h1, 
        .theme-startup h2, 
        .theme-startup h3, 
        .theme-startup h4, 
        .theme-startup h5 {
          color: #ffffff !important;
        }
        .theme-startup p, 
        .theme-startup li, 
        .theme-startup span {
          color: #9ca3af !important;
        }
        .theme-startup nav {
          background-color: rgba(17, 24, 39, 0.85) !important;
          border-color: #1f2937 !important;
        }
        .theme-startup nav a {
          color: #9ca3af !important;
        }
        .theme-startup input, .theme-startup textarea {
          background-color: #1f2937 !important;
          color: #ffffff !important;
          border: 1px solid #374151 !important;
          border-radius: 10px !important;
        }

        /* CREATIVE DESIGNER THEME OVERRIDES (NEO-BRUTALISM LIGHT) */
        .theme-creative {
          background-color: #faf6f0 !important;
          color: #18181b !important;
        }
        .theme-creative .glass-panel, 
        .theme-creative .bg-zinc-900\\/20, 
        .theme-creative .bg-zinc-900\\/30, 
        .theme-creative .bg-black\\/10, 
        .theme-creative .bg-black\\/20 {
          background-color: #ffffff !important;
          border: 2.5px solid #18181b !important;
          border-radius: 0px !important;
          box-shadow: 6px 6px 0px #18181b !important;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .theme-creative .glass-panel:hover {
          transform: translate(-2px, -2px) !important;
          box-shadow: 8px 8px 0px #18181b !important;
        }
        .theme-creative h1, 
        .theme-creative h2, 
        .theme-creative h3, 
        .theme-creative h4, 
        .theme-creative h5 {
          color: #18181b !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
        }
        .theme-creative p, 
        .theme-creative li, 
        .theme-creative span {
          color: #27272a !important;
          font-weight: 500 !important;
        }
        .theme-creative nav {
          background-color: #ffffff !important;
          border: 2.5px solid #18181b !important;
          border-radius: 0px !important;
          box-shadow: 4px 4px 0px #18181b !important;
        }
        .theme-creative nav a {
          color: #18181b !important;
          font-weight: bold !important;
        }
        .theme-creative input, .theme-creative textarea {
          background-color: #ffffff !important;
          color: #18181b !important;
          border: 2.5px solid #18181b !important;
          border-radius: 0px !important;
          font-weight: bold !important;
        }

        /* RESEARCH PORTFOLIO THEME OVERRIDES (ACADEMIC SERIF) */
        .theme-research {
          background-color: #fcfcf9 !important;
          color: #222222 !important;
        }
        .theme-research .glass-panel, 
        .theme-research .bg-zinc-900\\/20, 
        .theme-research .bg-zinc-900\\/30, 
        .theme-research .bg-black\\/10, 
        .theme-research .bg-black\\/20 {
          background-color: #ffffff !important;
          border: 1px solid #dddddd !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
        }
        .theme-research h1, 
        .theme-research h2, 
        .theme-research h3, 
        .theme-research h4, 
        .theme-research h5,
        .theme-research p,
        .theme-research span,
        .theme-research li {
          color: #222222 !important;
          font-family: Georgia, Cambria, "Times New Roman", Times, serif !important;
        }
        .theme-research nav {
          background-color: rgba(252,252,249,0.9) !important;
          border-color: #dddddd !important;
          border-radius: 6px !important;
        }
        .theme-research nav a {
          color: #555555 !important;
        }
        .theme-research input, .theme-research textarea {
          background-color: #ffffff !important;
          color: #222222 !important;
          border: 1px solid #cccccc !important;
          border-radius: 4px !important;
        }

        /* CORPORATE PROFESSIONAL THEME OVERRIDES */
        .theme-corp {
          background-color: #0f172a !important;
          color: #e2e8f0 !important;
        }
        .theme-corp .glass-panel, 
        .theme-corp .bg-zinc-900\\/20, 
        .theme-corp .bg-zinc-900\\/30, 
        .theme-corp .bg-black\\/10, 
        .theme-corp .bg-black\\/20 {
          background-color: #1e293b !important;
          border: 1px solid #334155 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .theme-corp h1, 
        .theme-corp h2, 
        .theme-corp h3, 
        .theme-corp h4, 
        .theme-corp h5 {
          color: #ffffff !important;
        }
        .theme-corp p, 
        .theme-corp li, 
        .theme-corp span {
          color: #94a3b8 !important;
        }
        .theme-corp nav {
          background-color: rgba(30, 41, 59, 0.85) !important;
          border-color: #334155 !important;
          border-radius: 8px !important;
        }
        .theme-corp nav a {
          color: #94a3b8 !important;
        }
        .theme-corp input, .theme-corp textarea {
          background-color: #0f172a !important;
          color: #ffffff !important;
          border: 1px solid #334155 !important;
          border-radius: 6px !important;
        }

        /* ANIMATIONS PRESETS */
        .anim-minimal .glass-panel, 
        .anim-minimal button, 
        .anim-minimal a {
          transition: none !important;
          animation: none !important;
        }
        .anim-fade .glass-panel {
          transition: all 0.4s ease-in-out !important;
        }
        .anim-fade .glass-panel:hover {
          transform: translateY(-2px);
        }
        .anim-glass-hover .glass-panel {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .anim-glass-hover .glass-panel:hover {
          backdrop-filter: blur(30px) !important;
          border-color: rgba(255,255,255,0.2) !important;
          box-shadow: 0 10px 30px rgba(255,255,255,0.05) !important;
          transform: scale(1.005) translateY(-3px);
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .anim-float .glass-panel {
          animation: float 6s ease-in-out infinite;
          transition: all 0.3s ease !important;
        }
        .anim-float .glass-panel:nth-child(even) {
          animation-delay: 2s;
        }
        .anim-float .glass-panel:hover {
          animation-play-state: paused;
          transform: scale(1.01) translateY(-4px) !important;
        }
        .anim-3d .glass-panel {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .anim-3d .glass-panel:hover {
          transform: scale(1.03) rotate(0.5deg) translateY(-4px);
        }
        .anim-glow .glass-panel {
          transition: all 0.3s ease !important;
        }
        .anim-glow .glass-panel:hover {
          box-shadow: 0 0 20px var(--accent-glow) !important;
          border-color: var(--accent-color-glow) !important;
          transform: translateY(-2px);
        }

        /* LAYOUT PRESETS */
        .layout-landing section {
          padding-top: 1.5rem !important;
          padding-bottom: 1.5rem !important;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .layout-dashboard .glass-panel {
          border-radius: 12px !important;
          position: relative;
          padding-top: 2.25rem !important;
        }
        .layout-dashboard .glass-panel::before {
          content: "● ● ●";
          position: absolute;
          top: 0.6rem;
          left: 1rem;
          color: rgba(255,255,255,0.18);
          font-size: 8px;
          letter-spacing: 2px;
        }
        .layout-minimal .glass-panel {
          background-color: transparent !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 4px !important;
          box-shadow: none !important;
        }
        .layout-minimal .glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.25) !important;
       `}</style>
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full filter blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-purple-950/10 rounded-full filter blur-3xl -z-10 pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto px-4 py-4 space-y-8 flex-grow">
        
        {/* Sticky Premium Header Navbar */}
        <nav className="sticky top-4 z-40 bg-zinc-950/60 backdrop-blur-md border border-white/5 shadow-lg flex items-center justify-between w-full rounded-2xl px-6 py-3.5 md:flex md:w-full md:justify-between md:rounded-2xl md:px-6 md:py-3.5 max-md:w-fit max-md:mx-auto max-md:rounded-full max-md:px-4 max-md:py-2.5 max-md:gap-4 max-md:justify-center relative">
          
          {/* Desktop Left: Home & Theme toggle */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#hero" className="text-gray-450 hover:text-white transition" title="Home">
              <Home className="h-4.5 w-4.5" />
            </a>
            <button className="text-gray-450 hover:text-white transition cursor-pointer" title="Toggle Theme">
              <Sun className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Desktop Center: Navigation links */}
          <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-gray-400">
            <a href="#about" className="hover:text-white transition uppercase tracking-wider text-[10px]">About</a>
            <a href="#projects" className="hover:text-white transition uppercase tracking-wider text-[10px]">Projects</a>
            <a href="#experience" className="hover:text-white transition uppercase tracking-wider text-[10px]">Experience</a>
            <a href="#contact" className="hover:text-white transition uppercase tracking-wider text-[10px]">Contact</a>
            <a 
              href="#copilot"
              className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="h-3 w-3" />
              <span>AI Copilot</span>
            </a>
          </div>

          {/* Desktop Right: Live Clock */}
          <div className="hidden md:block text-xs font-mono font-bold text-purple-400 select-none">
            {currentTime}
          </div>

          {/* Mobile Centered Capsule Layout */}
          <div className="flex md:hidden items-center gap-3">
            <a href="#hero" className="text-gray-450 hover:text-white transition p-1" title="Home">
              <Home className="h-4.5 w-4.5" />
            </a>
            
            <div className="h-5 w-[1px] bg-white/10"></div>
            
            <button
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="px-5 py-2.5 bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/50 rounded-full flex items-center justify-center gap-2 text-[10px] font-bold text-purple-400 uppercase tracking-widest cursor-pointer shadow-lg"
            >
              <Menu className="h-3.5 w-3.5 text-purple-400" />
              <span>MENU</span>
            </button>

            {isNavDropdownOpen && (
              <div className="absolute top-[115%] left-1/2 -translate-x-1/2 w-48 bg-zinc-950 border border-white/5 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 text-[10px] font-bold tracking-wider font-mono">
                <a href="#about" onClick={() => setIsNavDropdownOpen(false)} className="block px-4 py-2 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition">ABOUT</a>
                <a href="#projects" onClick={() => setIsNavDropdownOpen(false)} className="block px-4 py-2 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition">PROJECTS</a>
                <a href="#experience" onClick={() => setIsNavDropdownOpen(false)} className="block px-4 py-2 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition">EXPERIENCE</a>
                <a href="#contact" onClick={() => setIsNavDropdownOpen(false)} className="block px-4 py-2 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition">CONTACT</a>
                <a href="#copilot" onClick={() => setIsNavDropdownOpen(false)} className="block px-4 py-2 bg-purple-950/40 hover:bg-purple-900/30 text-purple-400 hover:text-purple-300 rounded-xl transition">AI COPILOT</a>
              </div>
            )}

            <div className="h-5 w-[1px] bg-white/10"></div>

            <button className="text-gray-450 hover:text-white transition p-1 cursor-pointer" title="Toggle Theme">
              <Sun className="h-4.5 w-4.5" />
            </button>
          </div>
        </nav>

        {/* Layout Styles Selector */}
        {(() => {
          const layout = data.layoutStyle || 'Hero Centered';
          
          if (layout === 'Sidebar Navigation') {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-6 items-start">
                {/* Sticky Left Sidebar */}
                <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-8 lg:pr-4">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-white/10 rounded-full w-fit mb-7">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">
                        {basics.professionalTitle || 'Software Engineer'}
                      </span>
                    </div>
                    {renderName()}
                    <div className="pt-2">
                      {renderTaglineBlock()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <a 
                      href="#projects"
                      className="px-6 py-3 bg-white hover:bg-white/90 text-black font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none shadow-sm"
                    >
                      <span>View My Work</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    
                    <a 
                      href="#contact"
                      className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                    >
                      <span>Let's Connect</span>
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                    </a>

                    <a 
                      href={`mailto:${basics.email}?subject=Resume%20Request%20-%20${encodeURIComponent(basics.name)}`}
                      onClick={handleDownloadResume}
                      className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                    >
                      <span>Resume</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Direct Channels</p>
                    <div className="flex flex-wrap gap-2.5">
                      {socials.linkedin && (
                        <a href={ensureAbsoluteUrl(socials.linkedin)} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 hover:bg-purple-500/5 transition duration-300">
                          <Linkedin className="h-4.5 w-4.5" />
                        </a>
                      )}
                      {socials.github && (
                        <a href={ensureAbsoluteUrl(socials.github)} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-white transition duration-300">
                          <Github className="h-4.5 w-4.5" />
                        </a>
                      )}
                      {basics.email && (
                        <a href={`mailto:${basics.email}`} className="w-10 h-10 flex items-center justify-center border border-white/10 hover:border-purple-500/30 rounded-xl bg-zinc-900/40 text-gray-400 hover:text-purple-500 transition duration-300">
                          <Mail className="h-4.5 w-4.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Right Sections */}
                <div className="lg:col-span-8 space-y-10">
                  {renderOrderedSections()}
                  <AICopilotSection basics={basics} slug={slug} />
                  {renderContactSection()}
                </div>
              </div>
            );
          }

          if (layout === 'Split Screen') {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 items-stretch min-h-[70vh]">
                {/* Left Screen: Hero & Contact Info */}
                <div className="space-y-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-white/10 rounded-full w-fit mb-7">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">
                          {basics.professionalTitle || 'Software Engineer'}
                        </span>
                      </div>
                      {renderName()}
                      <div className="pt-2">
                        {renderTaglineBlock()}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 items-center justify-start">
                      <a 
                        href="#projects"
                        className="px-6 py-3 bg-white hover:bg-white/90 text-black font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none shadow-sm"
                      >
                        <span>View My Work</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                      
                      <a 
                        href="#contact"
                        className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                      >
                        <span>Let's Connect</span>
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </a>

                      <a 
                        href={`mailto:${basics.email}?subject=Resume%20Request%20-%20${encodeURIComponent(basics.name)}`}
                        onClick={handleDownloadResume}
                        className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                      >
                        <span>Resume</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </a>
                    </div>
                  </div>

                  {/* Built-in contact form on the left screen */}
                  <div className="pt-6 border-t border-white/5">
                    {renderContactLeftPane()}
                  </div>
                </div>

                {/* Right Screen: Scrollable Bento Widgets */}
                <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-6">
                  {renderOrderedSections()}
                  <AICopilotSection basics={basics} slug={slug} />
                </div>
              </div>
            );
          }

          // Default / Hero Centered / Landing Page / Timeline / Dashboard / Minimal / Scrolling Story
          return (
            <>
              {/* Default Hero Section */}
              <section id="hero" className="min-h-[82vh] flex flex-col justify-center items-start py-6 relative max-w-4xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none -z-10"></div>
                
                <div className="space-y-6 flex-grow w-full flex flex-col justify-center items-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-white/10 rounded-full w-fit mb-4">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider font-mono">
                      {basics.professionalTitle || 'Software Engineer'}
                    </span>
                  </div>
                  
                  {renderName()}
                  
                  <div className="pt-2">
                    {renderTaglineBlock()}
                  </div>

                  <div className="flex flex-row flex-wrap gap-4 items-center justify-start pt-4 w-full">
                    <a 
                      href="#projects"
                      className="px-6 py-3 bg-white hover:bg-white/90 text-black font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none shadow-sm"
                    >
                      <span>View My Work</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                    
                    <a 
                      href="#contact"
                      className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                    >
                      <span>Let's Connect</span>
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                    </a>

                    <a 
                      href={`mailto:${basics.email}?subject=Resume%20Request%20-%20${encodeURIComponent(basics.name)}`}
                      onClick={handleDownloadResume}
                      className="px-6 py-3 border border-white/20 hover:border-white/45 bg-transparent hover:bg-white/5 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition select-none"
                    >
                      <span>Resume</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    </a>
                  </div>
                </div>
              </section>

              {renderOrderedSections()}
              <AICopilotSection basics={basics} slug={slug} />
              {renderContactSection()}
            </>
          );
        })()}

      </div>

      {/* Project Details Modal */}
      {activeModalProject && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveModalProject(null)}
        >
          <div 
            className="glass-panel max-w-2xl w-full rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Window control bar */}
            <div className="bg-zinc-900/90 border-b border-white/5 px-4 py-3.5 flex justify-between items-center select-none">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" onClick={() => setActiveModalProject(null)}></span>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27c93f]"></span>
              </div>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                <span>{activeModalProject.name.toLowerCase().replace(/\s+/g, '_')}_details.md</span>
                <span className="px-1 py-0.5 bg-purple-950 text-purple-300 text-[9px] font-bold rounded">Markdown</span>
              </span>
              <button 
                onClick={() => setActiveModalProject(null)} 
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 font-mono text-[11px] leading-relaxed bg-black/40">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[9px] text-gray-500 select-none">
                  <span>challenges_solved.log</span>
                  <span>UTF-8</span>
                </div>
                <div className="space-y-2">
                  <p className="text-purple-400 font-bold">$ cat technical_breakdown.md</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{activeModalProject.details}</p>
                  
                  {activeModalProject.problemStatement && (
                    <>
                      <p className="text-purple-400 font-bold mt-4">$ cat problem_statement.md</p>
                      <p className="text-gray-300 whitespace-pre-wrap">{activeModalProject.problemStatement}</p>
                    </>
                  )}

                  {activeModalProject.keyFeatures && activeModalProject.keyFeatures.length > 0 && (
                    <>
                      <p className="text-purple-400 font-bold mt-4">$ cat key_features.md</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-300">
                        {activeModalProject.keyFeatures.map((kf: string, idx: number) => (
                          <li key={idx}>{kf}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {activeModalProject.technicalHighlights && activeModalProject.technicalHighlights.length > 0 && (
                    <>
                      <p className="text-purple-400 font-bold mt-4">$ cat technical_highlights.md</p>
                      <ul className="list-disc pl-4 space-y-1 text-gray-300">
                        {activeModalProject.technicalHighlights.map((th: string, idx: number) => (
                          <li key={idx}>{th}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <p className="text-purple-400 font-bold mt-4">$ cat challenges_solved.md</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{activeModalProject.challengesSolved}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-900/60 border-t border-white/5 px-6 py-3 flex justify-end">
              <button
                onClick={() => setActiveModalProject(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close Terminal
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-white/5 text-center text-gray-500 text-xs">
        <p>© 2026 {basics.name}. Generated by AI Portfolio Architect.</p>
      </footer>
    </div>
  );
};
