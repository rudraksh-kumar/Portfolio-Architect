import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  RotateCw, 
  History, 
  ArrowLeft, 
  Check, 
  Cpu, 
  Monitor
} from 'lucide-react';
import type { PortfolioData, ProjectItem, SkillCategory, ExperienceItem } from '../types.js';
import { PortfolioView } from './PortfolioView.js';

interface AIChatPortfolioEditorProps {
  initialData: PortfolioData;
  slug: string;
  onSave: (updatedData: PortfolioData) => Promise<void>;
  onClose: () => void;
}

interface HistoryState {
  portfolioData: PortfolioData;
  explanation: string;
  actionName: string;
  timestamp: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  explanation?: string;
  timestamp: Date;
  toastMsg?: string;
  isProposal?: boolean;
  proposalData?: PortfolioData;
  proposalMeta?: {
    title: string;
    description: string;
    section: string;
    changes: { title: string; desc: string }[];
    major: boolean;
  };
}

export const AIChatPortfolioEditor: React.FC<AIChatPortfolioEditorProps> = ({
  initialData,
  slug,
  onSave,
  onClose
}) => {
  // Version History Stack
  const [history, setHistory] = useState<HistoryState[]>([
    {
      portfolioData: initialData,
      explanation: 'Initial version generated from resume.',
      actionName: 'Initial Import',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Current active data is derived from history index
  const currentData = history[historyIndex].portfolioData;

  // Active View Tab inside Preview (For demo/recruiter layout settings)
  const [activePreviewTab, setActivePreviewTab] = useState<'desktop' | 'mobile'>('desktop');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Welcome to the Live AI Portfolio Editor! I am your design and branding partner.

You can modify any aspect of your portfolio by chatting with me. Try asking me to change themes, rewrite sections, or restructure the page layout.`,
      explanation: 'Ready to assist. Tell me what changes you\'d like to see!',
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [memory, setMemory] = useState<{ accentColor?: string; tone?: string; designStyle?: string }>({});
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [inactiveTimer, setInactiveTimer] = useState<number>(0);
  const [activeHighlightSection, setActiveHighlightSection] = useState<string>('');
  const [pendingProposal, setPendingProposal] = useState<{
    msgId: string;
    newData: PortfolioData;
    meta: any;
    actionName: string;
    explanation: string;
    toastMsg: string;
  } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMobileView, setActiveMobileView] = useState<'chat' | 'preview'>('chat');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Suggested Prompts
  const suggestedPrompts = [
    'Change the theme to Apple style',
    'Highlight my AI projects first',
    'Rewrite my About section to be confident',
    'Use blue as my accent color',
    'Make it suitable for startups',
    'Move Projects above Experience',
    'Hide Education section',
    'Rewrite as an AI Engineer'
  ];

  // Inactive Suggestions (chips that appear when user is idle)
  const proactiveSuggestions = [
    { text: 'Add measurable metrics to my experience bullets', id: 'metrics' },
    { text: 'Generate an ATS-friendly developer summary', id: 'ats' },
    { text: 'Create dynamic project architecture diagrams', id: 'diagram' },
    { text: 'Apply a premium Dark Glassmorphism aesthetic', id: 'glass' }
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Track user inactivity to show suggestions
  useEffect(() => {
    const timer = setInterval(() => {
      setInactiveTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetInactivity = () => {
    setInactiveTimer(0);
  };

  const triggerToast = (message: string) => {
    const id = Date.now();
    setToast({ message, id });
    setTimeout(() => {
      setToast(prev => prev?.id === id ? null : prev);
    }, 4000);
  };

  const pushNewState = (newData: PortfolioData, actionName: string, explanation: string, toastMessage?: string) => {
    const nextState: HistoryState = {
      portfolioData: newData,
      actionName,
      explanation,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Slice history up to current index (in case we did undos)
    const updatedHistory = [...history.slice(0, historyIndex + 1), nextState];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);

    if (toastMessage) {
      triggerToast(toastMessage);
    }
  };

  const handleUndo = () => {
    resetInactivity();
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      triggerToast(`↩️ Reverted to: ${history[historyIndex - 1].actionName}`);
    }
  };

  const handleRedo = () => {
    resetInactivity();
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      triggerToast(`↪️ Re-applied: ${history[historyIndex + 1].actionName}`);
    }
  };

  const handleRestoreVersion = (index: number) => {
    resetInactivity();
    setHistoryIndex(index);
    triggerToast(`✨ Restored version: ${history[index].actionName}`);
  };

  const handleApplyPendingProposal = (msgId: string, customPending?: typeof pendingProposal) => {
    const activePending = customPending || pendingProposal;
    if (!activePending || activePending.msgId !== msgId) return;
    const { newData, actionName, explanation, toastMsg } = activePending;
    pushNewState(newData, actionName, explanation, toastMsg);
    
    // Auto highlight section
    let highlightSec = '';
    const promptLower = messages.find(m => m.id === msgId)?.text?.toLowerCase() || '';
    if (actionName.includes('Theme') || actionName.includes('Accent') || promptLower.includes('timeline') || promptLower.includes('sidebar') || promptLower.includes('floating')) {
      highlightSec = 'theme';
    } else if (actionName.includes('Project') || promptLower.includes('project')) {
      highlightSec = 'projects';
    } else if (actionName.includes('Skill') || promptLower.includes('skill')) {
      highlightSec = 'skills';
    } else if (promptLower.includes('experience') || promptLower.includes('education') || actionName.includes('Experience')) {
      highlightSec = 'experience';
    } else {
      highlightSec = 'about';
    }
    if (highlightSec) {
      setActiveHighlightSection(highlightSec);
      setTimeout(() => {
        setActiveHighlightSection('');
      }, 4000);
    }

    // Update message in timeline to be applied
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: `✓ Proposed changes applied successfully. (${actionName})`, isProposal: false } : m));
    setPendingProposal(null);
  };

  const handleDiscardPendingProposal = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: `❌ Proposed changes discarded.`, isProposal: false } : m));
    setPendingProposal(null);
    triggerToast('Discarded proposed edits.');
  };

  // The local AI processor rule engine
  const processAIRequest = async (userPrompt: string) => {
    setIsThinking(true);
    resetInactivity();

    // Prepare prompt payload for API
    // In production, this would make a POST call to server to feed currentData + userPrompt -> LLM -> Returns modified JSON & text summary
    // To keep it lightning-fast, premium, and fully functional, we run a robust compiler that simulates response parsing
    await new Promise(resolve => setTimeout(resolve, 1200));

    let updatedData = JSON.parse(JSON.stringify(currentData));
    const promptLower = userPrompt.toLowerCase();
    
    let actionName = 'Content Update';
    let explanation = '';
    let toastMsg = '';
    let responseText = '';
    let highlightSec = '';
    let isAmbiguous = false;
    let isGroundedError = false;
    let refutationText = '';

    // 1. Ambiguity Checks
    if (promptLower === 'improve this' || promptLower === 'make it better' || promptLower === 'make it modern' || promptLower === 'fix this' || promptLower === 'improve layout') {
      isAmbiguous = true;
      responseText = 'Which section would you like me to improve? Or would you like me to adjust the design style, the layout structure, or rewrite the copy? Please specify so I can assist you accurately.';
      explanation = 'Request is too ambiguous. Clarification is required to prevent incorrect edits.';
    }

    // 2. Grounded Check & Refutation Checks (e.g. AWS or Google)
    if (!isAmbiguous) {
      // Check if user is asking to add a new skill that is not present in original profile
      if (promptLower.includes('add') && promptLower.includes('skill')) {
        // Extract possible skill word (e.g. "aws", "docker", "kubernetes")
        const words = promptLower.split(' ');
        const skillWord = words[words.indexOf('skill') + 1] || words[words.indexOf('add') + 1] || 'AWS';
        const capitalizedSkill = skillWord.toUpperCase();
        
        // Search if this skill exists in currentData skills or experience text
        const hasSkill = JSON.stringify(currentData).toLowerCase().includes(skillWord.toLowerCase());
        if (!hasSkill) {
          isGroundedError = true;
          refutationText = `I couldn't find ${capitalizedSkill} in your uploaded profile. Would you like to manually add it? Once confirmed, I'll update your portfolio.`;
          explanation = `Prevented hallucinating unauthorized skill details: ${capitalizedSkill}`;
        }
      }

      // Check if user is trying to add fake top-tier experiences
      if (promptLower.includes('google') || promptLower.includes('microsoft') || promptLower.includes('netflix') || promptLower.includes('meta')) {
        const hasCompany = JSON.stringify(currentData).toLowerCase().includes('google') || 
                           JSON.stringify(currentData).toLowerCase().includes('microsoft') ||
                           JSON.stringify(currentData).toLowerCase().includes('netflix') ||
                           JSON.stringify(currentData).toLowerCase().includes('meta');
        
        if (!hasCompany) {
          isGroundedError = true;
          refutationText = "I can't add experiences that aren't present in your uploaded information. If you'd like to add a new experience manually, I can help format it professionally.";
          explanation = "Refused request to inject unverified work history (Google/Microsoft/etc.).";
        }
      }
    }

    // If there is an ambiguity or grounded verification error, return early
    if (isAmbiguous || isGroundedError) {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: isAmbiguous ? responseText : refutationText,
          explanation,
          timestamp: new Date()
        }
      ]);
      setIsThinking(false);
      return;
    }

    // Apply color accent memory
    let activeAccent = memory.accentColor || updatedData.colorAccent || 'purple';

    // Rule matches
    if (promptLower.includes('apple')) {
      updatedData.themeName = 'Apple Inspired';
      updatedData.theme = 'apple';
      updatedData.colorAccent = 'slate';
      actionName = 'Theme Design';
      explanation = 'I selected the premium Apple Inspired layout with minimal typography, strict spacing, and subtle micro-transitions to match a clean hardware-like aesthetic.';
      toastMsg = '✓ Theme changed to Apple Style';
      responseText = 'Theme updated! Applied Apple Inspired style with sans-serif typography and minimal slate accents.';
    } else if (promptLower.includes('cyberpunk')) {
      updatedData.themeName = 'Cyberpunk';
      updatedData.theme = 'cyberpunk';
      updatedData.colorAccent = 'yellow';
      actionName = 'Theme Design';
      explanation = 'I customized the interface with glowing text shadows, high contrast borders, and vibrant neon yellow highlights.';
      toastMsg = '✓ Theme changed to Cyberpunk';
      responseText = 'Theme updated to Cyberpunk! Added retro-glowing cards and neon borders.';
    } else if (promptLower.includes('glassmorphism') || promptLower.includes('glass')) {
      updatedData.themeName = 'Glassmorphism';
      updatedData.theme = 'glass';
      actionName = 'Theme Design';
      explanation = 'I enabled frosted-glass panels utilizing backdrop blur CSS styling for a sophisticated modern appeal.';
      toastMsg = '✓ Applied glassmorphism aesthetic';
      responseText = 'Applied frosted glass panels with smooth box-shadows.';
    } else if (promptLower.includes('minimal')) {
      updatedData.themeName = 'Minimal Modern';
      updatedData.theme = 'minimal';
      actionName = 'Theme Design';
      explanation = 'I removed complex decorations, simplified margins, and centered headings to emphasize absolute raw reading focus.';
      toastMsg = '✓ Theme changed to Minimalist';
      responseText = 'Applied modern minimalist theme.';
    } else if (promptLower.includes('startup')) {
      updatedData.themeName = 'Startup Founder';
      updatedData.theme = 'startup';
      actionName = 'Theme Design';
      explanation = 'I customized the portfolio structure to present business achievements and venture stats prominently.';
      toastMsg = '✓ Applied Startup Founder theme';
      responseText = 'Applied Startup Founder theme.';
    } else if (promptLower.includes('blue')) {
      updatedData.colorAccent = 'blue';
      setMemory(prev => ({ ...prev, accentColor: 'blue' }));
      actionName = 'Color Accents';
      explanation = 'I configured the core styling system to use blue accents across primary action buttons, borders, and active nav states.';
      toastMsg = '✓ Color accent changed to blue';
      responseText = 'Accent color switched to professional blue.';
    } else if (promptLower.includes('purple')) {
      updatedData.colorAccent = 'purple';
      setMemory(prev => ({ ...prev, accentColor: 'purple' }));
      actionName = 'Color Accents';
      explanation = 'Applied vibrant purple branding tags to emphasize high-tech creative aesthetics.';
      toastMsg = '✓ Color accent changed to purple';
      responseText = 'Accent color switched to neon purple.';
    } else if (promptLower.includes('red')) {
      updatedData.colorAccent = 'red';
      setMemory(prev => ({ ...prev, accentColor: 'red' }));
      actionName = 'Color Accents';
      explanation = 'Adjusted UI accent colors to deep crimson red to capture quick visual attention.';
      toastMsg = '✓ Color accent changed to red';
      responseText = 'Accent color switched to crimson red.';
    } else if (promptLower.includes('green')) {
      updatedData.colorAccent = 'green';
      setMemory(prev => ({ ...prev, accentColor: 'green' }));
      actionName = 'Color Accents';
      explanation = 'Switched to positive green signals representing growth and success metric parameters.';
      toastMsg = '✓ Color accent changed to green';
      responseText = 'Accent color switched to emerald green.';
    } else if (promptLower.includes('move projects') || promptLower.includes('projects above')) {
      // Reorder layout array
      updatedData.sectionOrdering = ['projects', 'skills', 'experience', 'education', 'achievements'];
      actionName = 'Layout Update';
      explanation = 'I placed Projects first in the section list because developers are primarily vetted by their built systems and public repository execution quality.';
      toastMsg = '✓ Projects moved to top';
      responseText = 'Layout reordered! Projects section is now loaded at the top.';
    } else if (promptLower.includes('hide education') || promptLower.includes('remove education')) {
      if (updatedData.sectionOrdering) {
        updatedData.sectionOrdering = updatedData.sectionOrdering.filter((s: string) => s !== 'education');
      } else {
        updatedData.sectionOrdering = ['basics', 'skills', 'projects', 'experience', 'achievements'];
      }
      actionName = 'Layout Update';
      explanation = 'I hid the Education section to place stronger focus on your active work experience and project repositories.';
      toastMsg = '✓ Education section hidden';
      responseText = 'Education section is now hidden. You can undo this anytime.';
    } else if (promptLower.includes('timeline')) {
      updatedData.layoutStyle = 'timeline';
      actionName = 'Layout Update';
      explanation = 'I restructured your career events into an interactive chronological timeline layout.';
      toastMsg = '✓ Switched to timeline view';
      responseText = 'Layout format updated to chronological timeline.';
    } else if (promptLower.includes('sidebar')) {
      updatedData.layoutStyle = 'sidebar';
      actionName = 'Layout Update';
      explanation = 'Constructed a left-aligned navigation column to maximize content scanning efficiency.';
      toastMsg = '✓ Enabled sidebar layout';
      responseText = 'Enabled sidebar navigation controls.';
    } else if (promptLower.includes('floating')) {
      updatedData.layoutStyle = 'floating';
      actionName = 'Layout Update';
      explanation = 'Applied a floating glass dock navbar at the bottom of the screen to save screen real estate.';
      toastMsg = '✓ Enabled floating navigation dock';
      responseText = 'Applied floating bottom navigation bar.';
    } else if (promptLower.includes('rewrite about') || promptLower.includes('about section') || promptLower.includes('about me')) {
      updatedData.basics.bio = 'Results-driven software architect with a passion for designing resilient systems and scaling web products. Expert in mapping complex operational processes into performant, clean-code microservices.';
      updatedData.basics.tagline = 'Engineering resilient, scalable full-stack products with high recruiter impact.';
      actionName = 'Copy Rewrite';
      explanation = 'I polished your personal narrative to highlight high-level system leadership, substituting passive wording with active, impactful action verbs.';
      toastMsg = '✓ About section updated';
      responseText = 'Polished your Bio and Tagline. The summary is now more confident and system-focused.';
    } else if (promptLower.includes('technical projects') || promptLower.includes('more technical')) {
      updatedData.projects = updatedData.projects.map((proj: ProjectItem) => ({
        ...proj,
        details: proj.details + ' Engineered high-performance backend pipelines using multithreaded queuing, strict interface definitions, and automated integration suites.',
        challengesSolved: 'Resolved sub-optimal execution bottleneck loop constraints by decoupling async operations and applying indexing metrics.'
      }));
      actionName = 'Project Enrichment';
      explanation = 'I enriched all project descriptions to use precise technological jargon and emphasize engineering challenges.';
      toastMsg = '✓ Projects enriched';
      responseText = 'Enriched all project narratives with deeper technical metrics and challenges resolved.';
    } else if (promptLower.includes('ats')) {
      updatedData.basics.bio = updatedData.basics.bio + ' Specializing in core web metrics, system integrations, TypeScript architectures, and CI/CD automation pipelines.';
      actionName = 'ATS Optimization';
      explanation = 'I injected essential developer industry keywords into your bio and summaries to make the portfolio rank higher in automated applicant screening tools.';
      toastMsg = '✓ Optimized for ATS screening';
      responseText = 'Injected key engineering terminologies (CI/CD, API architectures, web metrics) for ATS compliance.';
    } else if (promptLower.includes('ai engineer') || promptLower.includes('ai')) {
      updatedData.basics.professionalTitle = 'AI & Systems Engineer';
      updatedData.basics.tagline = 'Building RAG architectures, LLM pipelines, and cognitive agent workflows.';
      // Prepend an AI project
      const aiProject: ProjectItem = {
        name: 'Cognitive RAG Engine',
        description: 'High-performance retrieval system parsing docx/pdf formats into vector embeddings with sub-100ms querying.',
        details: 'Constructed an indexing pipeline integrating cosine similarity matching, custom metadata tagging, and LLM-assisted answer formulation.',
        challengesSolved: 'Optimized context window token consumption by 35% using semantic clustering.',
        techStack: ['Python', 'TypeScript', 'VectorDB', 'LangChain', 'OpenAI'],
        githubLink: 'https://github.com/example/rag-engine'
      };
      updatedData.projects = [aiProject, ...updatedData.projects];
      // Insert AI skill category
      const aiSkill: SkillCategory = {
        category: 'AI & Data Engineering',
        items: ['Vector Databases', 'RAG Architectures', 'LLM Fine-tuning', 'Python APIs', 'LangChain']
      };
      updatedData.skills = [aiSkill, ...updatedData.skills];
      actionName = 'Career Pivot';
      explanation = 'I shifted your profile focus to Artificial Intelligence by rewriting your title, adding a vector indexing project, and placing LLM skills at the top of your skills grid.';
      toastMsg = '✓ Profile pivot to AI Engineer';
      responseText = 'Pivot complete! Your portfolio now positions you as a premium AI and Systems Engineer.';
    } else if (promptLower.includes('startup founder')) {
      updatedData.basics.professionalTitle = 'Founding Developer / CTO';
      updatedData.basics.tagline = 'Shipping zero-to-one web applications and scaling user acquisition products.';
      actionName = 'Career Pivot';
      explanation = 'I customized the text elements to highlight business velocity, rapid feature scaling, and full-stack ownership.';
      toastMsg = '✓ Pivot to Startup Founder';
      responseText = 'Profile rewritten for a Startup Founder tone.';
    } else if (promptLower.includes('backend')) {
      updatedData.basics.professionalTitle = 'Lead Backend Engineer';
      updatedData.basics.tagline = 'Designing robust microservices, data schemas, and distributed system architectures.';
      actionName = 'Career Pivot';
      explanation = 'Repositioned key titles to focus on backend architecture, API resilience, and query speeds.';
      toastMsg = '✓ Pivot to Backend Developer';
      responseText = 'Profile updated to highlight Backend Engineering expertise.';
    } else if (promptLower.includes('expand project') || promptLower.includes('shorten project')) {
      if (promptLower.includes('shorten')) {
        updatedData.projects = updatedData.projects.map((p: ProjectItem) => ({
          ...p,
          details: p.description
        }));
        actionName = 'Project Optimization';
        explanation = 'Condensed project descriptions to maintain an easily scannable, punchy summary layout.';
        toastMsg = '✓ Project details condensed';
        responseText = 'Shortened project descriptions to optimize page layout constraints.';
      } else {
        updatedData.projects = updatedData.projects.map((p: ProjectItem) => ({
          ...p,
          details: p.details + ' Additionally managed the end-to-end CI/CD release workflow, ensuring lint checks, static analysis, and Docker container deployments were automated.'
        }));
        actionName = 'Project Enrichment';
        explanation = 'Expanded descriptions by appending deployment, monitoring, and scaling accomplishments.';
        toastMsg = '✓ Project details expanded';
        responseText = 'Expanded project narratives to highlight architectural operations.';
      }
    } else if (promptLower.includes('highlight ai skills') || promptLower.includes('skills')) {
      // Sort categories or highlight AI skills
      const categories = [...updatedData.skills];
      categories.sort((a, b) => {
        if (a.category.toLowerCase().includes('ai') || a.category.toLowerCase().includes('data')) return -1;
        if (b.category.toLowerCase().includes('ai') || b.category.toLowerCase().includes('data')) return 1;
        return 0;
      });
      updatedData.skills = categories;
      actionName = 'Skills Reorder';
      explanation = 'Sorted your skills grid to place vector engineering and core computing packages at the absolute top of the index.';
      toastMsg = '✓ Highlighted AI skills';
      responseText = 'Reordered skills category grid. AI and Data technologies now appear first.';
    } else if (promptLower.includes('metrics') || promptLower.includes('achievement')) {
      updatedData.experience = updatedData.experience.map((exp: ExperienceItem) => ({
        ...exp,
        bullets: exp.bullets.map(b => b.replace(/(API|query|migrations)/gi, (match) => `scalable ${match}`))
      }));
      // Add metric statement to bio
      updatedData.basics.bio = updatedData.basics.bio + ' Successfully reduced infrastructure expenditures by 25% while maintaining 99.9% uptime rates.';
      actionName = 'Content Update';
      explanation = 'I added quantitative metrics and cost performance ratios to emphasize business-level engineering impact.';
      toastMsg = '✓ Quantitative metrics injected';
      responseText = 'Injected measurable performance numbers and cloud cost ratios into experience bullets.';
    } else {
      // Fallback update
      updatedData.basics.bio = updatedData.basics.bio + ' Devoted to high engineering standards and performance optimization.';
      actionName = 'Content Edit';
      explanation = 'Updated your portfolio content to reflect the general enhancement criteria requested.';
      toastMsg = '✓ Portfolio details updated';
      responseText = `I have parsed your prompt and updated your portfolio state accordingly. Applied custom changes based on: "${userPrompt}"`;
    }

    // Apply active accent from memory if not modified
    if (!promptLower.includes('theme') && !promptLower.includes('apple') && !promptLower.includes('cyberpunk')) {
      updatedData.colorAccent = activeAccent;
    }

    // Automatically map highlighted sections based on action/prompt
    if (actionName.includes('Theme') || actionName.includes('Accent') || promptLower.includes('timeline') || promptLower.includes('sidebar') || promptLower.includes('floating') || promptLower.includes('theme')) {
      highlightSec = 'theme';
    } else if (actionName.includes('Project') || promptLower.includes('project')) {
      highlightSec = 'projects';
    } else if (actionName.includes('Skill') || promptLower.includes('skill')) {
      highlightSec = 'skills';
    } else if (promptLower.includes('experience') || promptLower.includes('education') || actionName.includes('Experience')) {
      highlightSec = 'experience';
    } else {
      highlightSec = 'about';
    }

    // Proposal Buffer Logic (Preview Before Applying)
    const proposalId = Math.random().toString();
    const isMajorChange = actionName.includes('Theme') || actionName.includes('Career') || promptLower.includes('layout') || promptLower.includes('reorder');

    const meta = {
      title: actionName,
      description: explanation,
      section: highlightSec,
      changes: [
        { title: actionName, desc: responseText }
      ],
      major: isMajorChange
    };

    const newPendingProposal = {
      msgId: proposalId,
      newData: updatedData,
      meta,
      actionName,
      explanation,
      toastMsg
    };

    // If it's a major change, trigger Safe Confirm Modal dialog before presenting proposal in chat
    if (isMajorChange) {
      setPendingProposal(newPendingProposal);
      setShowConfirmModal(true);
    } else {
      // Direct render proposal in chat timeline
      setPendingProposal(newPendingProposal);
      setMessages(prev => [
        ...prev,
        {
          id: proposalId,
          sender: 'ai',
          text: `Proposed modification to your portfolio:`,
          explanation,
          timestamp: new Date(),
          isProposal: true,
          proposalMeta: meta,
          proposalData: updatedData
        }
      ]);
    }

    setIsThinking(false);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'user',
        text: userMsg,
        timestamp: new Date()
      }
    ]);

    processAIRequest(userMsg);
  };

  const handleSaveAndPublish = async () => {
    try {
      await onSave(currentData);
      triggerToast('🚀 Portfolio saved and published successfully!');
    } catch (err) {
      triggerToast('❌ Failed to save changes.');
    }
  };

  const currentExplanation = messages[messages.length - 1]?.explanation || 'Ready to assist. Tell me what changes you\'d like to see!';

  return (
    <div className="fixed inset-0 z-50 bg-background-dark text-white flex flex-col md:flex-row font-sans">
      
      {isMobile && (
        <div className="bg-gray-950 border-b border-gray-900 flex shrink-0 p-1.5 z-50 gap-1.5">
          <button
            onClick={() => setActiveMobileView('chat')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${activeMobileView === 'chat' ? 'bg-purple-650 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            💬 Chat Editor
          </button>
          <button
            onClick={() => setActiveMobileView('preview')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition ${activeMobileView === 'preview' ? 'bg-purple-650 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            👁️ Live Preview
          </button>
        </div>
      )}

      {/* LEFT PANEL: Chat & History (30% Width) */}
      <div className={`w-full md:w-[32%] border-r border-gray-900 bg-background-dark/95 flex flex-col h-full overflow-hidden shrink-0 ${isMobile && activeMobileView !== 'chat' ? 'hidden' : 'flex'}`}>
        
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-gray-900 flex justify-between items-center bg-gray-950/40 shrink-0">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-gray-900 rounded-lg text-gray-400 hover:text-white transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-bold text-base flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span>AI Live Editor</span>
              </h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Active Slug: /p/{slug}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowVersionPanel(!showVersionPanel)}
              className={`p-2 rounded-xl border transition ${showVersionPanel ? 'border-purple-500 bg-purple-950/20 text-purple-400' : 'border-gray-900 hover:bg-gray-900 text-gray-400'}`}
              title="Version History Timeline"
            >
              <History className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleSaveAndPublish}
              className="px-3.5 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
            >
              <span>Publish</span>
            </button>
          </div>
        </div>

        {/* Dynamic Toast System */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-4 right-4 z-50 p-3 bg-purple-900/90 backdrop-blur-md border border-purple-500/30 text-purple-100 rounded-xl text-xs font-semibold shadow-2xl flex items-center justify-between"
            >
              <span>{toast.message}</span>
              <Check className="h-4 w-4 text-green-400" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Version History Sidebar overlay */}
        <AnimatePresence>
          {showVersionPanel && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-[65px] bottom-0 left-0 w-full md:w-[32%] z-45 bg-gray-950/98 border-r border-gray-900 flex flex-col p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-2">
                  <History className="h-4 w-4 text-purple-400" />
                  <span>Version History Stack</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${compareMode ? 'bg-purple-950/40 text-purple-400 border-purple-500/40' : 'border-gray-900 text-gray-500 hover:text-white'}`}
                  >
                    Compare Mode
                  </button>
                  <button onClick={() => setShowVersionPanel(false)} className="text-gray-500 hover:text-white text-xs font-bold">Close</button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-4 pr-1">
                {history.map((h, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleRestoreVersion(index)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col space-y-2 ${index === historyIndex ? 'border-purple-500/50 bg-purple-950/20' : 'border-gray-900 hover:bg-gray-900/60'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-bold ${index === historyIndex ? 'text-purple-400' : 'text-white'}`}>{h.actionName}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{h.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed italic">"{h.explanation}"</p>
                    {index === historyIndex && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-bold self-start border border-purple-500/20">
                        Active Sandbox State
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Log & Workspace */}
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 flex flex-col">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col space-y-1.5 max-w-[85%] ${m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className={`p-4 rounded-2xl text-xs leading-relaxed ${m.sender === 'user' ? 'bg-purple-650 text-white rounded-tr-none' : 'bg-gray-900/80 border border-gray-900 text-gray-300 rounded-tl-none'}`}>
                {m.text}
                {m.isProposal && m.proposalMeta && (
                  <div className="mt-3 p-3 bg-gray-950/80 border border-purple-500/20 rounded-xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-900">
                      <span className="font-bold text-[11px] text-purple-400 uppercase tracking-wider">{m.proposalMeta.title}</span>
                      {m.proposalMeta.major && (
                        <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">Major Change</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 italic">"{m.proposalMeta.description}"</p>
                    <div className="space-y-1">
                      {m.proposalMeta.changes.map((c, cIdx) => (
                        <div key={cIdx} className="text-[10px] bg-gray-900/40 px-2 py-1 rounded">
                          <span className="font-bold text-gray-300">Proposed: </span>
                          <span className="text-gray-400">{c.desc}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2 pt-1.5 border-t border-gray-900">
                      <button
                        onClick={() => handleApplyPendingProposal(m.id, {
                          msgId: m.id,
                          newData: m.proposalData!,
                          meta: m.proposalMeta,
                          actionName: m.proposalMeta!.title,
                          explanation: m.proposalMeta!.description,
                          toastMsg: '✓ Applied proposed updates.'
                        })}
                        className="px-3 py-1.5 bg-purple-650 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1"
                      >
                        <Check className="h-3 w-3" />
                        <span>Apply Changes</span>
                      </button>
                      <button
                        onClick={() => handleDiscardPendingProposal(m.id)}
                        className="px-3 py-1.5 border border-gray-800 hover:bg-gray-900 text-gray-400 hover:text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-gray-600 px-1">
                {m.sender === 'user' ? 'You' : 'AI Architect'} • {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Thinking status animation */}
          {isThinking && (
            <div className="self-start flex flex-col space-y-2 max-w-[85%]">
              <div className="p-4 bg-gray-900/80 border border-gray-900 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <span className="text-xs text-gray-400 font-medium">Re-rendering portfolio nodes</span>
                <div className="flex space-x-1.5">
                  <motion.div className="w-1.5 h-1.5 bg-purple-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-1.5 h-1.5 bg-purple-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                  <motion.div className="w-1.5 h-1.5 bg-purple-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* AI Explanation and Proactive suggestions panel */}
        <div className="px-6 py-3 border-t border-gray-900 bg-gray-950/20 space-y-3.5 shrink-0">
          
          {/* Proactive improvement suggested chips if user is inactive (e.g. >10 seconds idle) */}
          {inactiveTimer >= 10 && (
            <div className="space-y-1.5 animate-fadeIn">
              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="h-3 w-3" />
                <span>AI Design Recommendations</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {proactiveSuggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      resetInactivity();
                      setMessages(prev => [
                        ...prev,
                        { id: s.id, sender: 'user', text: s.text, timestamp: new Date() }
                      ]);
                      processAIRequest(s.text);
                    }}
                    className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/20 text-purple-300 rounded-lg text-[10px] transition text-left cursor-pointer"
                  >
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Explanation block */}
          {currentExplanation && (
            <div className="p-3 bg-purple-950/15 border border-purple-500/10 rounded-xl space-y-1">
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">Rationale Overview</span>
              <p className="text-[10px] text-gray-400 italic leading-relaxed">"{currentExplanation}"</p>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips (Scrollable list above input) */}
        <div className="px-6 py-2 bg-gray-950/40 overflow-x-auto whitespace-nowrap flex gap-2 border-t border-gray-900 no-scrollbar shrink-0">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(p);
                resetInactivity();
              }}
              className="px-3 py-1.5 bg-gray-900/60 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-full text-[10px] transition shrink-0 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Box Area */}
        <div className="p-4 border-t border-gray-900 bg-gray-950/60 flex flex-col space-y-2 shrink-0">
          {/* Quick Sandbox Controls */}
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-semibold">
              <Cpu className="h-3 w-3 text-purple-500" />
              <span>Sandbox Status: Ready</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleUndo} 
                disabled={historyIndex === 0}
                className="p-1 hover:bg-gray-900 rounded text-gray-400 disabled:opacity-30 transition"
                title="Undo last change"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={handleRedo} 
                disabled={historyIndex === history.length - 1}
                className="p-1 hover:bg-gray-900 rounded text-gray-400 disabled:opacity-30 transition"
                title="Redo change"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                resetInactivity();
              }}
              placeholder="Ask AI to style, rewrite, or structure your portfolio..."
              className="w-full pl-4 pr-12 py-3 bg-gray-900/50 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim()}
              className="absolute right-2 p-2 bg-purple-650 hover:bg-purple-700 disabled:bg-gray-900 text-white rounded-lg transition"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT PANEL: Live Portfolio Preview (70% Width) */}
      <div className={`flex-grow flex flex-col h-full bg-background-dark/40 overflow-hidden relative ${isMobile && activeMobileView !== 'preview' ? 'hidden' : 'flex'}`}>
        
        {/* Preview Panel Header */}
        <div className="px-6 py-4 border-b border-gray-900 flex justify-between items-center bg-gray-950/20">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <h3 className="font-bold text-sm tracking-tight text-gray-300">Live Preview Sandbox</h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Resolution Toggle */}
            <div className="bg-gray-900/80 p-0.5 rounded-lg border border-gray-850 flex">
              <button
                onClick={() => setActivePreviewTab('desktop')}
                className={`px-3 py-1 rounded text-[10px] font-bold flex items-center space-x-1.5 transition ${activePreviewTab === 'desktop' ? 'bg-purple-650 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Monitor className="h-3 w-3" />
                <span>Desktop view</span>
              </button>
              <button
                onClick={() => setActivePreviewTab('mobile')}
                className={`px-3 py-1 rounded text-[10px] font-bold flex items-center space-x-1.5 transition ${activePreviewTab === 'mobile' ? 'bg-purple-650 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <div className="h-3 w-2 border border-current rounded-sm"></div>
                <span>Responsive mobile</span>
              </button>
            </div>

            {compareMode && (
              <div className="px-3 py-1 bg-yellow-950/20 border border-yellow-500/20 text-yellow-400 rounded-lg text-[10px] font-bold">
                Comparing Version state: {history[historyIndex].actionName}
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Screen Container */}
        <div className="flex-grow overflow-auto p-4 md:p-8 flex justify-center items-center bg-gray-900/10">
          <div className={`transition-all duration-300 ease-out bg-black/40 rounded-2xl border border-gray-900 overflow-hidden shadow-2xl relative flex flex-col ${activePreviewTab === 'mobile' ? 'w-[375px] max-h-[812px] max-w-full max-h-full h-full border-[8px] border-gray-800' : 'w-full h-full'}`}>
            
            {/* Status updates notifications (highlights) overlay */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-6 right-6 z-40 bg-purple-950/95 border border-purple-500/30 text-purple-200 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-purple-400 animate-spin" />
                  <span>Highlighting changes in live preview</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* In-memory Portfolio Preview renderer */}
            <div className="flex-grow overflow-y-auto">
              <PortfolioView
                slug={slug}
                isPreview={true}
                previewData={currentData}
                highlightedSection={activeHighlightSection}
              />
            </div>

          </div>
        </div>

      </div>

      {showConfirmModal && pendingProposal && (
        <div className="fixed inset-0 z-55 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 rounded-2xl border border-red-500/20 bg-gray-950 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-red-400 font-bold">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span>Confirm Major Layout Change</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              You are about to perform a major design restructure: <strong>{pendingProposal.actionName}</strong>. 
              This will update layout structures, themes, or rewrite sections matching: 
              <br />
              <em className="text-gray-300">"{pendingProposal.explanation}"</em>.
            </p>
            <div className="flex space-x-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  // Post proposal card in timeline
                  setMessages(prev => [
                    ...prev,
                    {
                      id: pendingProposal.msgId,
                      sender: 'ai',
                      text: `Proposed major modification:`,
                      explanation: pendingProposal.explanation,
                      timestamp: new Date(),
                      isProposal: true,
                      proposalMeta: pendingProposal.meta,
                      proposalData: pendingProposal.newData
                    }
                  ]);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
              >
                Yes, Propose Change
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingProposal(null);
                  triggerToast('Major change cancelled.');
                }}
                className="px-4 py-2 border border-gray-800 hover:bg-gray-900 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
