import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Trash2, Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

// Custom Map-based browser-safe LRU Cache implementation (remembers key insertion ordering)
class SimpleBrowserLRUCache<K, V> {
  private max: number;
  private cache: Map<K, V>;

  constructor(max = 50) {
    this.max = max;
    this.cache = new Map<K, V>();
  }

  public get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item !== undefined) {
      // Refresh key by deleting and re-inserting it at the end
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict least recently used (first item in Map iterator)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  public clear(): void {
    this.cache.clear();
  }
}

// Instantiate client-side cache persistent across renders
const clientCopilotCache = new SimpleBrowserLRUCache<string, string>(50);

const SUGGESTED_PROMPTS = [
  "Tell me about your background",
  "What projects have you built?",
  "What technologies do you know?",
  "What are your strengths?",
  "Why should I hire you?"
];

interface AICopilotSectionProps {
  basics: {
    name: string;
    email: string;
  };
  slug: string;
}

const AICopilotSection: React.FC<AICopilotSectionProps> = ({ basics, slug }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hi, I'm ${basics.name}. Want to know more about me? Let's talk.`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true); // TTS Active by default
  const [autoSend, setAutoSend] = useState(true); // Auto-submit voice active by default
  const [speechSupport, setSpeechSupport] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle'); // idle, listening, thinking, speaking
  const [micError, setMicError] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const autoSendRef = useRef(autoSend);

  // Sync autoSend state to ref to avoid stale closures inside event listeners
  useEffect(() => {
    autoSendRef.current = autoSend;
  }, [autoSend]);

  // Initialize Speech Synthesis and Recognition
  useEffect(() => {
    // 1. Setup Speech Synthesis (TTS)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    // 2. Setup Speech Recognition (STT)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setMicError("");
        setVoiceStatus('listening');
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setVoiceStatus('idle');
        
        if (event.error === 'not-allowed') {
          setMicError("Microphone access is required for voice interaction. Please enable it in browser settings.");
        } else if (event.error === 'no-speech') {
          setMicError("I couldn't hear anything. Please try speaking again.");
        } else if (event.error === 'network') {
          // Dynamic Brave Browser blocking detection
          if (typeof navigator !== 'undefined' && (navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
            (navigator as any).brave.isBrave().then((isBrave: boolean) => {
              if (isBrave) {
                setMicError("Brave Browser has completely removed Google Speech-to-Text integration to protect your privacy. You can still type your questions and hear the AI speak answers aloud! For the full microphone experience, please open this page in Chrome or Edge.");
              } else {
                setMicError("Speech recognition network error. This browser API requires an active internet connection. Please verify your connection and try speaking again.");
              }
            }).catch(() => {
              setMicError("Speech recognition network error. Please verify your internet connection and try speaking again.");
            });
          } else {
            setMicError("Speech recognition network error. This browser API requires an active internet connection. Please verify your connection and try speaking again.");
          }
        } else {
          setMicError(`Speech error: ${event.error}. Please try again.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setVoiceStatus('idle');
        setMicError("");

        if (autoSendRef.current) {
          handleSend(transcript);
        }
      };

      recognitionRef.current = rec;
      setSpeechSupport(true);
    } else {
      setSpeechSupport(false);
    }

    // Cleanup speech engines on component unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Speak Text Aloud Helper
  const speakText = (text: string) => {
    if (!synthRef.current) return;

    // Terminate any active speech
    synthRef.current.cancel();

    if (!voiceEnabled) return;

    // Clean text by stripping Markdown bolding, headers, and code ticks
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove markdown bolding
      .replace(/[\*\#\`\_]/g, '')     // strip remaining MD characters
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Dynamic professional English voice selection
    const voices = synthRef.current.getVoices();
    const premiumVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                         voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];

    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }

    utterance.rate = 1.05; // Slightly faster, highly professional rhythm
    utterance.pitch = 1.0;  // Standard natural pitch

    utterance.onstart = () => {
      setIsSpeaking(true);
      setVoiceStatus('speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceStatus('idle');
    };

    utterance.onerror = (err) => {
      console.error("Speech synthesis error:", err);
      setIsSpeaking(false);
      setVoiceStatus('idle');
    };

    synthRef.current.speak(utterance);
  };

  // Halt active speech
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      if (voiceStatus === 'speaking') {
        setVoiceStatus('idle');
      }
    }
  };

  // Trigger speech recognition capture loop
  const toggleListening = () => {
    // If the AI is currently speaking, clicking the mic button halts the audio and returns to idle
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setVoiceStatus('idle');
    } else {
      try {
        setMicError("");
        setInputValue("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start Speech Recognition:", err);
      }
    }
  };

  const handleSend = async (text: string) => {
    if (!text || !text.trim()) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Please enter a question." }]);
      return;
    }

    // Stop any ongoing assistant speech
    stopSpeaking();

    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    const isOneOffQuery = messages.filter(m => m.role === 'user').length === 0;
    const cacheKey = text.toLowerCase().trim();

    if (isOneOffQuery) {
      const cachedReply = clientCopilotCache.get(cacheKey);
      if (cachedReply) {
        console.log(`[Client Cache Hit] Serving local response for key: "${cacheKey}"`);
        setMessages(prev => [...prev, { role: 'assistant' as const, content: cachedReply }]);
        if (voiceEnabled) {
          speakText(cachedReply);
        }
        return;
      }
    }

    setIsLoading(true);
    setVoiceStatus('thinking');

    try {
      const response = await fetch(`/api/portfolio/p/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant' as const, content: data.reply }]);
        setVoiceStatus('idle');

        if (isOneOffQuery) {
          clientCopilotCache.set(cacheKey, data.reply);
        }
        
        // Speak response aloud automatically
        if (voiceEnabled) {
          speakText(data.reply);
        }
      } else {
        let errMsg = data.error || "Unable to reach the server.";
        
        if (errMsg.includes('503') || errMsg.toLowerCase().includes('high demand') || errMsg.toLowerCase().includes('quota') || errMsg.includes('429')) {
          errMsg = "My AI brain is currently experiencing unusually high traffic from Google's servers! 🧠⚡ Please wait a few seconds and try asking again.";
        } else if (errMsg.includes('API key not valid')) {
          errMsg = "My AI systems are currently offline due to a configuration error. Please try again later.";
        } else {
          errMsg = "Oops, I ran into a technical snag: " + errMsg;
        }

        setMessages(prev => [...prev, { role: 'assistant' as const, content: errMsg }]);
        setVoiceStatus('idle');
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant' as const, content: "I'm having trouble connecting to my servers. Please make sure the backend is running." }]);
      setVoiceStatus('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setMessages([{
      role: 'assistant',
      content: `Hi, I'm ${basics.name}. Want to know more about me? Let's talk.`
    }]);
    setMicError("");
  };

  return (
    <section className="py-20 relative border-t border-white/5 transition-colors duration-300" id="copilot">
      {/* Self-contained custom CSS overrides for dynamic pulse wave and ring animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseWave {
          0% { transform: scaleY(0.25); }
          100% { transform: scaleY(1.3); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}} />

      <div className="max-w-[1500px] w-full px-5 sm:px-10 lg:px-16 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Bot className="text-purple-400 w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-white leading-[1.3]">
              AI Career <span className="text-gradient py-2 inline-block">Copilot.</span>
            </h2>
          </div>
          <p className="text-gray-400 font-sans text-center max-w-2xl text-base">
            Explore my background, experiences, and technical projects through dynamic conversation.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto glass-panel border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[550px] md:h-[650px] relative backdrop-blur-xl transition-colors duration-300">
          
          {/* Header */}
          <div className="p-4 md:p-5 border-b border-white/5 bg-zinc-950/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-[2px]">
                  <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-zinc-950 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm leading-tight">Ask my representative</h3>
                {isSpeaking ? (
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium animate-fadeIn mt-0.5">
                    <span className="flex items-center gap-0.5 h-3 w-4">
                      <span className="w-[2px] bg-green-500 rounded-full animate-[pulseWave_0.8s_infinite_ease-in-out_alternate]" style={{ height: '60%', animationDelay: '0ms' }} />
                      <span className="w-[2px] bg-green-500 rounded-full animate-[pulseWave_0.8s_infinite_ease-in-out_alternate]" style={{ height: '100%', animationDelay: '150ms' }} />
                      <span className="w-[2px] bg-green-500 rounded-full animate-[pulseWave_0.8s_infinite_ease-in-out_alternate]" style={{ height: '45%', animationDelay: '300ms' }} />
                    </span>
                    AI is speaking...
                  </div>
                ) : isListening ? (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium animate-fadeIn mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Listening to you...
                  </div>
                ) : (
                  <p className="text-xs text-purple-400 mt-0.5 font-medium">Online & Ready</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Error Alerts */}
          {micError && (
            <div className="mx-4 md:mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-red-400 text-xs font-mono animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{micError}</span>
              </div>
              <button 
                onClick={() => setMicError("")}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 flex flex-col gap-6 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed relative group border ${
                    msg.role === 'user' 
                      ? 'bg-blue-950/20 text-white rounded-tr-sm border-blue-500/10' 
                      : 'bg-zinc-900/40 text-gray-300 rounded-tl-sm border-white/5'
                  }`}>
                    
                    {/* Speak Button for assistant messages */}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => {
                          if (isSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.content);
                          }
                        }}
                        className="absolute -right-8 top-1 p-1 text-gray-500 hover:text-purple-400 rounded-lg bg-zinc-950 border border-white/5 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                        title="Read aloud"
                        type="button"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div 
                      className="whitespace-pre-wrap font-sans"
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-purple-400">$1</strong>')
                      }} 
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5 text-purple-400 border border-purple-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="px-4 md:px-6 pb-3">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInputValue(prompt);
                    handleSend(prompt);
                  }}
                  className="whitespace-nowrap px-3.5 py-1.5 bg-zinc-950 border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/30 text-gray-400 hover:text-purple-400 rounded-full text-[11px] transition-all flex items-center gap-1.5 cursor-pointer select-none shrink-0"
                >
                  <span>💡</span>
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-5 bg-zinc-950/60 border-t border-white/5 relative z-10 transition-colors duration-300">
            <div className="relative flex items-center">
              
              {/* Premium Microphone Trigger Button */}
              {speechSupport && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-12 rounded-full transition-all flex items-center justify-center border shrink-0 w-8.5 h-8.5 sm:w-9 sm:h-9 cursor-pointer ${
                    isListening
                      ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                      : isSpeaking
                      ? 'bg-green-500 border-green-500 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                      : 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-450 hover:border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.05)]'
                  }`}
                  title={
                    isSpeaking ? "Stop voice feedback" :
                    isListening ? "Halt voice input" : 
                    "Tap to ask with voice"
                  }
                >
                  {isListening ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div className="absolute rounded-full bg-red-500/30 animate-[ringPulse_1s_infinite_ease-out] w-8.5 h-8.5 sm:w-9 sm:h-9" />
                      <MicOff className="w-3.5 h-3.5 relative z-10" />
                    </div>
                  ) : isSpeaking ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div className="absolute rounded-full bg-green-500/30 animate-[ringPulse_1s_infinite_ease-out] w-8.5 h-8.5 sm:w-9 sm:h-9" />
                      <Volume2 className="w-3.5 h-3.5 relative z-10" />
                    </div>
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  stopSpeaking();
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening ? "Listening... Ask me anything!" : "Ask my Career Copilot a question..."
                }
                className={`w-full bg-zinc-950 border border-white/5 rounded-full py-3 pl-5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/40 resize-none overflow-hidden transition-all text-xs sm:text-sm ${
                  speechSupport ? 'pr-24' : 'pr-12'
                }`}
                style={{ minHeight: '42px', maxHeight: '100px' }}
              />
              
              <button
                onClick={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-900 disabled:text-gray-600 text-white rounded-full transition-all flex items-center justify-center shrink-0 w-8.5 h-8.5 sm:w-9 sm:h-9 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-2.5 px-2 text-[10px] text-gray-500 font-mono">
              <div>
                Type your question or use standard templates
              </div>
              <div className="flex gap-3 select-none">
                <label className="flex items-center gap-1 cursor-pointer hover:text-gray-400">
                  <input 
                    type="checkbox" 
                    checked={voiceEnabled} 
                    onChange={(e) => {
                      setVoiceEnabled(e.target.checked);
                      if (!e.target.checked) stopSpeaking();
                    }}
                    className="accent-purple-500 cursor-pointer w-3 h-3"
                  />
                  <span>Voice TTS</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer hover:text-gray-400">
                  <input 
                    type="checkbox" 
                    checked={autoSend} 
                    onChange={(e) => setAutoSend(e.target.checked)}
                    className="accent-purple-500 cursor-pointer w-3 h-3"
                  />
                  <span>Auto Send</span>
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AICopilotSection;
