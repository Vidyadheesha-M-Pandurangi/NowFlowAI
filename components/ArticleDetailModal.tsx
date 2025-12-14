import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, ExternalLink, MessageSquareText, Tag, Check, Bookmark, User, Lightbulb, Sparkles, TrendingUp, Volume2, Square, Share2 } from 'lucide-react';
import { Article } from '../types';

interface ArticleDetailModalProps {
  article: Article;
  onClose: () => void;
  onAskAI: (article: Article) => void;
  onShare: (article: Article, mode?: 'view' | 'audio') => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: Article) => void;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose, onAskAI, onShare, isBookmarked, onToggleBookmark }) => {
  const [isReading, setIsReading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Handle Scroll Progress & Header Minimization
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const totalScroll = scrollHeight - clientHeight;
        const currentProgress = totalScroll > 0 ? (scrollTop / totalScroll) * 100 : 0;
        setScrollProgress(currentProgress);
        
        // Trigger minimize animation after 60px of scroll for a deliberate effect
        setIsScrolled(scrollTop > 60);
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleAskClick = () => {
    onAskAI(article);
    onClose();
  };

  const handleSpeak = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `${article.title}. AI Insight: ${article.summary}. Why it matters: ${article.whyItMatters || ''}. ${article.content}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    // Attempt to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-slate-950 sm:rounded-3xl shadow-2xl w-full max-w-3xl h-[100dvh] sm:h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-white/10">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-800 z-50">
           <div 
             className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-150 ease-out" 
             style={{ width: `${scrollProgress}%` }} 
           />
        </div>

        {/* Dynamic Header with Scroll Animation */}
        <div className={`
            relative shrink-0 w-full overflow-hidden bg-slate-900 group
            transition-[height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            ${isScrolled ? 'h-16 sm:h-20 shadow-xl z-40' : 'h-[45vh] sm:h-[50vh]'}
        `}>
           {/* Background Image Layer */}
           <div className={`absolute inset-0 transition-opacity duration-700 ${isScrolled ? 'opacity-0' : 'opacity-60'}`}>
              <img 
                src={article.imageUrl} 
                alt="" 
                className={`w-full h-full object-cover transition-transform duration-700 ${isScrolled ? 'scale-105' : 'scale-100'}`}
              />
           </div>
           
           {/* Gradient Overlay */}
           <div className={`absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-950/90 transition-opacity duration-500 ${isScrolled ? 'opacity-0' : 'opacity-100'}`} />
           
           {/* Solid Background for Minimized State */}
           <div className={`absolute inset-0 bg-slate-900/95 backdrop-blur-md transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />

           {/* Close Button */}
           <button 
            onClick={onClose}
            className={`absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all border border-white/10 active:scale-95`}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

           {/* Header Content */}
           <div className={`
               absolute bottom-0 left-0 right-0 px-6 flex flex-col justify-end
               transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
               ${isScrolled ? 'pb-3 translate-y-0' : 'pb-8 translate-y-0'}
           `}>
              
              {/* Badges/Meta */}
              <div className={`
                  flex items-center gap-3 overflow-hidden transition-all duration-500 ease-in-out origin-bottom-left
                  ${isScrolled ? 'h-0 opacity-0 scale-90 mb-0' : 'h-8 opacity-100 scale-100 mb-3'}
              `}>
                 <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold text-white bg-blue-600/80 backdrop-blur-md rounded-full shadow-lg border border-blue-400/30 uppercase tracking-wide">
                    {article.category}
                 </span>
                 <span className="flex items-center text-xs font-medium text-slate-300/90 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    <Calendar size={12} className="mr-1.5" />
                    {formattedDate}
                 </span>
              </div>

              {/* Title - Smoothly scales down when minimized */}
              <h1 className={`
                  font-extrabold text-white leading-tight tracking-tight drop-shadow-lg
                  transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] origin-left
                  ${isScrolled ? 'text-base sm:text-lg w-[85%] truncate mb-0.5' : 'text-2xl sm:text-3xl md:text-4xl line-clamp-3'}
              `}>
                 {article.title}
              </h1>

              {/* Author/Source */}
              <div className={`
                  flex items-center gap-4 text-sm text-slate-200 overflow-hidden transition-all duration-500 ease-in-out origin-top-left
                  ${isScrolled ? 'h-0 opacity-0 mt-0' : 'h-10 opacity-100 mt-3'}
              `}>
                 <div className="flex items-center font-medium bg-black/20 pr-3 rounded-full backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-2 border border-white/10">
                         {article.author ? <User size={14} /> : <Tag size={14} />}
                    </div>
                    {article.author || article.source}
                 </div>
              </div>

              {/* AI Caption */}
              <div className={`
                  overflow-hidden transition-all duration-500 ease-in-out origin-top
                  ${isScrolled ? 'h-0 opacity-0 mt-0' : 'h-auto opacity-100 mt-4'}
              `}>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white/90 shadow-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles size={12} className="text-blue-300" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">AI Caption</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed font-sans">
                          {article.summary}
                      </p>
                  </div>
              </div>

           </div>
        </div>

        {/* Content Body */}
        <div ref={contentRef} className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 relative scrollbar-hide pb-24">
            
            <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
                
                {/* Key Takeaways */}
                {article.keyTakeaways && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Lightbulb size={14} /> Key Points
                        </h3>
                        <ul className="grid gap-3">
                            {article.keyTakeaways.map((point, idx) => (
                                <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 text-base leading-snug p-4 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                                    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {point}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Main Content */}
                <article className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                     <p className="lead text-xl text-slate-600 dark:text-slate-300 font-serif leading-relaxed italic border-l-4 border-slate-200 dark:border-slate-700 pl-4">
                        " {article.summary} "
                     </p>
                     <div className="text-slate-800 dark:text-slate-200 leading-8 space-y-4">
                        {article.content.split('\n').map((paragraph, i) => (
                             paragraph.trim() && <p key={i}>{paragraph}</p>
                        ))}
                     </div>
                </article>

                {/* Why It Matters */}
                {article.whyItMatters && (
                    <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                        <div className="absolute -right-10 -top-10 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                            <TrendingUp size={180} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-90 flex items-center gap-2">
                                <TrendingUp size={14} /> Why It Matters
                            </h3>
                            <p className="text-lg md:text-xl font-medium leading-relaxed">
                                {article.whyItMatters}
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Floating Footer Actions */}
        <div className="absolute bottom-6 left-6 right-6 z-40">
            <div className="p-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl flex flex-row gap-2">
                <button
                onClick={handleAskClick}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                <MessageSquareText size={18} />
                <span className="hidden sm:inline">Chat with AI</span>
                <span className="sm:hidden">Chat</span>
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={() => onToggleBookmark(article)}
                        className={`w-12 h-12 rounded-xl border font-bold flex items-center justify-center transition-all active:scale-95 ${
                            isBookmarked 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                            : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}
                        title="Bookmark"
                    >
                        <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                    </button>
                    <button 
                        onClick={handleSpeak}
                        className={`w-12 h-12 rounded-xl border font-bold flex items-center justify-center transition-all active:scale-95 ${
                            isReading 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 animate-pulse' 
                            : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10'
                        }`}
                        title="Read Aloud"
                    >
                        {isReading ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                    </button>
                    <button 
                        onClick={() => onShare(article)}
                        className="w-12 h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-700 dark:text-white font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Share Article"
                    >
                        <Share2 size={20} />
                    </button>
                    <button 
                        onClick={() => window.open(article.url, '_blank')}
                        className="w-12 h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-slate-700 dark:text-white font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all active:scale-95"
                        title="Read Full Source"
                    >
                        <ExternalLink size={20} />
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ArticleDetailModal;