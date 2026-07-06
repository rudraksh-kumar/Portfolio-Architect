import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Code, 
  Briefcase, 
  Cpu, 
  LayoutGrid, 
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface AIGenerationProgressProps {
  apiPromise: Promise<{ slug: string; portfolio: any }>;
  onComplete: (slug: string, portfolio: any) => void;
  onCancel: () => void;
}

// 12 AI pipeline tasks
const PIPELINE_TASKS = [
  "Reading Resume",
  "Understanding LinkedIn Profile",
  "Extracting Skills",
  "Identifying Projects",
  "Understanding Experience",
  "Analyzing Career Strengths",
  "Generating About Section",
  "Improving Project Descriptions",
  "Building AI Knowledge Base",
  "Choosing Portfolio Layout",
  "Optimizing for Recruiters",
  "Publishing Portfolio"
];

// Target progress milestones for each task
const MILESTONES = [8, 16, 25, 33, 42, 50, 58, 67, 75, 83, 92, 100];

// AI Career Insights (Step 2)
const AI_INSIGHTS = [
  "You have strong experience in React, Node.js and AI. We'll highlight you as a Full Stack AI Developer.",
  "We detected multiple competitive programming achievements. We'll create a dedicated achievements section.",
  "Your internship demonstrates backend engineering experience. We'll emphasize production-ready software development.",
  "Your projects demonstrate increasing technical complexity. We'll arrange them in that order."
];

// Content Improvement Preview (Step 6)
const CONTENT_IMPROVEMENTS = [
  {
    original: "Worked on Expense Tracker.",
    improved: "Built a scalable expense tracking application using React and Firebase featuring authentication, analytics and responsive UI."
  },
  {
    original: "Helped in improving website speed.",
    improved: "Optimized critical frontend bundle assets and code-splitting, leading to a 42% reduction in LCP and significantly improved SEO."
  },
  {
    original: "Fixed bugs in database.",
    improved: "Restructured Prisma schema relations and implemented query caching, reducing API latency overhead by 120ms."
  }
];

// Live typing segments for the "About Me" generator (Step 3)
const ABOUT_DRAFTS = [
  "Passionate software developer dedicated to crafting modern web applications...",
  "Mathematics and Computing undergraduate bridging theory with robust software design...",
  "Experienced in building AI-powered applications, integrating large language models, and developing low-latency database queries...",
  "Full Stack Engineer specializing in React, Node.js, and generative AI. Experienced in building glassmorphic responsive interfaces, scaling API gateways, and structuring recruiter-friendly project showcases."
];

