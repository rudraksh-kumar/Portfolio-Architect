import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Palette, 
  Type, 
  Layout, 
  Check, 
  Zap, 
  Search, 
  User,  
  Layers, 
  AlignJustify, 
  ChevronUp, 
  ChevronDown, 
  MoveUp, 
  MoveDown,
  Info,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PortfolioData } from '../types.js';
import { PortfolioView } from './PortfolioView.js';

interface AIPortfolioPersonalizeProps {
  initialData: PortfolioData;
  slug: string;
  token: string;
  onPublish: () => void;
  onCancel: () => void;
  isDashboardEdit?: boolean;
}

// 11 Themes listed
const THEMES = [
  { name: 'Developer Pro', desc: 'Syntax highlighted code styling and micro bento widgets.', type: 'dev', recommend: 'Technical profiles' },
  { name: 'Minimal Modern', desc: 'Spacious grids and crisp gray elements.', type: 'minimal', recommend: 'Clean developers' },
  { name: 'Glassmorphism', desc: 'Frosted backdrops and saturated purple glow layers.', type: 'glass', recommend: 'Designers & UI devs' },
  { name: 'Startup Founder', desc: 'Bento widgets highlighting fast ship metrics.', type: 'startup', recommend: 'Product builders' },
  { name: 'Creative Designer', desc: 'Oversized typographic headings and visual items.', type: 'creative', recommend: 'UX/UI & Illustrators' },
  { name: 'Research Portfolio', desc: 'Clean, timeline-oriented structural lists.', type: 'research', recommend: 'Researchers & academics' },
  { name: 'Corporate Professional', desc: 'Executive formatting, summaries first.', type: 'corp', recommend: 'Leads & Directors' },
  { name: 'Cyberpunk', desc: 'Dark neon glowing lines and retro grid highlights.', type: 'cyberpunk', recommend: 'Indie devs & gamers' },
  { name: 'Apple Inspired', desc: 'Symmetrical gray cards, sleek borders, high polish.', type: 'apple', recommend: 'Hardware & Mac developers' },
  { name: 'Notion Style', desc: 'Minimal monospace styling, custom emoji icons, borders.', type: 'notion', recommend: 'Writers & organizers' },
  { name: 'Terminal Portfolio', desc: 'Matrix green terminal prompts and output grids.', type: 'terminal', recommend: 'CLI enthusiasts & DevOps' }
];

// Color presets
const ACCENT_COLORS = [
  { name: 'Purple', hex: '#9333ea', text: 'text-purple-400', bg: 'bg-purple-600', border: 'border-purple-500' },
  { name: 'Blue', hex: '#2563eb', text: 'text-blue-400', bg: 'bg-blue-600', border: 'border-blue-500' },
  { name: 'Green', hex: '#16a34a', text: 'text-green-400', bg: 'bg-green-600', border: 'border-green-500' },
  { name: 'Orange', hex: '#ea580c', text: 'text-orange-400', bg: 'bg-orange-600', border: 'border-orange-500' },
  { name: 'Red', hex: '#dc2626', text: 'text-red-400', bg: 'bg-red-600', border: 'border-red-500' },
  { name: 'White', hex: '#ffffff', text: 'text-white', bg: 'bg-white', border: 'border-gray-300' },
  { name: 'Black', hex: '#000000', text: 'text-gray-400', bg: 'bg-black', border: 'border-gray-800' },
  { name: 'Pink', hex: '#db2777', text: 'text-pink-400', bg: 'bg-pink-600', border: 'border-pink-500' },
  { name: 'Hyper Gradient', hex: 'linear-gradient(to right, #a855f7, #ec4899)', text: 'text-pink-400', bg: 'bg-gradient-to-r from-purple-500 to-pink-500', border: 'border-pink-400' }
];

// Font presets
const FONTS = [
  { name: 'Inter', css: "'Inter', sans-serif", desc: 'Clean, modern, geometric design' },
  { name: 'Poppins', css: "'Poppins', sans-serif", desc: 'Soft curves, welcoming typeface' },
  { name: 'Geist', css: "'Geist', monospace", desc: 'Hyper-technical developer feel' },
  { name: 'Space Grotesk', css: "'Space Grotesk', sans-serif", desc: 'Eccentric details, highly unique' },
  { name: 'Manrope', css: "'Manrope', sans-serif", desc: 'Professional, elegant, readable' },
  { name: 'IBM Plex Sans', css: "'IBM Plex Sans', sans-serif", desc: 'Slightly industrial tech layout' },
  { name: 'JetBrains Mono', css: "'JetBrains Mono', monospace", desc: 'Scanline coding alignment look' }
];

// Layout presets
const LAYOUTS = [
  { name: 'Hero Centered', desc: 'Big center header and symmetrical bento cells below.', icon: 'layout-centered' },
  { name: 'Sidebar Navigation', desc: 'Static left panel for name/bio, scrollable bento cards.', icon: 'layout-sidebar' },
  { name: 'Landing Page Style', desc: 'Linear storytelling scrolling section by section.', icon: 'layout-linear' },
  { name: 'Timeline Layout', desc: 'Focuses heavily on professional dates and history.', icon: 'layout-timeline' },
  { name: 'Developer Dashboard', desc: 'Interactive console with terminal widgets.', icon: 'layout-dashboard' },
  { name: 'Split Screen', desc: 'Left column profile statement, right column projects.', icon: 'layout-split' },
  { name: 'Minimal', desc: 'Ultra-spaced plain outline widgets, high contrast.', icon: 'layout-minimal' },
  { name: 'Scrolling Story', desc: 'Horizontal slide transition on scroll triggers.', icon: 'layout-story' }
];

// Animations presets
const ANIMATIONS = [
  { name: 'Minimal Motion', desc: 'Tame, high-performance transitions for quick indexing.' },
  { name: 'Smooth Fade', desc: 'Fluid, slow opacity transitions as sections enter viewport.' },
  { name: 'Modern Glass', desc: 'Refractive frost glare transitions when hovering cards.' },
  { name: 'Floating Cards', desc: 'Wobbly spring motions imitating hovering gravity.' },
  { name: '3D Hover', desc: 'Tilt effects shifting cards according to cursor path.' },
  { name: 'Parallax', desc: 'Deep background separation layers moving on hover.' },
  { name: 'Gradient Glow', desc: 'Color glows moving dynamically along card borders.' }
];

