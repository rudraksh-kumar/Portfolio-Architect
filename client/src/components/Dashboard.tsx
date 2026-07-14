import React, { useState, useEffect } from 'react';
import { Layout, LineChart, MessageSquare, Globe, Edit2, Save, LogOut, CheckCircle, RefreshCw, Upload, Sparkles, Palette, Menu, Copy, ExternalLink, Check } from 'lucide-react';
import type { PortfolioData } from '../types.js';
import { AIGenerationProgress } from './AIGenerationProgress.js';
import { AIPortfolioReview } from './AIPortfolioReview.js';
import { AIPortfolioPersonalize } from './AIPortfolioPersonalize.js';
import { AIContentEnhancement } from './AIContentEnhancement.js';
import { AIChatPortfolioEditor } from './AIChatPortfolioEditor.js';
import { calculatePortfolioMetrics } from '../utils/scoring.js';

interface DashboardProps {
  token: string;
  onLogout: () => void;
  onViewPortfolio: (slug: string) => void;
}

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

export const Dashboard: React.FC<DashboardProps> = ({ token, onLogout, onViewPortfolio }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'editor' | 'settings' | 'rebuild'>('analytics');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Setup / No-Portfolio States
  const [hasPortfolio, setHasPortfolio] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinText, setLinkedinText] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [generationPromise, setGenerationPromise] = useState<Promise<{ slug: string; portfolio: any }> | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewSlug, setReviewSlug] = useState('');
  const [designWorkflowStep, setDesignWorkflowStep] = useState<'review' | 'enhance' | 'personalize' | null>(null);
  const [workflowSource, setWorkflowSource] = useState<'onboarding' | 'settings' | null>(null);

  // Shared Scoring States
  const [readinessScore, setReadinessScore] = useState(92);
  const [categoriesScore, setCategoriesScore] = useState({
    content: 96,
    projects: 94,
    design: 91,
    recruiter: 90,
    seo: 84,
    visual: 89
  });
  const [resumeScore, setResumeScore] = useState(78);
  const [enhancementBreakdown, setEnhancementBreakdown] = useState({
    writing: 74,
    techDepth: 82,
    recruiterAppeal: 76,
    readiness: 80,
    ats: 70,
    storytelling: 88
  });

  useEffect(() => {
    if (reviewData) {
      const metrics = calculatePortfolioMetrics(reviewData);
      setReadinessScore(metrics.score);
      setCategoriesScore(metrics.reviewBreakdown);
      setResumeScore(metrics.score);
      setEnhancementBreakdown(metrics.enhancementBreakdown);
    }
  }, [reviewData]);

  // Dashboard Data
  const [slug, setSlug] = useState('');
  const [theme, setTheme] = useState('dark-glass');
  const [analytics, setAnalytics] = useState<{
    views: number;
    chatVolume: number;
    topInteractingOrgs: { name: string; count: number }[];
    recentLogs: { id: string; query: string; response: string; inferredOrg: string | null; createdAt: string }[];
  } | null>(null);

  // Edit Mode state
  const [editedJson, setEditedJson] = useState('');
  const [isChatEditorOpen, setIsChatEditorOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch current profile data
      const profileRes = await fetch('/api/portfolio/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileJson = await profileRes.json();

      if (!profileRes.ok) {
        if (profileRes.status === 404) {
          setHasPortfolio(false);
          setLoading(false);
          return;
        }
        throw new Error(profileJson.error || 'Failed to load portfolio details.');
      }

      setHasPortfolio(true);
      setSlug(profileJson.slug);
      setTheme(profileJson.theme);
      setEditedJson(JSON.stringify(profileJson.profileData, null, 2));

      // 2. Fetch analytics telemetry
      const analyticsRes = await fetch('/api/portfolio/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const analyticsJson = await analyticsRes.json();

      if (analyticsRes.ok) {
        setAnalytics(analyticsJson);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePortfolio = () => {
    if (!resumeFile) {
      alert('Please upload your resume PDF to continue.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (githubUrl) formData.append('githubUrl', githubUrl);
    if (linkedinText) formData.append('linkedinText', linkedinText);

    const promise = (async () => {
      const response = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate portfolio. Please try again.');
      }

      return { slug: data.slug as string, portfolio: data.portfolio };
    })();

    setGenerationPromise(promise);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      let parsedProfile: PortfolioData;
      try {
        parsedProfile = JSON.parse(editedJson);
      } catch (e) {
        throw new Error('Invalid JSON format. Please check for syntax errors or missing commas.');
      }

      const response = await fetch('/api/portfolio/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug,
          theme,
          profileData: parsedProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration settings.');
      }

      setSlug(data.slug);
      setTheme(data.theme);
      setSuccessMsg('Portfolio configuration updated successfully!');
      
      // Auto-clear success message
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 text-purple-500 animate-spin" />
          <p className="text-gray-400 font-medium">Syncing telemetry data...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-gray-900 bg-background-dark/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Layout className="h-6 w-6 text-purple-500" />
          <span className="font-bold text-lg tracking-tight font-heading">Personal Branding OS</span>
        </div>
        <div className="flex items-center space-x-4">
          {slug && hasPortfolio && (
            <button
              onClick={() => onViewPortfolio(slug)}
              className="px-4 py-2 border border-purple-500/30 hover:border-purple-500/50 bg-purple-950/20 text-purple-400 hover:text-purple-300 rounded-xl text-sm font-semibold flex items-center space-x-2 transition"
            >
              <Globe className="h-4 w-4" />
              <span>View Live Portfolio</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="p-2 border border-gray-900 hover:bg-gray-900 rounded-xl text-gray-400 hover:text-white transition"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {!hasPortfolio ? (
        <div className="max-w-xl w-full mx-auto px-6 py-12 flex-grow flex items-center justify-center">
          <div className="w-full glass-panel p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Personal Branding Engine</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gradient font-heading">
              Set Up Your AI Portfolio
            </h2>

            <p className="text-gray-400 text-sm leading-relaxed">
              You haven't generated a portfolio yet. Provide your resume and links so our AI can analyze your experience and design your recruiter-ready Bento site.
            </p>

            {/* Resume Upload Box */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Resume PDF (Required)</label>
              <div className="relative border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 bg-gray-900/30 transition flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.type !== 'application/pdf') {
                        alert('Please upload a PDF file.');
                        return;
                      }
                      setResumeFile(file);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-gray-500 mb-3" />
                <span className="text-gray-300 font-semibold text-sm">
                  {resumeFile ? resumeFile.name : 'Upload your resume PDF'}
                </span>
                <span className="text-gray-500 text-xs mt-1">PDF file up to 5MB</span>
              </div>
            </div>

            {/* LinkedIn Bio */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <span>LinkedIn Bio / Experience Text (Optional)</span>
              </label>
              <textarea
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="Paste summary, achievements or bio from your LinkedIn profile..."
                className="w-full h-24 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm resize-none"
              />
            </div>

            {/* GitHub URL */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">
                <span>GitHub Profile URL (Optional)</span>
              </label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-username"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
              />
            </div>

            <button
              onClick={handleGeneratePortfolio}
              className="w-full py-3.5 bg-purple-650 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition duration-200 transform hover:scale-[1.01]"
            >
              Generate Portfolio
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl w-full mx-auto px-6 py-10 flex-grow flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs / Dropdown */}
          <>
            {/* Mobile Dropdown Tab Selector */}
            <div className="w-fit md:hidden relative z-40 mb-3 mx-auto">
              <button
                onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                className="w-fit px-6 py-2.5 bg-purple-950/20 border border-purple-500/30 hover:border-purple-500/50 rounded-full flex items-center justify-center gap-2.5 text-xs font-bold text-purple-400 uppercase transition tracking-widest cursor-pointer shadow-lg shadow-purple-950/20"
              >
                <Menu className="h-4 w-4 text-purple-400" />
                <span>MENU</span>
              </button>

                  {isTabDropdownOpen && (
                    <div className="absolute top-[105%] left-1/2 -translate-x-1/2 w-max min-w-[220px] bg-gray-950 border border-gray-850 rounded-xl shadow-2xl overflow-hidden p-1 space-y-1">
                      <button
                        onClick={() => {
                          setActiveTab('analytics');
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center space-x-3 transition ${activeTab === 'analytics' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/10' : 'text-gray-400 hover:bg-gray-900'}`}
                      >
                        <LineChart className="h-3.5 w-3.5" />
                        <span>Recruiter Telemetry</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('editor');
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center space-x-3 transition ${activeTab === 'editor' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/10' : 'text-gray-400 hover:bg-gray-900'}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Profile Content Editor</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsChatEditorOpen(true);
                          setIsTabDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center space-x-3 transition text-purple-400 hover:bg-gray-900 bg-purple-950/5 border border-purple-500/10"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span>AI Chat Editor (Live)</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center space-x-3 transition ${activeTab === 'settings' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/10' : 'text-gray-400 hover:bg-gray-900'}`}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>URL & Theme Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('rebuild');
                          setIsTabDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg text-left text-xs font-semibold flex items-center space-x-3 transition ${activeTab === 'rebuild' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/10' : 'text-gray-400 hover:bg-gray-900'}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Rebuild with AI</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop Sidebar Tabs */}
                <aside className="hidden md:flex md:w-64 flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 transition w-full whitespace-nowrap ${
                      activeTab === 'analytics'
                        ? 'bg-purple-650 text-white shadow-lg shadow-purple-900/20'
                        : 'hover:bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    <LineChart className="h-4 w-4" />
                    <span>Recruiter Telemetry</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 transition w-full whitespace-nowrap ${
                      activeTab === 'editor'
                        ? 'bg-purple-650 text-white shadow-lg shadow-purple-900/20'
                        : 'hover:bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Profile Content Editor</span>
                  </button>
                  <button
                    onClick={() => setIsChatEditorOpen(true)}
                    className="px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 transition w-full whitespace-nowrap hover:bg-gray-900 text-purple-400 hover:text-purple-300 border border-purple-500/20 bg-purple-950/10"
                  >
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>AI Chat Editor (Live)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 transition w-full whitespace-nowrap ${
                      activeTab === 'settings'
                        ? 'bg-purple-650 text-white shadow-lg shadow-purple-900/20'
                        : 'hover:bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    <span>URL & Theme Settings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('rebuild')}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-3 transition w-full whitespace-nowrap ${
                      activeTab === 'rebuild'
                        ? 'bg-purple-650 text-white shadow-lg shadow-purple-900/20'
                        : 'hover:bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Rebuild with AI</span>
                  </button>
                </aside>
              </>

          {/* Main Panel Content */}
          <main className="flex-grow min-w-0">
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 text-green-400 text-sm rounded-xl flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Analytics View */}
            {activeTab === 'analytics' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Quick Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
                    <div className="p-3 bg-purple-900/30 text-purple-400 rounded-xl">
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Portfolio Visits</p>
                      <p className="text-3xl font-bold mt-1">{analytics?.views || 0}</p>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
                    <div className="p-3 bg-violet-900/30 text-violet-400 rounded-xl">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Copilot Interactions</p>
                      <p className="text-3xl font-bold mt-1">{analytics?.chatVolume || 0}</p>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="p-3 bg-green-900/30 text-green-400 rounded-xl">
                      <Layout className="h-6 w-6" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Active Brand URL</p>
                      {slug ? (
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <a
                            href={`${window.location.origin}/p/${slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold truncate text-purple-400 hover:underline flex items-center gap-1.5 min-w-0"
                          >
                            /p/{slug}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition shrink-0"
                            title="Copy Link to Clipboard"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-500 mt-2">unset</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inferred recruiter companies breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Companies list */}
                  <div className="glass-panel p-6 rounded-2xl lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold font-heading">Top Interacting Teams</h3>
                    <p className="text-gray-400 text-xs">Identified based on search query intent logs.</p>
                    <div className="space-y-3 pt-2">
                      {analytics?.topInteractingOrgs && analytics.topInteractingOrgs.length > 0 ? (
                        analytics.topInteractingOrgs.map((org, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-900/40 px-4 py-2.5 rounded-xl border border-gray-900">
                            <span className="font-semibold text-sm">{org.name}</span>
                            <span className="text-xs bg-purple-900/40 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold">
                              {org.count} search{org.count > 1 ? 'es' : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">No company signals inferred yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Recruiter Activity Logs */}
                  <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold font-heading">Recruiter Copilot Telemetry</h3>
                    <p className="text-gray-400 text-xs">Real-time log of recruiter prompts and corresponding Copilot replies.</p>
                    
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 pt-2">
                      {analytics?.recentLogs && analytics.recentLogs.length > 0 ? (
                        analytics.recentLogs.map((log) => (
                          <div key={log.id} className="p-4 bg-gray-900/40 border border-gray-900 rounded-xl space-y-2 text-sm leading-relaxed">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span className="font-semibold text-purple-400">
                                {log.inferredOrg ? `Recruiter @ ${log.inferredOrg}` : 'Anonymous Visitor'}
                              </span>
                              <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white font-medium">Q: "{log.query}"</p>
                            <p className="text-gray-400 italic">A: "{log.response}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic text-center py-8">Copilot conversations list is empty.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Schema Editor */}
            {activeTab === 'editor' && (
              <div className="glass-panel p-8 rounded-2xl space-y-4 flex flex-col h-[600px] animate-fadeIn">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gradient font-heading">Profile Content Schema Editor</h3>
                    <p className="text-gray-400 text-xs">Modify the raw generated portfolio JSON keys directly to correct typos or restructure sections.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        try {
                          const currentData = JSON.parse(editedJson);
                          setReviewData(currentData);
                          setReviewSlug(slug);
                          setDesignWorkflowStep('review');
                          setWorkflowSource('onboarding');
                        } catch (e) {
                          alert('Please fix any JSON syntax errors in the editor before opening the Visual Editor.');
                        }
                      }}
                      className="px-5 py-2.5 border border-gray-800 hover:border-gray-700 bg-gray-900/50 text-gray-300 hover:text-white font-semibold rounded-xl text-sm flex items-center space-x-2 transition"
                    >
                      <span>Visual AI Editor</span>
                    </button>
                    <button
                      onClick={() => {
                        try {
                          JSON.parse(editedJson);
                          setIsChatEditorOpen(true);
                        } catch (e) {
                          alert('Please fix any JSON errors in the editor before opening the AI Chat Editor.');
                        }
                      }}
                      className="px-5 py-2.5 border border-purple-500/30 hover:border-purple-500/50 bg-purple-950/20 text-purple-400 hover:text-purple-300 font-semibold rounded-xl text-sm flex items-center space-x-2 transition"
                    >
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>AI Chat Editor</span>
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="px-6 py-2.5 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center space-x-2 transition"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={editedJson}
                  onChange={(e) => setEditedJson(e.target.value)}
                  className="w-full flex-grow p-4 bg-gray-900/60 border border-gray-800 rounded-2xl text-green-400 font-mono text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* settings tab */}
            {activeTab === 'settings' && (
              <div className="glass-panel p-8 rounded-2xl space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gradient">URL & Appearance Configuration</h3>

                <div className="space-y-4">
                  {/* slug edit */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Public Portfolio URL Path</label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50">
                      <span className="bg-gray-900 border-r border-gray-850 px-4 py-3 text-gray-500 text-sm font-mono flex items-center select-none">
                        /p/
                      </span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="flex-grow px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm font-mono"
                      />
                    </div>
                    <span className="text-xs text-gray-500 block">Only alphanumeric characters and hyphens allowed.</span>
                    {slug && (
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                        <span>Live link preview:</span>
                        <a
                          href={`${window.location.origin}/p/${slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:underline font-mono flex items-center gap-1"
                        >
                          {window.location.origin}/p/{slug}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* theme selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-300">Portfolio Design Theme</label>
                    <select
                      value={theme}
                      onChange={(e) => {
                        const newTheme = e.target.value;
                        setTheme(newTheme);
                        try {
                          const parsed = JSON.parse(editedJson);
                          parsed.themeName = mapThemeValueToName(newTheme);
                          setEditedJson(JSON.stringify(parsed, null, 2));
                        } catch (err) {
                          // ignore parser errors
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                    >
                      <option value="dark-glass">Developer Pro (Dark Glassmorphism)</option>
                      <option value="minimal">Minimal Modern</option>
                      <option value="glass">Glassmorphism</option>
                      <option value="startup">Startup Founder</option>
                      <option value="creative">Creative Designer</option>
                      <option value="research">Research Portfolio</option>
                      <option value="corp">Corporate Professional</option>
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="apple">Apple Inspired</option>
                      <option value="notion">Notion Style</option>
                      <option value="terminal">Terminal Portfolio</option>
                      <option value="light-clean">Minimalist Light Theme (Legacy)</option>
                    </select>
                  </div>

                  {/* design personalize customizer */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-sm font-semibold text-gray-300">AI Design Personalization Engine</label>
                    <button
                      onClick={() => {
                        try {
                          const currentData = JSON.parse(editedJson);
                          currentData.themeName = mapThemeValueToName(theme);
                          setReviewData(currentData);
                          setReviewSlug(slug);
                          setDesignWorkflowStep('personalize');
                          setWorkflowSource('settings');
                        } catch (e) {
                          alert('Please fix any JSON errors in your profile content editor first.');
                        }
                      }}
                      className="w-full py-3.5 border border-purple-500/35 hover:border-purple-500/55 bg-purple-950/20 text-purple-400 hover:text-purple-300 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition"
                    >
                      <Palette className="h-4.5 w-4.5" />
                      <span>Open AI Design Customizer</span>
                    </button>
                  </div>

                </div>

                <div className="pt-4 border-t border-gray-900 flex justify-end">
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-6 py-3 bg-purple-650 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center space-x-2 transition"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rebuild with AI tab */}
            {activeTab === 'rebuild' && (
              <div className="glass-panel p-8 rounded-2xl space-y-6 animate-fadeIn max-w-xl mx-auto">
                <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>Rebuild Portfolio Engine</span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-gradient font-heading">
                  Rebuild Your Portfolio with AI
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  Want to completely rebuild or update your portfolio with a new resume? Upload your updated resume PDF and optional details below. Our AI will analyze your new credentials and generate a fresh design.
                </p>

                {/* Resume Upload Box */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">New Resume PDF (Required)</label>
                  <div className="relative border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 bg-gray-900/30 transition flex flex-col items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          if (file.type !== 'application/pdf') {
                            alert('Please upload a PDF file.');
                            return;
                          }
                          setResumeFile(file);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-8 w-8 text-gray-500 mb-3" />
                    <span className="text-gray-300 font-semibold text-sm">
                      {resumeFile ? resumeFile.name : 'Upload new resume PDF'}
                    </span>
                    <span className="text-gray-500 text-xs mt-1">PDF file up to 5MB</span>
                  </div>
                </div>

                {/* LinkedIn Bio */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                    <span>New LinkedIn Bio / Experience Text (Optional)</span>
                  </label>
                  <textarea
                    value={linkedinText}
                    onChange={(e) => setLinkedinText(e.target.value)}
                    placeholder="Paste summary, achievements or bio from your LinkedIn profile..."
                    className="w-full h-24 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm resize-none"
                  />
                </div>

                {/* GitHub URL */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300">
                    <span>GitHub Profile URL (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/your-username"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setResumeFile(null);
                      setLinkedinText('');
                      setGithubUrl('');
                    }}
                    className="px-5 py-2.5 border border-gray-850 hover:border-gray-800 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition"
                  >
                    Clear Form
                  </button>
                  <button
                    onClick={handleGeneratePortfolio}
                    className="px-6 py-2.5 bg-purple-650 hover:bg-purple-700 text-white font-semibold rounded-xl text-sm flex items-center space-x-2 transition shadow-md shadow-purple-950/20"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate & Review</span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {generationPromise && (
        <AIGenerationProgress
          apiPromise={generationPromise}
          onComplete={(slug, portfolio) => {
            setGenerationPromise(null);
            setReviewData(portfolio);
            setReviewSlug(slug);
            setDesignWorkflowStep('review');
            setWorkflowSource('onboarding');
          }}
          onCancel={() => {
            setGenerationPromise(null);
          }}
        />
      )}

      {reviewData && designWorkflowStep === 'review' && (
        <AIPortfolioReview
          initialData={reviewData}
          slug={reviewSlug}
          token={token}
          readinessScore={readinessScore}
          setReadinessScore={setReadinessScore}
          categoriesScore={categoriesScore}
          setCategoriesScore={setCategoriesScore}
          onNext={(data) => {
            setReviewData(data);
            setDesignWorkflowStep('enhance');
          }}
          onCancel={() => {
            setReviewData(null);
            setDesignWorkflowStep(null);
          }}
        />
      )}

      {reviewData && designWorkflowStep === 'enhance' && (
        <AIContentEnhancement
          initialData={reviewData}
          slug={reviewSlug}
          token={token}
          score={resumeScore}
          setScore={setResumeScore}
          breakdown={enhancementBreakdown}
          setBreakdown={setEnhancementBreakdown}
          onNext={(data) => {
            setReviewData(data);
            setDesignWorkflowStep('personalize');
          }}
          onCancel={() => {
            if (workflowSource === 'settings') {
              setReviewData(null);
              setDesignWorkflowStep(null);
            } else {
              setDesignWorkflowStep('review');
            }
          }}
        />
      )}

      {reviewData && designWorkflowStep === 'personalize' && (
        <AIPortfolioPersonalize
          initialData={reviewData}
          slug={reviewSlug}
          token={token}
          isDashboardEdit={true}
          onPublish={() => {
            setReviewData(null);
            setDesignWorkflowStep(null);
            setActiveTab('analytics');
            fetchDashboardData();
          }}
          onCancel={() => {
            if (workflowSource === 'settings') {
              setReviewData(null);
              setDesignWorkflowStep(null);
            } else {
              setDesignWorkflowStep('enhance');
            }
          }}
        />
      )}
      {isChatEditorOpen && (
        <AIChatPortfolioEditor
          initialData={(() => {
            try {
              return JSON.parse(editedJson);
            } catch (e) {
              // fallback if JSON has parsing errors
              return {};
            }
          })()}
          slug={slug}
          token={token}
          onSave={async (newData) => {
            try {
              const response = await fetch('/api/portfolio/me', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  slug,
                  theme: (newData as any).theme || theme,
                  profileData: newData,
                }),
              });

              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || 'Failed to save configuration settings.');
              }

              setSlug(data.slug);
              setTheme(data.theme);
              setEditedJson(JSON.stringify(newData, null, 2));
            } catch (err: any) {
              alert(err.message || 'Failed to save changes.');
              throw err;
            }
          }}
          onClose={() => {
            setIsChatEditorOpen(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};