export const AIGenerationProgress: React.FC<AIGenerationProgressProps> = ({
  apiPromise,
  onComplete,
  onCancel
}) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayedProgress, setDisplayedProgress] = useState(0);
  
  // Real-time UI states
  const [insightIndex, setInsightIndex] = useState(0);
  const [improvementIndex, setImprovementIndex] = useState(0);
  
  // Typewriter effect state for live writing
  const [aboutText, setAboutText] = useState("");
  const [aboutDraftIndex, setAboutDraftIndex] = useState(0);
  const typewriterTimer = useRef<any>(null);

  // AI Career Profile confidence score
  const [profileConfidence, setProfileConfidence] = useState(0);
  
  // API response slug & errors
  const [apiSlug, setApiSlug] = useState<string | null>(null);
  const [apiPortfolio, setApiPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Resolve Generation API Call
  useEffect(() => {
    let active = true;
    apiPromise
      .then((data) => {
        if (active) {
          setApiSlug(data.slug);
          setApiPortfolio(data.portfolio);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setError(err.message || 'Failed to generate portfolio. Please try again.');
        }
      });
    return () => { active = false; };
  }, [apiPromise]);

  // 2. Automate step-by-step pipeline progress
  useEffect(() => {
    if (error) return;

    // Simulate different delays per task for a realistic feeling
    const delays = [1100, 1300, 1500, 1400, 1300, 1200, 1800, 1500, 1400, 1300, 1200, 1100];
    const delay = delays[currentTaskIndex] || 1200;

    const timer = setTimeout(() => {
      if (currentTaskIndex < PIPELINE_TASKS.length - 1) {
        // Increment task (up to final step: "Publishing Portfolio")
        setCurrentTaskIndex(prev => prev + 1);
      } else if (currentTaskIndex === PIPELINE_TASKS.length - 1 && apiSlug) {
        // Complete the final task only when the API has resolved
        setCurrentTaskIndex(PIPELINE_TASKS.length);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentTaskIndex, apiSlug, error]);

  // 3. Update Target progress bar value based on tasks completed
  useEffect(() => {
    if (currentTaskIndex < PIPELINE_TASKS.length) {
      setTargetProgress(MILESTONES[currentTaskIndex]);
    } else {
      setTargetProgress(100);
    }
  }, [currentTaskIndex]);

  // 4. Animate displayed progress smoothly
  useEffect(() => {
    if (displayedProgress < targetProgress) {
      const stepTime = Math.max(15, Math.floor(800 / (targetProgress - displayedProgress)));
      const timer = setTimeout(() => {
        setDisplayedProgress(prev => Math.min(prev + 1, targetProgress));
      }, stepTime);
      return () => clearTimeout(timer);
    }
  }, [displayedProgress, targetProgress]);

  // 5. Rotate Insights and Content Improvements
  useEffect(() => {
    const insightInterval = setInterval(() => {
      setInsightIndex(prev => (prev + 1) % AI_INSIGHTS.length);
    }, 4500);

    const improvementInterval = setInterval(() => {
      setImprovementIndex(prev => (prev + 1) % CONTENT_IMPROVEMENTS.length);
    }, 5500);

    return () => {
      clearInterval(insightInterval);
      clearInterval(improvementInterval);
    };
  }, []);

  // 6. Typing typewriter simulation for "About Me" segment
  useEffect(() => {
    // When progress hits 45%, trigger typewriter. Change drafts at 55%, 70%, 85%
    let draftIdx = 0;
    if (displayedProgress >= 85) {
      draftIdx = 3;
    } else if (displayedProgress >= 70) {
      draftIdx = 2;
    } else if (displayedProgress >= 55) {
      draftIdx = 1;
    } else if (displayedProgress >= 42) {
      draftIdx = 0;
    } else {
      setAboutText("Connecting parser to about me generators...");
      return;
    }

    setAboutDraftIndex(draftIdx);
    const targetText = ABOUT_DRAFTS[draftIdx];
    
    // Reset typing on index change or type out characters
    let currentLetters = "";
    let i = 0;
    
    if (typewriterTimer.current) clearInterval(typewriterTimer.current);

    typewriterTimer.current = setInterval(() => {
      if (i < targetText.length) {
        currentLetters += targetText[i];
        setAboutText(currentLetters);
        i++;
      } else {
        if (typewriterTimer.current) clearInterval(typewriterTimer.current);
      }
    }, 20);

    return () => {
      if (typewriterTimer.current) clearInterval(typewriterTimer.current);
    };
  }, [displayedProgress, aboutDraftIndex]);

  // 7. Confidence Score Counter (Step 4)
  useEffect(() => {
    if (displayedProgress >= 25 && profileConfidence < 94) {
      const timer = setTimeout(() => {
        setProfileConfidence(prev => Math.min(prev + 1, 94));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [displayedProgress, profileConfidence]);

  // Floating background particles
  const particles = React.useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: [Math.random() * 100 - 50 + '%', Math.random() * 100 - 50 + '%'],
      y: [Math.random() * 100 - 50 + '%', Math.random() * 100 - 50 + '%'],
      size: Math.random() * 3 + 2,
      duration: Math.random() * 15 + 20
    }));
  }, []);

  // Determine current quality score (Step 7)
  const getQualityScore = () => {
    if (displayedProgress >= 90) return 96;
    if (displayedProgress >= 75) return 91;
    if (displayedProgress >= 55) return 82;
    if (displayedProgress >= 30) return 74;
    return 61;
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#070709] text-gray-200 z-50 overflow-y-auto flex flex-col font-sans select-none scrollbar-thin">
      
      {/* Background glowing rings/particles */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-900/5 rounded-full filter blur-[150px] pointer-events-none -z-10 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-950/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute bg-purple-500/10 rounded-full pointer-events-none -z-10"
          style={{ width: p.size, height: p.size }}
          animate={{ x: p.x, y: p.y }}
          transition={{ duration: p.duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      ))}

      {/* ERROR MODAL */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[60] p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl"
            >
              <div className="mx-auto bg-red-950/40 border border-red-500/30 w-16 h-16 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-red-400 font-heading">Generation Halted</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{error}</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onCancel}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Go Back & Retry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN MAIN WRAPPER */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow flex flex-col justify-between relative z-10">
        
        {/* Top Progress bar & Header */}
        <header className="w-full space-y-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-950/40 border border-purple-800/30 rounded-full text-purple-400 text-xs font-semibold">
                <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                <span>AI Career Architect Console v2.0</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">
                Building Your Personal Brand
              </h1>
              <p className="text-xs md:text-sm text-gray-400 max-w-2xl leading-relaxed">
                Our AI is analyzing your experience, improving your content, and creating a recruiter-ready portfolio.
              </p>
            </div>

            {/* Global Progress Indicators */}
            <div className="flex items-center space-x-4 shrink-0 bg-white/5 border border-white/5 px-5 py-3 rounded-2xl backdrop-blur-md">
              <div className="text-right">
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Engine Status</span>
                <span className="text-sm font-semibold text-purple-400">
                  {displayedProgress < 100 ? 'Synthesizing...' : 'Deployment Complete'}
                </span>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-4xl font-black text-white font-mono tracking-tight shrink-0">
                {displayedProgress}%
              </div>
            </div>
          </div>

          {/* Smooth Global Progress Bar */}
          <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-violet-500"
              style={{ width: `${displayedProgress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
        </header>

        {/* Dashboard Grid System */}
        <main className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 flex-grow">
          
          {/* COLUMN 1: Task Pipeline & Knowledge Connection (Left) */}
          <section className="lg:col-span-1 flex flex-col space-y-6">
            
            {/* Task Pipeline (Step 1) */}
            <div className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl flex flex-col flex-grow shadow-lg">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4 flex items-center justify-between">
                <span>AI Pipeline Monitor</span>
                <span className="text-xs text-gray-500">Step 1 of 12</span>
              </h2>

              <div className="space-y-2.5 overflow-y-auto max-h-[360px] pr-2 scrollbar-thin flex-grow">
                {PIPELINE_TASKS.map((task, idx) => {
                  let status: 'pending' | 'processing' | 'completed' = 'pending';
                  if (idx < currentTaskIndex) status = 'completed';
                  else if (idx === currentTaskIndex) status = 'processing';

                  return (
                    <motion.div
                      key={task}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        status === 'processing'
                          ? 'bg-purple-950/20 border-purple-500/30'
                          : status === 'completed'
                          ? 'bg-white/5 border-white/5'
                          : 'border-transparent opacity-40'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          {status === 'completed' && (
                            <div className="w-5 h-5 rounded-full bg-purple-650 border border-purple-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white stroke-[3px]" />
                            </div>
                          )}
                          {status === 'processing' && (
                            <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                          )}
                          {status === 'pending' && (
                            <div className="w-3.5 h-3.5 rounded-full border border-gray-700" />
                          )}
                        </div>
                        <span className={`text-xs font-semibold ${status === 'processing' ? 'text-white' : 'text-gray-300'}`}>
                          {task}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                        {status === 'completed' ? 'Done' : status === 'processing' ? 'Active' : 'Pending'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Knowledge Graph Connection (Step 10) */}
            <div className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-lg shrink-0">
              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4">
                Career Knowledge Graph
              </h2>
              <div className="flex justify-between items-center py-2 relative">
                {/* Connectors (SVGs) */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 pointer-events-none -z-10 bg-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${displayedProgress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>

                {[
                  { label: "Resume", minPrg: 0, icon: FileText },
                  { label: "Skills", minPrg: 20, icon: Code },
                  { label: "Projects", minPrg: 40, icon: Cpu },
                  { label: "Experience", minPrg: 60, icon: Briefcase },
                  { label: "Achievements", minPrg: 80, icon: ShieldCheck },
                  { label: "Portfolio", minPrg: 95, icon: LayoutGrid },
                ].map((node) => {
                  const Icon = node.icon;
                  const isActive = displayedProgress >= node.minPrg;
                  return (
                    <div key={node.label} className="flex flex-col items-center space-y-1.5 relative z-10">
                      <motion.div
                        animate={isActive ? { scale: [1, 1.1, 1], boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)' } : {}}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border ${
                          isActive
                            ? 'bg-purple-650 border-purple-500 text-white'
                            : 'bg-[#1a1a1f] border-gray-800 text-gray-600'
                        }`}
                        title={node.label}
                      >
                        <Icon className="h-4 w-4" />
                      </motion.div>
                      <span className={`text-[9px] font-semibold tracking-tight ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* COLUMN 2: Live Writing & Skill Clustering (Middle) */}
          <section className="lg:col-span-1 flex flex-col space-y-6">
            
            {/* Live Writing Terminal (Step 3) */}
            <div className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl flex flex-col flex-grow shadow-lg relative min-h-[220px]">
              <div className="absolute top-3 right-4 flex space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
              </div>

              <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-4 flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                <span>AI Copilot Writer</span>
              </h2>

              <div className="flex-grow bg-black/40 border border-white/5 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-purple-300 overflow-y-auto max-h-[220px]">
                <div className="text-gray-500 mb-1 flex justify-between items-center">
                  <span>[agent_writer_kernel.log]</span>
                  <span className="animate-pulse bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                    Draft {aboutDraftIndex + 1}/4
                  </span>
                </div>
                <div className="text-white whitespace-pre-wrap font-sans text-xs">
                  {aboutText}
                  {displayedProgress < 100 && (
                    <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle" />
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center space-x-2 text-[10px] text-gray-500">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span>Generating custom Bento copy using resume achivements context.</span>
              </div>
            </div>

            {/* Skill Clustering (Step 5) */}
            <AnimatePresence>
              {displayedProgress >= 15 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-lg"
                >
                  <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-3">
                    Extracted Skill Clusters
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { cat: "Frontend", color: "text-purple-400", skills: ["React", "Next.js", "Tailwind"] },
                      { cat: "Backend", color: "text-violet-400", skills: ["Node.js", "Express", "MongoDB"] },
                      { cat: "Programming", color: "text-indigo-400", skills: ["C++", "Java", "Python"] },
                      { cat: "AI Models", color: "text-fuchsia-400", skills: ["OpenAI", "Gemini", "RAG"] },
                    ].map((group, index) => (
                      <motion.div
                        key={group.cat}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.15 }}
                        className="bg-white/5 border border-white/5 rounded-xl p-3"
                      >
                        <h3 className={`text-xs font-bold ${group.color} mb-1.5 uppercase tracking-wider`}>
                          {group.cat}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {group.skills.map(s => (
                            <span key={s} className="text-[10px] bg-black/40 text-gray-300 border border-white/5 px-2 py-0.5 rounded-md font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </section>

          {/* COLUMN 3: Profile Analysis, Score, Decisions (Right) */}
          <section className="lg:col-span-1 flex flex-col space-y-6">
            
            {/* AI Profile Reasoning (Step 4) */}
            <AnimatePresence>
              {displayedProgress >= 25 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-lg relative overflow-hidden"
                >
                  {/* Glowing top accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full filter blur-xl" />

                  <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center justify-between">
                    <span>AI Reasoning Classifier</span>
                    <span className="text-[10px] font-mono text-gray-500">Step 4</span>
                  </h2>

                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Primary Identity</span>
                        <span className="text-sm font-bold text-white">Full Stack AI Developer</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">Confidence</span>
                        <span className="text-sm font-mono font-bold text-green-400">{profileConfidence}%</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold mb-2">
                        Secondary Domains Identified
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Backend Engineering",
                          "Machine Learning",
                          "Competitive Programming",
                          "Cloud Development"
                        ].map(d => (
                          <span key={d} className="text-[10px] bg-purple-950/20 text-purple-300 border border-purple-900/30 px-2.5 py-1 rounded-full font-semibold">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quality Score & Content Improvements (Steps 7 & 6) */}
            <div className="glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-lg flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">
                  Refinement Metrics
                </h2>
                {/* Score badge */}
                <div className="flex items-center space-x-2 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-xl">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-purple-300">
                    Quality: {getQualityScore()}
                  </span>
                </div>
              </div>

              {/* Steps 6 (Content Improvements) */}
              <div className="flex-grow space-y-4">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                    Narrative Enhancement
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={improvementIndex}
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -5 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2.5 text-xs"
                    >
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold block mb-1">
                          Original Text
                        </span>
                        <p className="italic text-gray-500 font-medium">
                          "{CONTENT_IMPROVEMENTS[improvementIndex].original}"
                        </p>
                      </div>
                      
                      <div className="bg-purple-950/20 p-2.5 rounded-lg border border-purple-900/30">
                        <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold block mb-1">
                          AI Enhanced
                        </span>
                        <p className="text-gray-200 font-semibold leading-relaxed">
                          "{CONTENT_IMPROVEMENTS[improvementIndex].improved}"
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Score details (Step 7) */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { label: "Improved About Section", minPrg: 30 },
                    { label: "Better Project Descriptions", minPrg: 55 },
                    { label: "Recruiter Friendly Layout", minPrg: 75 },
                    { label: "SEO Optimized Meta", minPrg: 90 },
                  ].map(item => {
                    const isAdded = displayedProgress >= item.minPrg;
                    return (
                      <div 
                        key={item.label} 
                        className={`flex items-center space-x-2 px-2 py-1.5 rounded-lg border ${
                          isAdded 
                            ? 'bg-green-950/10 border-green-500/20 text-green-400' 
                            : 'bg-white/5 border-white/5 text-gray-600'
                        }`}
                      >
                        <Check className={`h-3.5 w-3.5 shrink-0 ${isAdded ? 'text-green-400' : 'text-gray-700'}`} />
                        <span className="font-semibold">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </section>

        </main>

        {/* Bottom Panel: Live Insights, Missing Information, and Explanations */}
        <footer className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          
          {/* Live Insights Banner (Step 2) */}
          <div className="glass-panel border border-white/5 bg-[#121215]/60 p-5 rounded-2xl shadow-lg flex items-center">
            <div className="flex items-start space-x-3.5 w-full">
              <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-1 flex-grow">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">
                  AI Context Insight
                </span>
                <div className="h-10 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={insightIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-semibold text-gray-200 leading-normal"
                    >
                      {AI_INSIGHTS[insightIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Info Suggestions (Step 8) */}
          <div className="glass-panel border border-white/5 bg-[#121215]/60 p-5 rounded-2xl shadow-lg flex items-center">
            <div className="flex items-start space-x-3.5 w-full">
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-grow">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                  AI Recommendation
                </span>
                <AnimatePresence mode="wait">
                  {displayedProgress >= 70 ? (
                    <motion.div
                      key="recommendations"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-semibold text-gray-200"
                    >
                      {displayedProgress >= 90 ? (
                        <p>👤 Adding a professional headshot improves recruiter trust by 45%.</p>
                      ) : displayedProgress >= 80 ? (
                        <p>📸 Uploading project screenshots increases engagement by 3x.</p>
                      ) : (
                        <p>🔗 Adding GitHub can significantly improve your portfolio strength.</p>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-gray-600 font-semibold italic">Scanning for improvements...</p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* AI Decision Explanations (Step 9) */}
          <div className="glass-panel border border-white/5 bg-[#121215]/60 p-5 rounded-2xl shadow-lg flex items-center">
            <div className="flex items-start space-x-3.5 w-full">
              <div className="p-3 bg-fuchsia-950/40 border border-fuchsia-500/20 rounded-xl text-fuchsia-400 shrink-0">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div className="space-y-1 flex-grow">
                <span className="text-[10px] uppercase font-bold text-fuchsia-400 tracking-wider block">
                  Architect's Choice
                </span>
                <AnimatePresence mode="wait">
                  {displayedProgress >= 80 ? (
                    <motion.div
                      key="decisions"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-200 leading-normal"
                    >
                      {displayedProgress >= 90 ? (
                        <p><strong>Layout:</strong> placed Projects before Experience as projects are your strongest asset.</p>
                      ) : (
                        <p><strong>Theme:</strong> selected Developer Theme because of your GitHub and AI projects.</p>
                      )}
                    </motion.div>
                  ) : (
                    <p className="text-xs text-gray-600 font-semibold italic">Calculating visual hierarchy...</p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </footer>

      </div>

      {/* FULL SCREEN COMPLETION OVERLAY (Step 12) */}
      <AnimatePresence>
        {displayedProgress >= 100 && apiSlug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 w-screen h-screen bg-[#070709] z-50 flex items-center justify-center p-6 overflow-y-auto"
          >
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full filter blur-[150px] pointer-events-none -z-10 animate-pulse duration-[6000ms]" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-950/10 rounded-full filter blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-xl w-full flex flex-col items-center space-y-8">
              {/* Scale-in Success Checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 80, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-purple-600 border border-purple-500 flex items-center justify-center shadow-xl shadow-purple-950/50"
              >
                <Check className="h-10 w-10 text-white stroke-[4px]" />
              </motion.div>

              {/* Completion Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white font-heading tracking-tight">
                  Your AI Portfolio is Ready!
                </h1>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Your personalized bento-grid website and recruiter copilot are published.
                </p>
              </div>

              {/* Summary Card (Step 12) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full glass-panel border border-white/5 bg-[#121215]/60 p-6 rounded-3xl shadow-xl space-y-4"
              >
                <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider pb-3 border-b border-white/5">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Career Summary</span>
                </div>
                
                <p className="text-xs leading-relaxed text-gray-300">
                  Based on your resume and skills, the AI Architect has compiled a profile emphasizing:
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {["Full Stack Development", "AI Applications", "Competitive Programming", "Backend Engineering"].map((field, idx) => (
                    <div key={field} className="flex items-center space-x-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[11px] text-purple-400 font-bold font-mono">#{idx + 1}</span>
                      <span className="text-xs font-semibold text-gray-200">{field}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] leading-relaxed text-gray-500 italic pt-2">
                  These represent your strongest technical profile based on parsing your resume, which we have highlighted across the portfolio grid structure.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full flex flex-col sm:flex-row gap-3 pt-2"
              >
                <button
                  onClick={() => apiSlug && apiPortfolio && onComplete(apiSlug, apiPortfolio)}
                  className="flex-1 py-4 bg-purple-650 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-xl shadow-purple-950/40 flex items-center justify-center space-x-2 transition transform hover:scale-[1.01]"
                >
                  <span>View Portfolio</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={onCancel}
                  className="py-4 px-5 bg-transparent hover:bg-white/5 text-gray-500 hover:text-white border border-transparent hover:border-white/5 rounded-2xl flex items-center justify-center transition"
                  title="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default AIGenerationProgress;