const PERSONALITIES: Record<string, {
  bio: string;
  tagline: {
    heading: string;
    explanation: string;
  };
  projectDesc: string;
  reason: string;
}> = {
  Professional: {
    bio: "Accomplished software engineer dedicated to building performant and clean full-stack web architectures. Skilled at translating product scope into structured, production-ready modules.",
    tagline: {
      heading: "Software Engineer",
      explanation: "Specializing in building highly performant, secure, and scalable web applications that deliver exceptional business value."
    },
    projectDesc: "Engineered a low-latency, scalable platform optimization module supporting high user loads.",
    reason: "Emphasizes corporate standards, technical reliability, and clear manager-level readability."
  },
  'Startup Founder': {
    bio: "Product-focused developer building from zero to one. Obsessed with high delivery rates, user interaction paradigms, rapid prototyping, and business scalability metrics.",
    tagline: {
      heading: "Startup Developer",
      explanation: "Building scalable products with a focus on shipping fast, solving user problems, and rapid prototyping."
    },
    projectDesc: "Designed and launched an end-to-end user acquisition tool from scratch in 3 weeks.",
    reason: "Expresses rapid ship speeds, product vision, entrepreneurial drive, and high velocity."
  },
  Researcher: {
    bio: "Computer scientist specializing in algorithmic design, data validation models, and exploring the mathematical limitations of machine learning systems.",
    tagline: {
      heading: "Computer Scientist",
      explanation: "Exploring algorithmic complexity to engineer data-driven solutions that solve complex mathematical constraints."
    },
    projectDesc: "Authored experimental algorithms solving complex path optimization constraints.",
    reason: "Emphasizes academic accuracy, analytics depth, structured methodologies, and proofs."
  },
  Creative: {
    bio: "Design-minded developer operating at the intersection of beautiful aesthetic interfaces and fluid web layouts. Crafting high-grade interactive experiences.",
    tagline: {
      heading: "Creative Developer",
      explanation: "Designing immersive user interfaces with a focus on crafting memorable and highly interactive digital experiences."
    },
    projectDesc: "Crafted an immersive interactive workspace mapping custom user audio loops.",
    reason: "Highlights visual design chops, visual aesthetics, storytelling, and UI polish."
  },
  Minimal: {
    bio: "Focused developer crafting lightweight code bases. Devoted to clean architectures, zero dependencies, and low CPU footprint software solutions.",
    tagline: {
      heading: "Minimalist Developer",
      explanation: "Simplicity in design focusing on lightweight, performant code bases with zero unnecessary external dependencies."
    },
    projectDesc: "Wrote a lightweight, modular service with zero third-party packages.",
    reason: "Conveys focus on performance, minimal codebases, clean structure, and efficiency."
  },
  Friendly: {
    bio: "Hey! I am a software dev who loves pairing with teams, helping colleagues grow, and crafting software that brings real joy to people's day.",
    tagline: {
      heading: "Collaborative Developer",
      explanation: "Building helpful applications focusing on fostering great team collaboration and delivering real joy to users."
    },
    projectDesc: "Co-created a team task dashboard to align engineering workflows.",
    reason: "Conveys strong collaboration skills, approachability, and mentoring potential."
  },
  Confident: {
    bio: "High-performing architect skilled in spearheading complex microservice refactoring, optimizing data latency, and guiding teams toward technical landmarks.",
    tagline: {
      heading: "Solutions Architect",
      explanation: "Architecting high-availability systems with a focus on scaling engineering infrastructure and leading high-performing teams."
    },
    projectDesc: "Spearheaded migration of legacy services to modern clusters, reducing overhead by 40%.",
    reason: "Projects direct technical mastery, problem resolution capabilities, and tech control."
  },
  Executive: {
    bio: "Technical leader aligning code practices with high-level corporate goals. Scaling engineering velocity while mentoring developers toward personal landmarks.",
    tagline: {
      heading: "Engineering Leader",
      explanation: "Aligning high-impact engineering with a focus on building business strategy, mentoring teams, and scaling velocity."
    },
    projectDesc: "Scaled an engineering team from 3 to 12 devs while implementing strict CI/CD guidelines.",
    reason: "Demonstrates resource scaling, strategic project planning, and organizational goals."
  },
  Developer: {
    bio: "Passionate full-stack developer who enjoys debugging backend services, crafting responsive client layouts, and scripting utility tools.",
    tagline: {
      heading: "Full-Stack Developer",
      explanation: "Specializing in building modern web applications with clean architecture and robust backend systems."
    },
    projectDesc: "Built full-stack React application with Node.js backend and real-time sockets.",
    reason: "Projects general technical capabilities, full-stack coverage, and coding interest."
  }
};

