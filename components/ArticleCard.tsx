import React, { useState, useEffect, useRef } from 'react';
import { Article, ArticleCategory } from '../types';
import { MessageCircle, Bookmark, Sparkles, Share2, Volume2, Square, Link, Check, MoreHorizontal, Heart } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onAskAI: (article: Article) => void;
  onView: (article: Article) => void;
  onShare: (article: Article, mode?: 'view' | 'audio') => void;
  isBookmarked: boolean;
  onToggleBookmark: (article: Article) => void;
  isPlaying?: boolean;
}

const CATEGORY_FALLBACKS: Record<string, string> = {
  [ArticleCategory.AI]: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
  'Default': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'
};

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onAskAI, onView, onShare, isBookmarked, onToggleBookmark, isPlaying }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  
  // Interaction States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showBookmarkAnim, setShowBookmarkAnim] = useState(false);
  
  // Audio Progress - Ref based for performance
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [article.id, article.imageUrl]);

  // Audio Progress Listener
  useEffect(() => {
    if (!isPlaying) {
        if (progressBarRef.current) progressBarRef.current.style.width = '0%';
        return;
    }

    const handleProgress = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.id === article.id) {
            if (progressBarRef.current) {
                progressBarRef.current.style.width = `${customEvent.detail.progress}%`;
            }
        }
    };

    window.addEventListener('nowflow-audio-progress', handleProgress);
    return () => window.removeEventListener('nowflow-audio-progress', handleProgress);
  }, [isPlaying, article.id]);

  // Generate Low Res URL for placeholder
  const getLowResUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('images.unsplash.com')) {
       if (url.includes('&w=')) {
          return url.replace(/&w=\d+/, '&w=50').replace(/&q=\d+/, '&q=30');
       }
       return `${url}&w=50&q=30`;
    }
    return null;
  };
  
  const lowResSrc = getLowResUrl(article.imageUrl);

  // Cleanup speech
  useEffect(() => {
    return () => {
      if (isReading) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isReading]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!hasError) {
          const target = e.target as HTMLImageElement;
          target.src = CATEGORY_FALLBACKS['Default'];
          setHasError(true);
      }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleReadAloud = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReading) {
        window.speechSynthesis.cancel();
        setIsReading(false);
        return;
    }
    window.speechSynthesis.cancel();
    const textParts = [
        article.title,
        `By ${article.source}`,
        `Summary: ${article.summary}`,
    ];
    if (article.keyTakeaways && article.keyTakeaways.length > 0) {
        textParts.push(`Key points: ${article.keyTakeaways.join('. ')}`);
    }
    const utterance = new SpeechSynthesisUtterance(textParts.join('. '));
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showCopied) return;
    try {
        await navigator.clipboard.writeText(article.url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy link', err);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleBookmark(article);
      if (!isBookmarked) {
          setShowBookmarkAnim(true);
          setTimeout(() => setShowBookmarkAnim(false), 1000);
      }
  };

  const timeAgo = (dateStr: string) => {
      const diff = Date.now() - new Date(dateStr).getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours < 1) return 'Just now';
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(article.source)}&background=random&color=fff&size=64`;

  return (
    <div className="group/container relative w-full mb-6 mx-auto max-w-xl md:max-w-2xl">
        
        {/* Card Main Body */}
        <article 
            className={`
                relative z-10 flex flex-col
                bg-white dark:bg-zinc-900 
                border-b border-zinc-100 dark:border-zinc-800 md:border md:rounded-[2rem] md:shadow-sm
                transition-all duration-300 ease-out overflow-hidden
            `}
        >
            
            {/* 1. Modern Header (Avatar + Meta) */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onView(article)}>
                    <div className="relative shrink-0">
                        <img 
                            src={avatarUrl} 
                            alt={article.source} 
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-100 dark:ring-zinc-800" 
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 transition-colors">
                                {article.source}
                            </span>
                            <span className="text-[10px] text-zinc-400">•</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Follow</span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                             {article.author || article.category} • {timeAgo(article.publishedAt)}
                        </span>
                    </div>
                </div>
                
                <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                     <MoreHorizontal size={20} />
                </button>
            </div>

            {/* 2. Media - Edge-to-Edge Image */}
            <div 
                className={`
                    relative w-full bg-zinc-100 dark:bg-zinc-800 cursor-pointer group/image overflow-hidden
                    aspect-[16/10]
                `}
                onClick={() => onView(article)}
            >
                {/* Image */}
                <div className="w-full h-full relative">
                    <img 
                        src={article.imageUrl} 
                        loading="lazy"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        alt={article.title}
                        className={`
                            w-full h-full object-cover relative z-20 
                            transition-all duration-700 ease-in-out group-hover/image:scale-[1.02]
                            ${isLoaded ? 'opacity-100 blur-0' : 'opacity-0'}
                        `}
                    />
                    {!isLoaded && (
                        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse z-10" />
                    )}
                    {lowResSrc && !isLoaded && (
                         <img src={lowResSrc} alt="" className="absolute inset-0 w-full h-full object-cover z-10 blur-xl scale-110 pointer-events-none" />
                    )}
                </div>

                {/* Audio Progress Bar */}
                {isPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 z-50 h-1 bg-black/20 backdrop-blur-sm">
                        <div 
                            ref={progressBarRef}
                            className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-none"
                            style={{ width: '0%' }}
                        />
                    </div>
                )}

                {/* Quick Look Overlay */}
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-40 opacity-0 group-hover/container:opacity-100 transition-all duration-300 ease-out flex flex-col justify-center px-6 py-4 pointer-events-none delay-75">
                    <div className="shrink-0 flex items-center gap-2 mb-3 pb-2 border-b border-white/10 translate-y-[-4px] opacity-0 group-hover/container:translate-y-0 group-hover/container:opacity-100 transition-all duration-500 delay-100">
                        <Sparkles size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Quick Look</span>
                    </div>
                    
                    <div className="flex flex-col gap-2.5 translate-y-2 opacity-0 group-hover/container:translate-y-0 group-hover/container:opacity-100 transition-all duration-500 delay-150">
                        {(() => {
                            let points = article.keyTakeaways && article.keyTakeaways.length > 0 
                                ? article.keyTakeaways 
                                : article.summary.split('. ').filter(s => s.trim().length > 10);
                            
                            if (points.length === 0) points = [article.summary];
                            const displayPoints = points.slice(0, 3); 

                            return displayPoints.map((point, i) => (
                                <div key={i} className="flex gap-3 items-start group/point">
                                    <div className="mt-[0.35rem] w-1 h-1 rounded-full bg-indigo-500 shrink-0 shadow-[0_0_4px_rgba(99,102,241,0.8)]"></div>
                                    <p className="text-slate-300 text-[11px] sm:text-xs font-medium leading-relaxed line-clamp-2">
                                        {point.replace(/\.$/, '')}
                                    </p>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors duration-300 z-20 pointer-events-none group-hover/container:opacity-0"></div>

                {/* Bookmark Heart Animation */}
                {showBookmarkAnim && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                        <Bookmark size={80} className="text-white fill-white drop-shadow-2xl animate-like-heart" />
                    </div>
                )}
            </div>

            {/* 3. Social Action Bar - Minimalist */}
            <div className="px-3 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleBookmarkClick}
                        className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all active:scale-95 group"
                    >
                         {/* Using Bookmark as 'Like/Save' equivalent */}
                        <Heart 
                            size={24} 
                            className={`transition-colors ${isBookmarked ? 'fill-red-500 text-red-500' : 'text-zinc-800 dark:text-zinc-200 group-hover:text-red-500'}`} 
                            strokeWidth={isBookmarked ? 0 : 2}
                        />
                    </button>
                    
                    <button onClick={() => onAskAI(article)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all active:scale-95 group">
                        <MessageCircle size={24} className="text-zinc-800 dark:text-zinc-200 group-hover:text-blue-500 transition-colors -rotate-12" strokeWidth={2} />
                    </button>
                    
                    <button onClick={() => onShare(article)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all active:scale-95 group">
                        <Share2 size={24} className="text-zinc-800 dark:text-zinc-200 group-hover:text-green-500 transition-colors" strokeWidth={2} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopyLink} 
                        className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        {showCopied ? <Check size={20} className="text-green-500" /> : <Link size={20} />}
                    </button>
                    
                    <button 
                        onClick={handleReadAloud}
                        className={`
                            p-2 rounded-full transition-all active:scale-95
                            ${isReading ? 'text-blue-600 animate-pulse' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}
                        `}
                    >
                        {isReading ? <Square size={18} fill="currentColor" /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* 4. Text Content - Social Style */}
            <div className="px-5 pb-6 pt-1">
                {/* Title */}
                <h2 
                    className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight mb-2 tracking-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => onView(article)}
                >
                    {article.title}
                </h2>

                {/* Summary */}
                <div 
                    className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <span className={isExpanded ? '' : 'line-clamp-2'}>
                        {article.summary}
                    </span>
                    
                    {!isExpanded && (
                        <span className="inline-block ml-1 text-sm font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                            more
                        </span>
                    )}

                    {isExpanded && article.keyTakeaways && (
                        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 animate-in fade-in">
                            <ul className="space-y-2">
                                {article.keyTakeaways.slice(0,3).map((pt, i) => (
                                    <li key={i} className="text-xs text-zinc-500 dark:text-zinc-500 pl-3 border-l-2 border-blue-500/30">
                                        {pt}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </article>
    </div>
  );
};

export default ArticleCard;