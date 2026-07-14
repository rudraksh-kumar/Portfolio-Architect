import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Plus, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Copy, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Briefcase, 
  GraduationCap, 
  Trophy, 
  Code2, 
  FolderGit2, 
  Info,
  FileText,
  User
} from 'lucide-react';
import type { PortfolioData } from '../types.js';

interface AIPortfolioReviewProps {
  initialData: PortfolioData;
  slug: string;
  token: string;
  readinessScore: number;
  setReadinessScore: React.Dispatch<React.SetStateAction<number>>;
  categoriesScore: {
    content: number;
    projects: number;
    design: number;
    recruiter: number;
    seo: number;
    visual: number;
  };
  setCategoriesScore: React.Dispatch<React.SetStateAction<{
    content: number;
    projects: number;
    design: number;
    recruiter: number;
    seo: number;
    visual: number;
  }>>;
  onNext: (updatedData: PortfolioData) => void;
  onCancel: () => void;
}

export const AIPortfolioReview: React.FC<AIPortfolioReviewProps> = ({
  initialData,
  token,
  readinessScore,
  setReadinessScore,
  categoriesScore,
  setCategoriesScore,
  onNext,
  onCancel
}) => {
  // Main state holding the parsed portfolio details
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(initialData);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0);

  React.useEffect(() => {
    const checkAndFetchSummaries = async () => {
      if (portfolioData.basics.alternateSummaries && portfolioData.basics.alternateSummaries.length > 0) {
        return;
      }
      try {
        const response = await fetch('/api/portfolio/ai/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'alternate-summaries',
            portfolioData
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.alternateSummaries && result.alternateSummaries.length > 0) {
            setPortfolioData(prev => ({
              ...prev,
              basics: {
                ...prev.basics,
                alternateSummaries: result.alternateSummaries
              }
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching alternate summaries:', err);
      }
    };
    checkAndFetchSummaries();
  }, [token]);

  // Expand/collapse states for sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    profile: true,
    skills: true,
    projects: true,
    experience: false,
    education: false,
    achievements: false,
    missingInfo: true,
    decisions: false,
  });

  // Edit Modals / Inline Edit helpers
  const [activeEditSection, setActiveEditSection] = useState<string | null>(null);
  
  // Custom dialog popup states
  const [customPrompt, setCustomPrompt] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    fields: { key: string; label: string; defaultValue: string; type?: 'text' | 'textarea' }[];
    onSubmit: (values: Record<string, string>) => void;
  } | null>(null);
  
  // Section-specific temporary states for modals
  const [tempBio, setTempBio] = useState(portfolioData.basics.bio);
  const taglineRaw = portfolioData.basics.tagline as any;
  const [tempTaglineHeading, setTempTaglineHeading] = useState(
    taglineRaw && typeof taglineRaw === 'object'
      ? taglineRaw.heading
      : portfolioData.basics.professionalTitle || ''
  );
  const [tempTaglineExplanation, setTempTaglineExplanation] = useState(
    taglineRaw && typeof taglineRaw === 'object'
      ? taglineRaw.explanation
      : typeof taglineRaw === 'string'
      ? taglineRaw
      : ''
  );
  const [tempTitle, setTempTitle] = useState(portfolioData.basics.professionalTitle);
  const [tempName, setTempName] = useState(portfolioData.basics.name);
  const [tempLocation, setTempLocation] = useState(portfolioData.basics.location || '');



  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Dynamic Suggestion lists
  const [suggestions, setSuggestions] = useState([
    { id: 'photo', text: "Uploading a professional photo increases recruiter engagement by 45%.", done: false, type: 'photo' },
    { id: 'github', text: "Adding GitHub link allows us to automatically showcase repositories.", done: !!portfolioData.socials.github, type: 'github' },
    { id: 'screenshot', text: "Adding project screenshots creates a stronger visual portfolio.", done: false, type: 'screenshots' },
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filter experience to only include items that do not look like projects
  const experienceItems = portfolioData.experience.filter(exp => {
    const company = exp.company.toLowerCase();
    const role = exp.role.toLowerCase();
    const isProjectLike = company.includes('project') || role.includes('project');
    
    const matchesProjectName = portfolioData.projects.some(proj => 
      proj.name.toLowerCase().includes(company) || 
      company.includes(proj.name.toLowerCase())
    );
    
    return !isProjectLike && !matchesProjectName;
  });

  // --- ACTIONS ---

  const handleCopySummary = () => {
    navigator.clipboard.writeText(portfolioData.basics.bio);
    triggerToast('Summary copied to clipboard!', 'success');
  };

  // Section 1: Regenerate Summary (uses cached AI summaries)
  const handleRegenerateSummary = async () => {
    let alternates = portfolioData.basics.alternateSummaries || [];
    
    if (alternates.length === 0) {
      setLoadingAI(true);
      setAiMessage('Generating alternate professional summaries...');
      try {
        const response = await fetch('/api/portfolio/ai/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            action: 'alternate-summaries',
            portfolioData
          })
        });

        if (!response.ok) {
          throw new Error('AI Service failed to generate summaries.');
        }

        const result = await response.json();
        if (result.alternateSummaries && result.alternateSummaries.length > 0) {
          alternates = result.alternateSummaries;
          setPortfolioData(prev => ({
            ...prev,
            basics: {
              ...prev.basics,
              alternateSummaries: result.alternateSummaries
            }
          }));
        } else {
          throw new Error('No summaries generated.');
        }
      } catch (err: any) {
        console.error(err);
        triggerToast(err.message || 'Failed to generate alternate summaries.', 'error');
        return;
      } finally {
        setLoadingAI(false);
        setAiMessage('');
      }
    }

    const nextIdx = (currentSummaryIndex + 1) % alternates.length;
    setCurrentSummaryIndex(nextIdx);
    const selectedSummary = alternates[nextIdx];

    setPortfolioData(prev => ({
      ...prev,
      basics: { ...prev.basics, bio: selectedSummary }
    }));
    // Boost visual/content score slightly
    setCategoriesScore(prev => ({ ...prev, content: Math.min(prev.content + 1, 100) }));
  };

  // Section 9: AI Auto-Improvement Actions
  const handleImproveAll = async () => {
    setLoadingAI(true);
    setAiMessage('Analyzing resume and polishing content...');
    try {
      const response = await fetch('/api/portfolio/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'improve-all',
          portfolioData
        })
      });

      if (!response.ok) {
        throw new Error('AI Service failed to optimize your portfolio.');
      }

      const result = await response.json();
      setPortfolioData(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          bio: result.bio,
          tagline: result.tagline
        }
      }));
      setReadinessScore(result.readinessScore);
      setCategoriesScore(result.categoriesScore);
      triggerToast('AI polished all sections successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Failed to improve content using AI.', 'error');
    } finally {
      setLoadingAI(false);
      setAiMessage('');
    }
  };

  const handleRecruiterFriendly = async () => {
    setLoadingAI(true);
    setAiMessage('Crafting recruiter-friendly pitch...');
    try {
      const response = await fetch('/api/portfolio/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'recruiter-friendly',
          portfolioData
        })
      });

      if (!response.ok) {
        throw new Error('AI Service failed to optimize biography.');
      }

      const result = await response.json();
      setPortfolioData(prev => ({
        ...prev,
        basics: {
          ...prev.basics,
          bio: result.bio
        }
      }));
      setCategoriesScore(prev => ({ ...prev, recruiter: result.recruiterScore }));
      triggerToast('Biography optimized for recruiters!', 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || 'Failed to optimize biography.', 'error');
    } finally {
      setLoadingAI(false);
      setAiMessage('');
    }
  };



  const handleRankProjects = () => {
    // Sort projects
    setPortfolioData(prev => {
      const sorted = [...prev.projects].sort((a, b) => b.techStack.length - a.techStack.length);
      return { ...prev, projects: sorted };
    });
    setCategoriesScore(prev => ({ ...prev, projects: 98 }));
    triggerToast('Projects reordered by complexity!', 'success');
  };

  // Section 3: Skills manipulation
  const handleAddSkill = (catIndex: number) => {
    setCustomPrompt({
      isOpen: true,
      title: "Add New Skill",
      fields: [{ key: 'name', label: 'Skill Name', defaultValue: '' }],
      onSubmit: (values) => {
        const skillName = values.name?.trim();
        if (!skillName) return;
        setPortfolioData(prev => {
          const updated = [...prev.skills];
          updated[catIndex] = {
            ...updated[catIndex],
            items: [...updated[catIndex].items, skillName]
          };
          return { ...prev, skills: updated };
        });
      }
    });
  };

  const handleRemoveSkill = (catIndex: number, skillIndex: number) => {
    setPortfolioData(prev => {
      const updated = [...prev.skills];
      const items = [...updated[catIndex].items];
      items.splice(skillIndex, 1);
      updated[catIndex] = { ...updated[catIndex], items };
      return { ...prev, skills: updated };
    });
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= portfolioData.skills.length) return;

    setPortfolioData(prev => {
      const updated = [...prev.skills];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, skills: updated };
    });
  };

  // Section 4: Projects editing
  const handleDeleteProject = (projIdx: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setPortfolioData(prev => {
      const updated = [...prev.projects];
      updated.splice(projIdx, 1);
      return { ...prev, projects: updated };
    });
  };

  const handleEditProject = (projIdx: number) => {
    const proj = portfolioData.projects[projIdx];
    setCustomPrompt({
      isOpen: true,
      title: "Edit Project Details",
      fields: [
        { key: 'name', label: 'Project Name', defaultValue: proj.name },
        { key: 'description', label: 'Short Description', defaultValue: proj.description, type: 'textarea' },
        { key: 'details', label: 'Project Details (from Resume)', defaultValue: proj.details || '', type: 'textarea' },
        { key: 'challengesSolved', label: 'AI Highlight (Challenges Solved)', defaultValue: proj.challengesSolved || '', type: 'textarea' }
      ],
      onSubmit: (values) => {
        const newName = values.name?.trim();
        const newDesc = values.description?.trim();
        const newDetails = values.details?.trim();
        const newChallenges = values.challengesSolved?.trim();
        setPortfolioData(prev => {
          const updated = [...prev.projects];
          updated[projIdx] = {
            ...updated[projIdx],
            name: newName || proj.name,
            description: newDesc || proj.description,
            details: newDetails || proj.details,
            challengesSolved: newChallenges || proj.challengesSolved
          };
          return { ...prev, projects: updated };
        });
      }
    });
  };

  // Section 8: Upload handlers
  const handleResolveSuggestion = (id: string, type: string) => {
    if (type === 'github') {
      setCustomPrompt({
        isOpen: true,
        title: "Link GitHub Profile",
        fields: [{ key: 'handle', label: 'GitHub Profile URL or Username', defaultValue: '' }],
        onSubmit: (values) => {
          const handle = values.handle?.trim();
          if (handle) {
            setPortfolioData(prev => ({
              ...prev,
              socials: { ...prev.socials, github: handle }
            }));
            setSuggestions(prev => prev.map(s => s.id === id ? { ...s, done: true } : s));
          }
        }
      });
    } else {
      // Mock photo/screenshots upload
      triggerToast('Mock file uploaded successfully!', 'success');
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, done: true } : s));
      setReadinessScore(prev => Math.min(prev + 2, 100));
    }
  };

  // Save Basics changes
  const handleSaveBasics = () => {
    setPortfolioData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        name: tempName,
        bio: tempBio,
        tagline: {
          heading: tempTaglineHeading,
          explanation: tempTaglineExplanation
        },
        professionalTitle: tempTitle,
        location: tempLocation
      }
    }));
    setActiveEditSection(null);
  };

  const handleNext = () => {
    onNext(portfolioData);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#070709] text-gray-200 z-40 flex flex-col font-sans select-none overflow-hidden">
      
      {/* AI loading overlay */}
      {loadingAI && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center flex-col space-y-4">
          <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          <p className="text-xs font-semibold text-white tracking-wider uppercase font-mono">{aiMessage}</p>
        </div>
      )}

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-purple-900/5 rounded-full filter blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-950/5 rounded-full filter blur-[120px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
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
              <span>Review Your AI Understanding</span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Our AI analyzed your resume and built your professional profile. Review everything before we generate your portfolio.
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT GRID */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT COLUMN: The Interactive Form (Scrollable) */}
        <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Active section edit modal overlay */}
          <AnimatePresence>
            {activeEditSection === 'basics' && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel border-purple-500/30 p-6 rounded-2xl max-w-lg w-full space-y-4"
                >
                  <h3 className="text-base font-bold text-white">Edit Profile Basics</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)} 
                        className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Professional Title</label>
                      <input 
                        type="text" 
                        value={tempTitle} 
                        onChange={(e) => setTempTitle(e.target.value)} 
                        className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Tagline Heading</label>
                      <input 
                        type="text" 
                        value={tempTaglineHeading} 
                        onChange={(e) => setTempTaglineHeading(e.target.value)} 
                        className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Tagline Explanation</label>
                      <input 
                        type="text" 
                        value={tempTaglineExplanation} 
                        onChange={(e) => setTempTaglineExplanation(e.target.value)} 
                        className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Location</label>
                      <input 
                        type="text" 
                        value={tempLocation} 
                        onChange={(e) => setTempLocation(e.target.value)} 
                        className="w-full px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1.5">Professional Summary</label>
                      <textarea 
                        value={tempBio} 
                        onChange={(e) => setTempBio(e.target.value)} 
                        className="w-full h-24 px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button 
                      onClick={() => setActiveEditSection(null)} 
                      className="px-4 py-2 border border-white/5 hover:bg-white/5 text-gray-400 rounded-xl text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveBasics} 
                      className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Custom Input Dialog Modal */}
          <AnimatePresence>
            {customPrompt && customPrompt.isOpen && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md"
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
                  
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    <span>{customPrompt.title}</span>
                  </h3>
                  
                  {customPrompt.description && (
                    <p className="text-xs text-gray-400 mb-4">{customPrompt.description}</p>
                  )}
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const values: Record<string, string> = {};
                      customPrompt.fields.forEach(field => {
                        values[field.key] = (formData.get(field.key) as string) || '';
                      });
                      customPrompt.onSubmit(values);
                      setCustomPrompt(null);
                    }}
                    className="space-y-4"
                  >
                    {customPrompt.fields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            name={field.key}
                            defaultValue={field.defaultValue}
                            rows={field.key === 'bio' || field.key === 'bullets' || field.key === 'details' || field.key === 'description' || field.key === 'challengesSolved' ? 8 : 4}
                            autoFocus
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition resize-y scrollbar-thin"
                          />
                        ) : (
                          <input
                            type="text"
                            name={field.key}
                            defaultValue={field.defaultValue}
                            autoFocus
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCustomPrompt(null)}
                        className="px-4 py-2 border border-white/5 hover:bg-white/5 text-gray-400 text-xs font-bold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-950/20"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Section 10: Portfolio Preview Score Banner */}
          <div className="glass-panel border-purple-500/20 bg-purple-950/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              {/* Circular animated readiness score */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="absolute w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-white/5 fill-transparent" strokeWidth="6" />
                  <motion.circle 
                    cx="40" cy="40" r="34" 
                    className="stroke-purple-500 fill-transparent" 
                    strokeWidth="6" 
                    strokeDasharray={213.6}
                    initial={{ strokeDashoffset: 213.6 }}
                    animate={{ strokeDashoffset: 213.6 - (213.6 * readinessScore) / 100 }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <span className="text-xl font-black font-mono text-white">{readinessScore}%</span>
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-bold text-white">Portfolio Readiness Score</h3>
                <p className="text-xs text-gray-400">AI analysis indicates your profile has high recruiter appeal and visual cohesion.</p>
              </div>
            </div>

            {/* score category breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full md:w-auto">
              {[
                { name: "Content Quality", score: categoriesScore.content },
                { name: "Projects Detail", score: categoriesScore.projects },
                { name: "Design Setup", score: categoriesScore.design },
                { name: "Recruiter Appeal", score: categoriesScore.recruiter },
                { name: "SEO Metadata", score: categoriesScore.seo },
                { name: "Visual Polish", score: categoriesScore.visual }
              ].map(cat => (
                <div key={cat.name} className="bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">{cat.name}</span>
                  <span className="text-xs font-mono font-bold text-purple-400">{cat.score}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1: AI SUMMARY */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('summary')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Summary</h3>
                <span className="text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-400 font-bold">96% Confidence</span>
              </div>
              {expandedSections.summary ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.summary && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <p className="text-xs leading-relaxed text-gray-300 bg-black/20 border border-white/5 p-4 rounded-xl font-medium">
                  "{portfolioData.basics.bio}"
                </p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleRegenerateSummary}
                    className="px-3 py-1.5 bg-purple-950/30 hover:bg-purple-950/60 border border-purple-500/20 text-purple-400 hover:text-purple-300 text-[10px] font-bold rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Regenerate Summary</span>
                  </button>
                  <button 
                    onClick={() => {
                      setCustomPrompt({
                        isOpen: true,
                        title: "Edit Professional Summary",
                        fields: [
                          { key: 'bio', label: 'Biography / Summary', defaultValue: portfolioData.basics.bio, type: 'textarea' }
                        ],
                        onSubmit: (values) => {
                          const newBio = values.bio?.trim();
                          if (newBio) {
                            setPortfolioData(prev => ({
                              ...prev,
                              basics: { ...prev.basics, bio: newBio }
                            }));
                          }
                        }
                      });
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Summary</span>
                  </button>
                  <button 
                    onClick={handleCopySummary}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy Summary</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: CAREER PROFILE */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('profile')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Career Profile</h3>
                <span className="text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-400 font-bold">98% Match</span>
              </div>
              {expandedSections.profile ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.profile && (
              <div className="p-5 space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5">
                      Primary Career Identity
                    </label>
                    <div className="bg-black/20 border border-white/5 px-3 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-semibold text-white">
                        {portfolioData.basics.professionalTitle}
                      </span>
                      <button 
                        onClick={() => {
                          setTempTitle(portfolioData.basics.professionalTitle);
                          setActiveEditSection('basics');
                        }}
                        className="p-1 text-gray-400 hover:text-purple-400 transition"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5">
                      Confidence Indicator
                    </label>
                    <div className="bg-black/20 border border-white/5 px-3 py-2.5 rounded-xl flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-xs font-mono font-bold text-green-400">96% Verified Profile</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1.5">
                    Secondary Roles Identities
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Backend Engineer",
                      "Frontend Developer",
                      "Machine Learning Enthusiast",
                      "Competitive Programmer"
                    ].map(role => (
                      <span key={role} className="text-xs bg-purple-950/25 text-purple-300 border border-purple-900/40 px-3 py-1.5 rounded-full font-semibold">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setTempName(portfolioData.basics.name);
                      setTempTitle(portfolioData.basics.professionalTitle);
                      setTempLocation(portfolioData.basics.location || '');
                      setTempBio(portfolioData.basics.bio);
                      const tagline = portfolioData.basics.tagline as any;
                      setTempTaglineHeading(tagline && typeof tagline === 'object' ? tagline.heading : portfolioData.basics.professionalTitle || '');
                      setTempTaglineExplanation(tagline && typeof tagline === 'object' ? tagline.explanation : typeof tagline === 'string' ? tagline : '');
                      setActiveEditSection('basics');
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Profile Details</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: SKILL ANALYSIS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('skills')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Skill Analysis</h3>
                <span className="text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-400 font-bold">95% Confirmed</span>
              </div>
              {expandedSections.skills ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.skills && (
              <div className="p-5 space-y-5 animate-fadeIn">
                {portfolioData.skills.map((category, catIdx) => (
                  <div key={category.category} className="bg-black/20 border border-white/5 p-4 rounded-2xl relative">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{category.category}</span>
                      
                      {/* Move up / down buttons to reorder categories */}
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => moveCategory(catIdx, 'up')}
                          disabled={catIdx === 0}
                          className="p-1 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30"
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => moveCategory(catIdx, 'down')}
                          disabled={catIdx === portfolioData.skills.length - 1}
                          className="p-1 hover:bg-white/5 rounded text-gray-400 disabled:opacity-30"
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {category.items.map((skill, skillIdx) => (
                        <div 
                          key={skill} 
                          className="group flex items-center space-x-1.5 text-xs bg-[#1a1a1f] border border-white/5 px-2.5 py-1 rounded-lg"
                        >
                          <span className="font-semibold text-gray-300">{skill}</span>
                          <button 
                            onClick={() => handleRemoveSkill(catIdx, skillIdx)}
                            className="text-gray-500 group-hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddSkill(catIdx)}
                      className="px-2.5 py-1 border border-dashed border-gray-800 hover:border-purple-500/50 text-[10px] text-gray-500 hover:text-purple-400 font-semibold rounded-lg flex items-center space-x-1 transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Skill</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: PROJECTS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('projects')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <FolderGit2 className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Detected Projects</h3>
                <span className="text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-400 font-bold">{portfolioData.projects.length} Found</span>
              </div>
              {expandedSections.projects ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.projects && (
              <div className="p-5 space-y-4 animate-fadeIn">
                {portfolioData.projects.map((proj, projIdx) => (
                  <div key={proj.name} className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Project #{projIdx + 1}</span>
                        <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => handleEditProject(projIdx)}
                          className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition"
                          title="Edit Name/Desc"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProject(projIdx)}
                          className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-red-400 transition"
                          title="Delete Project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{proj.description}</p>

                    {proj.details && (
                      <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-2 mt-2">
                        {proj.details}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {proj.techStack.map(t => (
                        <span key={t} className="text-[10px] bg-[#1a1a1f] border border-white/5 px-2 py-0.5 rounded-md font-medium text-gray-300">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* AI Highlight section */}
                    <div className="bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl flex items-start space-x-2 text-xs">
                      <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] uppercase font-bold text-purple-400 block tracking-wider">AI Highlight</span>
                        <p className="text-gray-300 font-medium leading-relaxed">
                          "{proj.challengesSolved || 'Demonstrates architectural skills and problem-solving techniques.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 5: INTERNSHIPS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('experience')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Internships</h3>
                <span className="text-[10px] bg-purple-950/40 border border-purple-500/20 px-2 py-0.5 rounded-full text-purple-400 font-bold">{experienceItems.length} Found</span>
              </div>
              {expandedSections.experience ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.experience && (
              <div className="p-5 space-y-4 animate-fadeIn">
                {experienceItems.map((exp) => {
                  const originalIdx = portfolioData.experience.findIndex(e => e.company === exp.company && e.role === exp.role);
                  return (
                    <div key={exp.company + exp.role} className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{exp.role}</h4>
                          <span className="text-xs text-purple-400 font-semibold">{exp.company} | {exp.duration}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setCustomPrompt({
                              isOpen: true,
                              title: "Edit Internship Details",
                              fields: [
                                { key: 'role', label: 'Role Title', defaultValue: exp.role },
                                { key: 'company', label: 'Company Name', defaultValue: exp.company },
                                { key: 'bullets', label: 'Internship Highlights (One bullet per line)', defaultValue: exp.bullets.join('\n'), type: 'textarea' }
                              ],
                              onSubmit: (values) => {
                                const newCompany = values.company?.trim();
                                const newRole = values.role?.trim();
                                const newBullets = values.bullets?.split('\n').map(b => b.trim()).filter(b => b !== '') || [];
                                setPortfolioData(prev => {
                                  const updated = [...prev.experience];
                                  if (originalIdx !== -1) {
                                    updated[originalIdx] = {
                                      ...updated[originalIdx],
                                      company: newCompany || exp.company,
                                      role: newRole || exp.role,
                                      bullets: newBullets.length > 0 ? newBullets : exp.bullets
                                    };
                                  }
                                  return { ...prev, experience: updated };
                                });
                              }
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">AI Generated Description</span>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-gray-400">
                          {exp.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 6: EDUCATION */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('education')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Education</h3>
              </div>
              {expandedSections.education ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.education && (
              <div className="p-5 space-y-4 animate-fadeIn">
                {portfolioData.education.map((edu, idx) => (
                  <div key={edu.institution} className="bg-black/20 border border-white/5 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">{edu.degree}</h4>
                        <span className="text-xs text-purple-400 font-semibold">{edu.institution} | {edu.duration}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setCustomPrompt({
                            isOpen: true,
                            title: "Edit Education Details",
                            fields: [
                              { key: 'degree', label: 'Degree / Major', defaultValue: edu.degree },
                              { key: 'institution', label: 'School / University', defaultValue: edu.institution },
                              { key: 'duration', label: 'Duration (e.g. 2020 - 2024)', defaultValue: edu.duration },
                              { key: 'highlights', label: 'Academic Highlights (One highlight per line)', defaultValue: edu.highlights.join('\n'), type: 'textarea' }
                            ],
                            onSubmit: (values) => {
                              const newDegree = values.degree?.trim() || edu.degree;
                              const newInstitution = values.institution?.trim() || edu.institution;
                              const newDuration = values.duration?.trim() || edu.duration;
                              const newHighlights = values.highlights?.split('\n').map(h => h.trim()).filter(h => h !== '') || [];
                              setPortfolioData(prev => {
                                const updated = [...prev.education];
                                updated[idx] = {
                                  ...updated[idx],
                                  degree: newDegree,
                                  institution: newInstitution,
                                  duration: newDuration,
                                  highlights: newHighlights
                                };
                                return { ...prev, education: updated };
                              });
                            }
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {edu.highlights.map(h => (
                      <p key={h} className="text-xs text-gray-400">{h}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 7: ACHIEVEMENTS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('achievements')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Achievements</h3>
              </div>
              {expandedSections.achievements ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.achievements && (
              <div className="p-5 space-y-4 animate-fadeIn">
                {portfolioData.achievements.map((ach, idx) => (
                  <div key={ach.title} className="bg-black/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                      {ach.description && <p className="text-[11px] text-gray-400 mt-1">{ach.description}</p>}
                    </div>
                    <button 
                      onClick={() => {
                        setCustomPrompt({
                          isOpen: true,
                          title: "Edit Achievement Details",
                          fields: [
                            { key: 'title', label: 'Achievement Title', defaultValue: ach.title },
                            { key: 'description', label: 'Description', defaultValue: ach.description || '', type: 'textarea' }
                          ],
                          onSubmit: (values) => {
                            const newTitle = values.title?.trim();
                            const newDesc = values.description?.trim();
                            if (newTitle) {
                              setPortfolioData(prev => {
                                const updated = [...prev.achievements];
                                updated[idx] = {
                                  ...updated[idx],
                                  title: newTitle,
                                  description: newDesc || undefined
                                };
                                return { ...prev, achievements: updated };
                              });
                            }
                          }
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-white shrink-0 ml-4"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 8: MISSING INFORMATION */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('missingInfo')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Missing Information Detector</h3>
              </div>
              {expandedSections.missingInfo ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.missingInfo && (
              <div className="p-5 space-y-3.5 animate-fadeIn">
                {suggestions.map(item => (
                  <div key={item.id} className="bg-black/20 border border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <p className="text-xs font-medium text-gray-300">{item.text}</p>
                    <button 
                      onClick={() => handleResolveSuggestion(item.id, item.type)}
                      disabled={item.done}
                      className={`px-4 py-2 text-[10px] font-bold rounded-xl flex items-center space-x-1.5 shrink-0 ${
                        item.done 
                          ? 'bg-green-950/20 text-green-400 border border-green-500/20' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {item.done ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>Add Profile Info</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 9: AI IMPROVEMENT SUGGESTIONS */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 p-6 rounded-2xl shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-purple-400">AI Quality Polish Engine</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-black/20 border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
                <p className="text-gray-300 font-medium">Auto-improve and polish all text content across the profile.</p>
                <button 
                  onClick={handleImproveAll} 
                  className="w-full py-2 bg-purple-650 hover:bg-purple-700 text-white text-[10px] font-bold rounded-xl flex items-center justify-center space-x-1 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Improve All Content</span>
                </button>
              </div>

              <div className="bg-black/20 border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
                <p className="text-gray-300 font-medium">Rephrase biography to make it more recruiter friendly.</p>
                <button 
                  onClick={handleRecruiterFriendly} 
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-bold rounded-xl transition"
                >
                  <span>Optimize About</span>
                </button>
              </div>



              <div className="bg-black/20 border border-white/5 p-3.5 rounded-2xl flex flex-col justify-between space-y-3">
                <p className="text-gray-300 font-medium">Re-organize detected projects sorted by technical complexity.</p>
                <button 
                  onClick={handleRankProjects} 
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[10px] font-bold rounded-xl transition"
                >
                  <span>Rank Projects By Complexity</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 12: GEN AI EXPLANATION */}
          <div className="glass-panel border-white/5 bg-[#121215]/60 rounded-2xl overflow-hidden shadow-md">
            <div 
              onClick={() => toggleSection('decisions')}
              className="p-4 bg-white/5 flex justify-between items-center cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Why did AI make these choices?</h3>
              </div>
              {expandedSections.decisions ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </div>

            {expandedSections.decisions && (
              <div className="p-5 space-y-3.5 animate-fadeIn text-xs text-gray-400 leading-relaxed">
                <div className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-0.5">✔</span>
                  <p>We identified <strong>React and Node.js</strong> as your strongest skills because they appeared consistently across your projects.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-0.5">✔</span>
                  <p>Your projects were ordered by technical complexity to highlight engineering depth.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-0.5">✔</span>
                  <p>Your internship at Tech Solutions is highlighted since recruiters value practical professional experience.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-purple-500 mt-0.5">✔</span>
                  <p>Your competitive programming achievements are shown in a separate block because they showcase analytical problem-solving skills.</p>
                </div>
              </div>
            )}
          </div>

        </div>



      </div>

      {/* FINAL ACTIONS ROW */}
      <footer className="w-full border-t border-white/5 bg-[#0a0a0f]/60 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <button 
          onClick={onCancel}
          className="w-full sm:w-auto px-5 py-3 border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition"
        >
          Back
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              if (confirm('Are you sure you want to reset all modifications to initial AI understanding?')) {
                setPortfolioData(initialData);
                setTempBio(initialData.basics.bio);
                setTempTitle(initialData.basics.professionalTitle);
                const initTagline = initialData.basics.tagline as any;
                setTempTaglineHeading(initTagline && typeof initTagline === 'object' ? initTagline.heading : initialData.basics.professionalTitle || '');
                setTempTaglineExplanation(initTagline && typeof initTagline === 'object' ? initTagline.explanation : typeof initTagline === 'string' ? initTagline : '');
              }
            }}
            className="w-full sm:w-auto px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-xs font-bold rounded-xl transition"
          >
            Regenerate Analysis
          </button>
          
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-8 py-3 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition"
          >
            <span>Next: Personalize</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </footer>

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
export default AIPortfolioReview;