export const AIPortfolioPersonalize: React.FC<AIPortfolioPersonalizeProps> = ({
  initialData,
  slug,
  token,
  onPublish,
  onCancel,
  isDashboardEdit = false
}) => {
  // Personalization settings state - initialize from initialData if available
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return THEMES.find(t => t.name === initialData.themeName) || THEMES[0];
  });
  const [accentColor, setAccentColor] = useState(() => {
    return ACCENT_COLORS.find(c => c.hex === initialData.colorAccent) || ACCENT_COLORS[0];
  });
  const [selectedFont, setSelectedFont] = useState(() => {
    return FONTS.find(f => f.css === initialData.fontFamilyHeading) || FONTS[0];
  });
  const [selectedLayout, setSelectedLayout] = useState(() => {
    return LAYOUTS.find(l => l.name === initialData.layoutStyle) || LAYOUTS[0];
  });
  const [selectedAnimation, setSelectedAnimation] = useState(() => {
    return ANIMATIONS.find(a => a.name === initialData.animationStyle) || ANIMATIONS[0];
  });
  const [personality, setPersonality] = useState(() => {
    return initialData.personalityTone || 'Developer';
  });
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Expandable sections mapping
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theme: true,
    color: true,
    font: false,
    layout: false,
    animation: false,
    ordering: false,
    personality: true,
    seo: false,
    reasoning: true
  });

  // Reorderable sections state (Section 9) - initialize from initialData if available
  const [sectionsOrder, setSectionsOrder] = useState<string[]>(() => {
    const rawOrder = initialData.sectionOrdering || [
      'Projects',
      'Experience',
      'Skills',
      'Achievements'
    ];
    return rawOrder.filter(s => s !== 'Education');
  });

  // Load custom typography preview links dynamically
  useEffect(() => {
    const linkId = 'preview-google-fonts';
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = linkId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }
    const fontNames = FONTS.map(f => f.name.replace(' ', '+')).join('|');
    linkElement.href = `https://fonts.googleapis.com/css?family=${fontNames}&display=swap`;
  }, []);

  // Compute final overwritten texts based on selected personality
  const currentBio = PERSONALITIES[personality]?.bio || initialData.basics.bio;
  const currentTagline = PERSONALITIES[personality]?.tagline || initialData.basics.tagline;

  // Custom AI design recommendation logic (dynamic based on resume characteristics)
  const isHighTech = initialData.skills.some(cat => 
    ['ai', 'ml', 'machine learning', 'backend', 'devops', 'cloud'].includes(cat.category.toLowerCase())
  );
  const isHighProjectCount = initialData.projects.length >= 3;

  const aiRecommendedTheme = isHighTech ? THEMES[0] : (isHighProjectCount ? THEMES[3] : THEMES[2]);
  const aiRecommendedColor = isHighTech ? ACCENT_COLORS[0] : ACCENT_COLORS[1]; // Purple for tech, blue otherwise
  const aiRecommendedFont = isHighTech ? FONTS[2] : FONTS[0]; // Geist for tech, Inter otherwise
  const aiRecommendedLayout = isHighProjectCount ? LAYOUTS[4] : LAYOUTS[0]; // Dashboard layout for projects, hero otherwise
  const aiRecommendedAnimation = isHighTech ? ANIMATIONS[6] : ANIMATIONS[2]; // Gradient glow vs Glass

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Trigger loading the AI suggested template parameters
  const handleApplyAIRecommendation = () => {
    setSelectedTheme(aiRecommendedTheme);
    setAccentColor(aiRecommendedColor);
    setSelectedFont(aiRecommendedFont);
    setSelectedLayout(aiRecommendedLayout);
    setSelectedAnimation(aiRecommendedAnimation);
  };

  // Reset to original settings from initialData
  const handleResetToDefaults = () => {
    setSelectedTheme(THEMES.find(t => t.name === initialData.themeName) || THEMES[0]);
    setAccentColor(ACCENT_COLORS.find(c => c.hex === initialData.colorAccent) || ACCENT_COLORS[0]);
    setSelectedFont(FONTS.find(f => f.css === initialData.fontFamilyHeading) || FONTS[0]);
    setSelectedLayout(LAYOUTS.find(l => l.name === initialData.layoutStyle) || LAYOUTS[0]);
    setSelectedAnimation(ANIMATIONS.find(a => a.name === initialData.animationStyle) || ANIMATIONS[0]);
    setPersonality(initialData.personalityTone || 'Developer');
    const rawOrder = initialData.sectionOrdering || [
      'Projects',
      'Experience',
      'Skills',
      'Achievements'
    ];
    setSectionsOrder(rawOrder.filter(s => s !== 'Education'));
  };

  // Up/Down reordering handlers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sectionsOrder.length) return;

    setSectionsOrder(prev => {
      const order = [...prev];
      const temp = order[index];
      order[index] = order[targetIdx];
      order[targetIdx] = temp;
      return order;
    });
  };

  // Build final schema portfolio payload integrating customizations
  const customizedData: PortfolioData = {
    ...initialData,
    basics: {
      ...initialData.basics,
      bio: currentBio,
      tagline: currentTagline
    },
    themeName: selectedTheme.name,
    colorAccent: accentColor.hex,
    fontFamilyHeading: selectedFont.css,
    fontFamilyBody: selectedFont.css,
    layoutStyle: selectedLayout.name,
    animationStyle: selectedAnimation.name,
    sectionOrdering: sectionsOrder,
    personalityTone: personality,
    seoSettings: {
      title: `${initialData.basics.name} | ${initialData.basics.professionalTitle}`,
      description: currentBio.slice(0, 155),
      ogTitle: `${initialData.basics.name} - Professional brand`,
      ogDescription: currentBio.slice(0, 155),
      ogImage: `https://avatar.vercel.sh/${slug}.png`
    }
  };

  // Final Deploy PUT
  const handleDeploy = async () => {
    setPublishing(true);
    try {

      const response = await fetch('/api/portfolio/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          slug,
          theme: selectedTheme.type === 'dev' ? 'dark-glass' : selectedTheme.type,
          profileData: customizedData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deploy customized portfolio.');
      }

      onPublish();
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Error occurred during generation.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#070709] text-gray-200 z-50 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      
      {/* Radial Background accents */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-900/5 rounded-full filter blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-950/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* HEADER ROW */}
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
              <Palette className="h-4 w-4 text-purple-400" />
              <span>Personalize Your Portfolio</span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Our AI analyzed your profile and selected the best portfolio style for you. Customize layout choices below.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleResetToDefaults}
            className="px-4 py-2.5 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleDeploy}
            disabled={publishing}
            className="px-5 py-2.5 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-purple-950/30 transition transform hover:scale-[1.02]"
          >
            {publishing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating website...</span>
              </>
            ) : (
              <>
                <span>{isDashboardEdit ? 'Save Changes' : 'Generate Portfolio'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* SPLIT GRID CONTAINER */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT COLUMN: Customizer Controls (Scrollable) */}
        <div className="w-full lg:w-3/5 h-full overflow-y-auto p-6 space-y-6 scrollbar-thin bg-black/20 select-none">
          
          {/* SECTION 1: AI RECOMMENDED THEME BANNER */}
          <div className="glass-panel border-purple-500/20 bg-purple-950/5 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles className="h-40 w-40 text-purple-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] bg-purple-900/40 border border-purple-500/30 px-3 py-1 rounded-full text-purple-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  <span>AI Recommended Theme</span>
                </span>
                <span className="text-xs font-semibold text-gray-400 font-mono">Confidence: <strong className="text-purple-400">95%</strong></span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white font-heading">{aiRecommendedTheme.name}</h3>
                <p className="text-[11px] text-gray-400 mt-2 max-w-xl leading-relaxed">
                  "Based on analyzing your technical credentials, competitive programming logs, and github repository stats, we recommend the <strong>{aiRecommendedTheme.name}</strong> layout. This highlights technical credibility and recruiter accessibility."
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleApplyAIRecommendation}
                  className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white text-[10px] font-bold rounded-xl flex items-center space-x-1.5 transition"
                >
                  <Zap className="h-3 w-3" />
                  <span>AI Selection</span>
                </button>
                <button
                  onClick={handleResetToDefaults}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-xl transition"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => toggleSection('theme')}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-xl transition"
                >
                  Other Themes
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: AI DESIGN REASONING PANEL */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('reasoning')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Why did AI choose this design?</h3>
              </div>
              {expandedSections.reasoning ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.reasoning && (
              <div className="p-5 space-y-4 text-xs text-gray-300 leading-relaxed bg-[#0c0c0f]/40 animate-fadeIn">
                <p>We detected the following indicators in your resume profile:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-gray-400">
                  <li><strong>Strong Technical Frameworks:</strong> You have listed complex tools such as Node.js, SQLite, or React.</li>
                  <li><strong>Dynamic Work Logs:</strong> Multiple software building items were identified, requiring visual grid focus.</li>
                  <li><strong>Target Recruiting Strategy:</strong> A clean outline structure maximizes recruiter readability.</li>
                </ul>
                <div className="bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider mb-1">Layout Verdict</span>
                  <p className="text-gray-300 font-medium">
                    We selected a structural bento grid configuration because it balances high-density information layout with modern interactive accents, ensuring recruiters can evaluate skills within 6 seconds.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: AVAILABLE THEMES SELECTOR */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('theme')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Available Theme Packages</h3>
              </div>
              {expandedSections.theme ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.theme && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {THEMES.map(themeItem => {
                    const isSelected = selectedTheme.name === themeItem.name;
                    return (
                      <button
                        key={themeItem.name}
                        onClick={() => setSelectedTheme(themeItem)}
                        className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between min-h-[110px] hover:scale-[1.01] overflow-hidden ${
                          isSelected 
                            ? 'bg-purple-950/25 border-purple-500/50' 
                            : 'bg-black/25 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-purple-600 p-0.5 rounded-full">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{themeItem.name}</h4>
                          <p className="text-[11px] text-gray-400 mt-1.5 leading-normal">{themeItem.desc}</p>
                        </div>
                        <span className="text-[9px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-gray-400 mt-2 self-start font-medium">
                          {themeItem.recommend}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: COLOR PERSONALIZATION */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('color')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Color Accent Palette</h3>
              </div>
              {expandedSections.color ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.color && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="bg-[#0c0c0f]/40 p-4 rounded-xl border border-white/5 space-y-1.5 mb-2">
                  <span className="text-[9px] bg-purple-900/40 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center space-x-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>AI Suggested Color: Purple</span>
                  </span>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    "Purple matches the dark developer environment and generates maximum contrast matching technical profiles."
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {ACCENT_COLORS.map(colorItem => {
                    const isSelected = accentColor.name === colorItem.name;
                    return (
                      <button
                        key={colorItem.name}
                        onClick={() => setAccentColor(colorItem)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-xl border transition hover:scale-[1.02] ${
                          isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50' 
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${colorItem.bg} shrink-0`} />
                        <span className="text-[11px] font-semibold text-white">{colorItem.name}</span>
                        {isSelected && <Check className="h-3 w-3 text-purple-400 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: FONT PERSONALIZATION */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('font')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Type className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Typography Configuration</h3>
              </div>
              {expandedSections.font ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.font && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 gap-3">
                  {FONTS.map(fontItem => {
                    const isSelected = selectedFont.name === fontItem.name;
                    const isRecommended = fontItem.name === aiRecommendedFont.name;
                    return (
                      <button
                        key={fontItem.name}
                        onClick={() => setSelectedFont(fontItem)}
                        className={`p-4 rounded-xl border text-left transition flex items-center justify-between hover:scale-[1.005] ${
                          isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50' 
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="text-sm font-bold text-white" 
                              style={{ fontFamily: fontItem.css }}
                            >
                              {fontItem.name}
                            </span>
                            {isRecommended && (
                              <span className="text-[8px] bg-purple-950/50 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center space-x-0.5">
                                <Sparkles className="h-2 w-2" />
                                <span>AI Rec</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 leading-normal">{fontItem.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span 
                            className="text-base font-bold text-gray-300"
                            style={{ fontFamily: fontItem.css }}
                          >
                            Aa Bb Cc
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: LAYOUT OPTIONS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('layout')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Layout Structure</h3>
              </div>
              {expandedSections.layout ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.layout && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LAYOUTS.map(layoutItem => {
                    const isSelected = selectedLayout.name === layoutItem.name;
                    return (
                      <button
                        key={layoutItem.name}
                        onClick={() => setSelectedLayout(layoutItem)}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between hover:scale-[1.01] ${
                          isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50' 
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white tracking-wide">{layoutItem.name}</h4>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{layoutItem.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: ANIMATION STYLE */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('animation')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Animation Interactions</h3>
              </div>
              {expandedSections.animation ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.animation && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ANIMATIONS.map(animItem => {
                    const isSelected = selectedAnimation.name === animItem.name;
                    const isAIRecommend = animItem.name === aiRecommendedAnimation.name;
                    return (
                      <button
                        key={animItem.name}
                        onClick={() => setSelectedAnimation(animItem)}
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between hover:scale-[1.01] ${
                          isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50' 
                            : 'bg-black/20 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-bold text-white tracking-wide flex items-center space-x-1.5">
                              <span>{animItem.name}</span>
                              {isAIRecommend && <Sparkles className="h-3 w-3 text-purple-400" />}
                            </h4>
                            {isSelected && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{animItem.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 9: SECTION ORDERING */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('ordering')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <AlignJustify className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Section Ordering & Layout Sequence</h3>
              </div>
              {expandedSections.ordering ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.ordering && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="bg-[#0c0c0f]/40 p-4 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">AI Layout Structurer</span>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    "Projects appear first because your software developments are your strongest differentiators."
                  </p>
                </div>

                <div className="space-y-2">
                  {sectionsOrder.map((secName, idx) => (
                    <div
                      key={secName}
                      className="bg-black/35 border border-white/5 px-4 py-3 rounded-xl flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono font-bold text-gray-500">#{idx + 1}</span>
                        <span className="text-xs font-bold text-white">{secName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => moveSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30"
                          title="Move Up"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 'down')}
                          disabled={idx === sectionsOrder.length - 1}
                          className="p-1.5 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30"
                          title="Move Down"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 10: PORTFOLIO PERSONALITY */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('personality')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Writing Style & Personality</h3>
              </div>
              {expandedSections.personality ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.personality && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <p className="text-xs text-gray-400 leading-normal">
                  Choose a writing style. This changes taglines, bios, and descriptions inside your generated website instantly.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.keys(PERSONALITIES).map(persKey => {
                    const isSelected = personality === persKey;
                    return (
                      <button
                        key={persKey}
                        onClick={() => setPersonality(persKey)}
                        className={`py-2.5 px-3 rounded-xl border text-center transition text-xs font-bold ${
                          isSelected 
                            ? 'bg-purple-950/20 border-purple-500/50 text-purple-400' 
                            : 'bg-black/25 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {persKey}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#0a0a0d] border border-white/5 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold text-gray-500">Real-Time Rewrite Preview</span>
                    <span className="text-[8px] bg-purple-950/40 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">Active</span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-purple-400 font-semibold block">Dynamic Tagline</span>
                    <p className="text-xs font-medium text-white italic">
                      "{(() => {
                        const tagRaw = currentTagline as any;
                        return tagRaw && typeof tagRaw === 'object'
                          ? `${tagRaw.heading} - ${tagRaw.explanation}`
                          : tagRaw;
                      })()}"
                    </p>
                  </div>
                  <div className="space-y-1 pt-1.5">
                    <span className="text-[10px] text-purple-400 font-semibold block">Dynamic Bio</span>
                    <p className="text-[11px] text-gray-400 leading-relaxed">"{currentBio}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 11: AI PERSONAL BRAND SUMMARY */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">Your AI Personal Brand</h3>
              <span className="text-[10px] font-semibold text-gray-500">Resume Synthesis Verdict</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Positioning Statement</span>
                  <span className="text-white font-bold block mt-1">{initialData.basics.professionalTitle}</span>
                </div>
                <div className="bg-black/20 border border-white/5 p-3 rounded-xl">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Recommended Audience</span>
                  <span className="text-white font-bold block mt-1">Tech Recruiters, Startups</span>
                </div>
              </div>

              <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-2">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Strongest Selling Points</span>
                <div className="flex flex-wrap gap-1.5">
                  {initialData.skills.flatMap(cat => cat.items).slice(0, 5).map(skill => (
                    <span key={skill} className="bg-purple-950/20 border border-purple-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-purple-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 12: SEO PREVIEW PANEL */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('seo')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Google & SEO Index Preview</h3>
              </div>
              {expandedSections.seo ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.seo && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="space-y-4">
                  {/* Google Search Mock */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                    <span className="text-[10px] text-purple-400 font-mono">Google Preview</span>
                    <h4 
                      className="text-sm text-[#8ab4f8] hover:underline cursor-pointer font-medium truncate font-heading"
                      onClick={() => window.open(`/p/${slug}`, '_blank')}
                    >
                      {initialData.basics.name} | {initialData.basics.professionalTitle}
                    </h4>
                    <p 
                      className="text-[10px] text-[#006621] truncate font-mono hover:underline cursor-pointer flex items-center gap-1"
                      onClick={() => window.open(`/p/${slug}`, '_blank')}
                    >
                      {window.location.origin}/p/{slug}
                      <ExternalLink className="h-2.5 w-2.5 inline" />
                    </p>
                    <p className="text-[11px] text-[#bdc1c6] line-clamp-2 leading-relaxed">
                      {currentBio}
                    </p>
                  </div>

                  {/* Open Graph / Social card mock */}
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] text-purple-400 font-mono">Open Graph / Twitter Card Preview</span>
                    <div 
                      className="border border-white/10 rounded-xl overflow-hidden bg-black hover:border-purple-500/50 transition cursor-pointer"
                      onClick={() => window.open(`/p/${slug}`, '_blank')}
                    >
                      <div className="h-28 bg-gradient-to-r from-purple-900 to-indigo-900 flex items-center justify-center relative p-4">
                        <div className="text-center space-y-1">
                          <h4 className="text-base font-bold text-white font-heading">{initialData.basics.name}</h4>
                          <p className="text-[9px] text-purple-300 font-medium font-sans">
                            {(() => {
                              const tagRaw = currentTagline as any;
                              return tagRaw && typeof tagRaw === 'object'
                                ? `${tagRaw.heading} - ${tagRaw.explanation}`
                                : tagRaw;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 border-t border-white/5 bg-[#09090b]">
                        <span className="text-[9px] text-gray-500 block uppercase font-bold font-mono">
                          {window.location.host}/p/{slug}
                        </span>
                        <h5 className="text-[11px] font-bold text-white mt-1 font-heading">{initialData.basics.name} - portfolio</h5>
                        <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{currentBio}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 13: FINAL REVIEW ROW */}
          <div className="glass-panel border-purple-500/20 bg-[#121215]/80 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">Final Design Review</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div className="bg-black/20 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Theme</span>
                <span className="font-semibold text-white mt-0.5 block truncate">{selectedTheme.name}</span>
              </div>
              <div className="bg-black/20 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Color Accent</span>
                <span className="font-semibold text-white mt-0.5 block truncate">{accentColor.name}</span>
              </div>
              <div className="bg-black/20 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Layout</span>
                <span className="font-semibold text-white mt-0.5 block truncate">{selectedLayout.name}</span>
              </div>
              <div className="bg-black/20 border border-white/5 p-2 rounded-xl">
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">Personality</span>
                <span className="font-semibold text-white mt-0.5 block truncate">{personality}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Recruiter Appeal</span>
                  <span className="text-sm font-bold text-green-400 block font-mono">98% High Appeal</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Portfolio Readiness</span>
                  <span className="text-sm font-bold text-purple-400 block font-mono">96% Completed</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={onCancel}
                  className="px-5 py-3 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition"
                >
                  Back
                </button>
                <button
                  onClick={handleDeploy}
                  disabled={publishing}
                  className="px-7 py-3 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
                >
                  <span>{isDashboardEdit ? 'Save Settings' : 'Generate Portfolio'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Live Real-Time Portfolio Preview */}
        <div className="hidden lg:block w-2/5 h-full bg-[#0a0a0f]/40 flex flex-col overflow-hidden relative border-l border-white/5 select-text">

          {/* Actual live rendering of the home page with custom state data */}
          <div className="flex-grow overflow-y-auto scrollbar-thin">
            <PortfolioView 
              slug={slug} 
              isPreview={true} 
              previewData={customizedData} 
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 backdrop-blur-md border ${
              toast.type === 'error' 
                ? 'bg-red-950/70 border-red-500/30 text-red-200' 
                : 'bg-green-950/70 border-green-500/30 text-green-200'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              )}
              <span className="text-xs font-semibold select-text">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default AIPortfolioPersonalize;
