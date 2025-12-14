import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, Trash2, Search, ExternalLink, Mic, MicOff, Copy, Check, Zap, Lightbulb, ArrowRight, BrainCircuit, RefreshCw, Download, Volume2, VolumeX, FileText, List, Baby, ChevronDown } from 'lucide-react';
import { ChatMessage, Article } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeArticle: Article | null;
  onClearActiveArticle: () => void;
}

const STORAGE_KEY = 'nowflowai_chat_history';

const DEFAULT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Systems online. I am NowFlowAI, your neural tech companion. I can analyze articles, cite sources, and scan the web for real-time updates. How can I assist you?',
  timestamp: Date.now()
};

const SUGGESTIONS_CONTEXT = [
  "Summarize key points",
  "What are the implications?",
  "Critique this article",
  "Compare with competitors",
  "Explain technical terms"
];

const SUGGESTIONS_GLOBAL = [
  "Tech trends this week",
  "Explain Quantum Computing",
  "Latest cybersecurity threats",
  "SpaceX recent launches",
  "AI regulation updates"
];

type ResponseMode = 'concise' | 'detailed' | 'eli5';

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  activeArticle, 
  onClearActiveArticle 
}) => {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Settings State
  const [responseMode, setResponseMode] = useState<ResponseMode>('detailed');
  const [autoRead, setAutoRead] = useState(false);

  // Initialize state from local storage if available
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('Error parsing chat history:', error);
        }
      }
    }
    return [DEFAULT_MESSAGE];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(''); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Save messages to local storage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!searchQuery) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, searchQuery, isLoading]);

  // Handle article context switch
  useEffect(() => {
    if (activeArticle) {
      setMessages(prev => [
        ...prev,
        {
          id: `ctx-${Date.now()}`,
          role: 'model',
          text: `Context loaded: **${activeArticle.title}**. \n\nI'm ready to analyze this article or cross-reference it with external data.`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [activeArticle]);

  // Cleanup speech recognition and synthesis
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Fake "Thinking" Steps
  useEffect(() => {
    if (isLoading) {
      const steps = ["Parsing intent...", "Accessing neural knowledge...", "Cross-referencing sources...", "Synthesizing response..."];
      let i = 0;
      setLoadingStep(steps[0]);
      const interval = setInterval(() => {
        i = (i + 1) % steps.length;
        setLoadingStep(steps[i]);
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const speakText = (text: string) => {
    if (!autoRead) return;
    window.speechSynthesis.cancel();
    // Strip markdown chars roughly for speech
    const cleanText = text.replace(/[*#]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    // Try to pick a natural sounding voice
    const preferred = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideInput?: string) => {
    const rawInput = overrideInput || input;
    if (!rawInput.trim() || isLoading) return;

    // Prepend instruction based on mode (invisible to user in UI, but sent to AI)
    let instructionPrefix = "";
    if (responseMode === 'concise') instructionPrefix = "(Please provide a concise, bulleted answer) ";
    if (responseMode === 'eli5') instructionPrefix = "(Explain this simply, like I am 5 years old) ";

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: rawInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSearchQuery(''); 
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(
        instructionPrefix + userMsg.text, 
        messages, 
        activeArticle 
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      speakText(responseText);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Purge neural chat memory?')) {
      setMessages([DEFAULT_MESSAGE]);
      localStorage.removeItem(STORAGE_KEY);
      setSearchQuery('');
    }
  };

  const handleExportChat = () => {
    const chatText = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nowflow-chat-${new Date().toISOString()}.txt`;
    a.click();
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  };

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Message Content Renderer ---
  const renderMessageContent = (text: string) => {
    const processInlineStyles = (str: string) => {
        // Bold: **text**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const parts = str.split(boldRegex);
        return parts.map((part, i) => {
             // Link regex
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

            // Check for Markdown Links [Title](URL) first
            if (part.match(markdownLinkRegex)) {
                 const linkParts = part.split(markdownLinkRegex);
                 return linkParts.map((lp, k) => {
                     if ((k - 1) % 3 === 0 && k + 1 < linkParts.length) {
                        return (
                            <a key={`${i}-${k}`} href={linkParts[k+1]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline break-words" onClick={(e) => e.stopPropagation()}>
                                {lp} <ExternalLink size={10} />
                            </a>
                        );
                     } else if ((k + 1) % 3 === 0) {
                         return null; // Skip URL part as it's handled above
                     }
                     return <span key={`${i}-${k}`}>{lp}</span>
                 })
            }

            if (i % 2 === 1) {
                return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
            }
            
            // Check for Raw URLs
            const urlParts = part.split(urlRegex);
            if (urlParts.length > 1) {
                return urlParts.map((up, j) => {
                    if (up.match(urlRegex)) {
                        return (
                             <a key={`${i}-${j}`} href={up} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all" onClick={(e) => e.stopPropagation()}>
                                {up} <ExternalLink size={10} className="inline ml-0.5" />
                            </a>
                        );
                    }
                    return <span key={`${i}-${j}`}>{up}</span>;
                });
            }

            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };

    // Split text into lines to handle lists and paragraphs
    const lines = text.split('\n');
    const renderedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
            renderedLines.push(<div key={i} className="h-2" />); // Spacer for empty lines
            continue;
        }

        // Bullet points
        if (line.startsWith('* ') || line.startsWith('- ')) {
            const content = line.substring(2);
            renderedLines.push(
                <div key={i} className="flex gap-2 ml-1 my-1">
                    <span className="text-indigo-500 dark:text-indigo-400 mt-1.5 text-[6px] shrink-0">●</span>
                    <span className="leading-relaxed">{processInlineStyles(content)}</span>
                </div>
            );
        } 
        // Numbered lists (simple detection)
        else if (/^\d+\.\s/.test(line)) {
            const [num, ...rest] = line.split('.');
            const content = rest.join('.').trim();
            renderedLines.push(
                <div key={i} className="flex gap-2 ml-1 my-1">
                    <span className="font-bold text-indigo-500 dark:text-indigo-400 shrink-0 min-w-[1.5em]">{num}.</span>
                    <span className="leading-relaxed">{processInlineStyles(content)}</span>
                </div>
            );
        }
        // Headers (simple # detection)
        else if (line.startsWith('### ')) {
            renderedLines.push(<h4 key={i} className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 uppercase tracking-wide">{processInlineStyles(line.substring(4))}</h4>);
        }
        else if (line.startsWith('## ')) {
            renderedLines.push(<h3 key={i} className="text-base font-bold text-slate-900 dark:text-white mt-5 mb-2">{processInlineStyles(line.substring(3))}</h3>);
        }
        // Standard Paragraph
        else {
             renderedLines.push(<p key={i} className="mb-1 leading-relaxed">{processInlineStyles(line)}</p>);
        }
    }

    return renderedLines;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300 font-sans selection:bg-indigo-500/30 h-[100dvh] touch-manipulation">
        
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent dark:from-slate-900/50 dark:to-transparent pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

        {/* --- HEADER --- */}
        <div className="relative z-10 shrink-0 px-4 md:px-6 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[padding-top:env(safe-area-inset-top)]:pt-[max(1rem,env(safe-area-inset-top))]">
            
            {/* Branding & Status */}
            <div className="flex items-center gap-3">
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center 
                    bg-gradient-to-tr from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/20
                    ${isLoading ? 'animate-pulse' : ''}
                `}>
                     {isLoading ? <RefreshCw className="text-white animate-spin" size={20} /> : <BrainCircuit className="text-white" size={20} />}
                </div>
                
                <div className="flex flex-col">
                    <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        NowFlow AI
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">v2.5</span>
                    </h2>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isLoading ? loadingStep : "Online & Ready"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
                <button 
                    onClick={() => setAutoRead(!autoRead)} 
                    className={`p-2 rounded-full transition-all ${autoRead ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    title={autoRead ? "Mute" : "Read Aloud"}
                >
                    {autoRead ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
                
                <button 
                    onClick={handleClearHistory}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                    title="Clear History"
                >
                    <Trash2 size={18} />
                </button>

                <button 
                    onClick={onClose}
                    className="ml-2 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full transition-all"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>
        </div>

        {/* --- CONTEXT BAR (Active Article) --- */}
        {activeArticle && (
             <div className="shrink-0 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800/30 px-4 py-2 flex items-center justify-between backdrop-blur-sm animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <Sparkles size={14} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                        Using context: <span className="font-bold">{activeArticle.title}</span>
                    </span>
                </div>
                <button 
                    onClick={onClearActiveArticle}
                    className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Clear Context"
                >
                    <X size={14} />
                </button>
            </div>
        )}

        {/* --- MESSAGES --- */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide overscroll-y-contain">
            <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Time Divider */}
                <div className="flex justify-center mb-6">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                        {new Date().toLocaleDateString()}
                    </span>
                </div>

                {filteredMessages.map((msg, index) => {
                    const isUser = msg.role === 'user';
                    const isLast = index === filteredMessages.length - 1;
                    
                    return (
                    <div 
                        key={msg.id} 
                        className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        {/* Avatar */}
                        <div className={`
                            shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm border
                            ${isUser 
                                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-emerald-500'}
                        `}>
                            {isUser ? <User size={16} /> : <Bot size={16} />}
                        </div>

                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    {isUser ? 'You' : 'NowFlow AI'}
                                </span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>

                            <div className={`
                                relative p-4 text-[15px] leading-relaxed shadow-sm
                                ${isUser 
                                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-indigo-500/20' 
                                    : 'bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm'}
                            `}>
                                <div className="whitespace-pre-wrap break-words">
                                    {isUser ? msg.text : renderMessageContent(msg.text)}
                                </div>

                                {/* Hover Actions */}
                                <div className={`
                                    absolute ${isUser ? '-left-10' : '-right-10'} top-2 
                                    opacity-0 group-hover:opacity-100 transition-opacity
                                    hidden sm:flex flex-col gap-1
                                `}>
                                    <button 
                                        onClick={() => handleCopyMessage(msg.text, msg.id)}
                                        className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                        title="Copy"
                                    >
                                        {copiedId === msg.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}

                {isLoading && (
                    <div className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                         <div className="shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-500 shadow-sm">
                            <Bot size={16} />
                         </div>
                         <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-3">
                             <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                             </div>
                             <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">{loadingStep}</span>
                         </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>

        {/* --- FOOTER INPUT --- */}
        <div className="shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 z-20 pb-safe">
            <div className="max-w-3xl mx-auto p-3 md:p-4 space-y-3">
                
                {/* Scrollable Suggestions */}
                {!isLoading && (
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                        {(activeArticle ? SUGGESTIONS_CONTEXT : SUGGESTIONS_GLOBAL).map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(suggestion)}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 group whitespace-nowrap shadow-sm"
                            >
                                <Sparkles size={10} className="text-amber-500" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Input Area */}
                <div className="relative group rounded-3xl shadow-lg dark:shadow-none transition-shadow duration-300">
                    {/* Focus Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-3xl opacity-0 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
                    
                    <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-2 pr-2">
                        
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={isListening ? "Listening..." : "Ask anything..."}
                            className={`
                                flex-1 bg-transparent border-none px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 
                                focus:ring-0 resize-none max-h-32 min-h-[48px] text-[15px] leading-relaxed scrollbar-hide
                                ${isListening ? 'animate-pulse text-indigo-600 dark:text-indigo-400 placeholder-indigo-400' : ''}
                            `}
                            rows={1}
                        />

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 pb-1">
                             
                             {/* Mode Toggle */}
                             <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 mr-1">
                                <button onClick={() => setResponseMode('concise')} className={`p-1.5 rounded-full transition-all ${responseMode === 'concise' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Concise">
                                    <List size={14} />
                                </button>
                                <button onClick={() => setResponseMode('detailed')} className={`p-1.5 rounded-full transition-all ${responseMode === 'detailed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Detailed">
                                    <FileText size={14} />
                                </button>
                             </div>

                             <button
                                onClick={toggleListening}
                                className={`p-2.5 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Voice Input"
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>

                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`
                                    p-2.5 rounded-full transition-all flex items-center justify-center
                                    ${input.trim() && !isLoading 
                                        ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105 active:scale-95' 
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'}
                                `}
                            >
                                {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <ArrowRight size={18} strokeWidth={2.5} />}
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                     <BrainCircuit size={10} />
                     <span>Powered by Gemini 2.5 Flash</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatPanel;