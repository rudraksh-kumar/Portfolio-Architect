import React, { useState, useEffect } from 'react';
import { Upload, Sparkles, ArrowRight } from 'lucide-react';
import { Auth } from './Auth.js';
import { AIGenerationProgress } from './AIGenerationProgress.js';
import { AIPortfolioReview } from './AIPortfolioReview.js';
import { AIPortfolioPersonalize } from './AIPortfolioPersonalize.js';
import { AIContentEnhancement } from './AIContentEnhancement.js';
import { calculatePortfolioMetrics } from '../utils/scoring.js';

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


interface LandingProps {
  token: string | null;
  onAuthSuccess: (token: string, shouldRedirect: boolean) => void;
  onGenerationComplete: (slug: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ token, onAuthSuccess, onGenerationComplete }) => {
  const [step, setStep] = useState<'hero' | 'upload' | 'auth' | 'processing' | 'review' | 'enhancement' | 'personalize'>('hero');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  
  // Processing state logs
  const [generationPromise, setGenerationPromise] = useState<Promise<{ slug: string; portfolio: any }> | null>(null);
  const [generationError, setGenerationError] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewSlug, setReviewSlug] = useState('');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleNextFromUpload = () => {
    if (!resumeFile) {
      alert('Please upload your resume PDF to continue.');
      return;
    }
    // If user is already logged in, skip auth step and go to processing
    if (token) {
      triggerGeneration(token);
    } else {
      setStep('auth');
    }
  };

  const handleAuthSuccess = (newToken: string) => {
    if (resumeFile) {
      onAuthSuccess(newToken, false);
      triggerGeneration(newToken);
    } else {
      onAuthSuccess(newToken, true);
    }
  };

  const triggerGeneration = (authToken: string) => {
    setStep('processing');
    setGenerationError('');

    const formData = new FormData();
    if (resumeFile) formData.append('resume', resumeFile);
    if (githubUrl) formData.append('githubUrl', githubUrl);
    if (linkedinText) formData.append('linkedinText', linkedinText);

    const promise = (async () => {
      const response = await fetch('/api/portfolio/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
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

  return (
    <div className="min-h-screen bg-background-dark text-white relative overflow-hidden flex flex-col justify-between">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-purple-900/10 via-violet-900/5 to-transparent filter blur-3xl -z-10"></div>

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex justify-between items-center border-b border-gray-900/50">
        <div className="flex items-center space-x-2">
          <div className="bg-purple-600 p-2 rounded-xl">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-heading">AI Portfolio Architect</span>
        </div>
        {token ? (
          <button 
            onClick={() => onGenerationComplete('dashboard')} 
            className="px-4 py-2 border border-gray-880 hover:border-gray-700 bg-gray-900/50 rounded-xl text-sm font-semibold transition"
          >
            Go to Dashboard
          </button>
        ) : (
          <button 
            onClick={() => setStep('auth')} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-purple-900/20"
          >
            Sign In
          </button>
        )}
      </header>

      {/* Content Wrapper */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-grow flex items-center justify-center">
        {step === 'hero' && (
          <div className="text-center space-y-8 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-purple-950/40 border border-purple-800/30 rounded-full text-purple-400 text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>Next-Gen Personal Branding Engine</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight font-heading">
              Transform Your Resume Into a <span className="text-gradient">Professional Brand</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl font-normal leading-relaxed">
              Upload your resume and links. Our AI reads your code, refines your achievements, and bakes a custom bento portfolio website equipped with a recruiter copilot.
            </p>
 
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => setStep('upload')}
                className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl shadow-xl shadow-purple-900/20 flex items-center justify-center space-x-2 transition duration-200 transform hover:scale-[1.01]"
              >
                <span>Build Your Portfolio in Minutes</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="w-full max-w-xl glass-panel p-8 rounded-2xl shadow-2xl space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-gradient font-heading">Set Up Your Professional Identity</h2>
            <p className="text-gray-400 text-sm">Provide your resume and links so our AI can understand and shape your career story.</p>

            {generationError && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {generationError}
              </div>
            )}

            {/* Resume Upload Drag/Drop Box */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300">Resume PDF (Required)</label>
              <div className="relative border-2 border-dashed border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 bg-gray-900/30 transition flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-gray-500 mb-3" />
                <span className="text-gray-300 font-semibold text-sm">
                  {resumeFile ? resumeFile.name : 'Upload your resume PDF'}
                </span>
                <span className="text-gray-500 text-xs mt-1">PDF file up to 5MB</span>
              </div>
            </div>

            {/* LinkedIn Info Paste Box */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Linkedin className="h-4 w-4 text-purple-400" />
                <span>LinkedIn Bio / Experience Text (Optional)</span>
              </label>
              <textarea
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
                placeholder="Paste summary, achievements or bio from your LinkedIn profile..."
                className="w-full h-24 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm resize-none"
              />
            </div>

            {/* GitHub URL Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Github className="h-4 w-4 text-gray-400" />
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
                onClick={() => setStep('hero')}
                className="px-6 py-3 border border-gray-850 hover:border-gray-800 text-gray-400 hover:text-white rounded-xl text-sm font-semibold transition"
              >
                Back
              </button>
              <button
                onClick={handleNextFromUpload}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-900/20 transition"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'auth' && (
          <div className="w-full max-w-xl">
            <Auth onSuccess={handleAuthSuccess} initialMode="signup" />
          </div>
        )}

        {step === 'processing' && generationPromise && (
          <AIGenerationProgress
            apiPromise={generationPromise}
            onComplete={(slug, portfolio) => {
              setGenerationPromise(null);
              setReviewData(portfolio);
              setReviewSlug(slug);
              setStep('review');
            }}
            onCancel={() => {
              setGenerationPromise(null);
              setStep('upload');
            }}
          />
        )}

        {step === 'review' && reviewData && token && (
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
              setStep('enhancement');
            }}
            onCancel={() => {
              setReviewData(null);
              setStep('upload');
            }}
          />
        )}

        {step === 'enhancement' && reviewData && token && (
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
              setStep('personalize');
            }}
            onCancel={() => setStep('review')}
          />
        )}

        {step === 'personalize' && reviewData && token && (
          <AIPortfolioPersonalize
            initialData={reviewData}
            slug={reviewSlug}
            token={token}
            onPublish={() => onGenerationComplete(reviewSlug)}
            onCancel={() => setStep('enhancement')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-gray-900/50 text-center text-gray-500 text-xs">
        <p>© 2026 Rudraksh Kumar - All rights reserved.</p>
      </footer>
    </div>
  );
};
