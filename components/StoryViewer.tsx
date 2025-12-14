import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Pause, Play, MoreHorizontal } from 'lucide-react';
import { Article } from '../types';

interface StoryViewerProps {
  articles: Article[];
  onClose: () => void;
  onViewArticle: (article: Article) => void;
}

const STORY_DURATION = 15000; // 15 seconds per story

const StoryViewer: React.FC<StoryViewerProps> = ({ articles, onClose, onViewArticle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Refs for timing
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Swipe State
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number, y: number } | null>(null);
  const minSwipeDistance = 50;

  const currentArticle = articles[currentIndex];

  // Reset timer when slide changes
  useEffect(() => {
    setProgress(0);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
  }, [currentIndex]);

  // Main Timer Loop
  useEffect(() => {
    const animate = () => {
      if (isPaused) {
        // Update start time to account for the pause duration so progress doesn't jump
        startTimeRef.current = Date.now() - (progress / 100) * STORY_DURATION;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const newProgress = Math.min((elapsed / STORY_DURATION) * 100, 100);

      if (newProgress >= 100) {
        // Advance to next story
        if (currentIndex < articles.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          onClose(); // Finished all stories
        }
      } else {
        setProgress(newProgress);
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentIndex, isPaused, articles.length, onClose, progress]);

  const handlePrev = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (currentIndex < articles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  // Touch Handlers for Swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({ 
        x: e.targetTouches[0].clientX, 
        y: e.targetTouches[0].clientY 
    });
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({ 
        x: e.targetTouches[0].clientX, 
        y: e.targetTouches[0].clientY 
    });
  };

  const onTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    
    // Check if swipe is predominantly horizontal
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);
    const isSwipe = Math.abs(distanceX) > minSwipeDistance;

    if (isHorizontal && isSwipe) {
        if (distanceX > 0) {
            handleNext(); // Swipe Left (Next)
        } else {
            handlePrev(); // Swipe Right (Prev)
        }
    }
    
    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (!currentArticle) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-300">
      
      {/* --- Top Progress Bars --- */}
      <div className="absolute top-4 left-2 right-2 flex gap-1.5 z-40">
        {articles.map((story, idx) => (
          <div 
            key={idx} 
            className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden backdrop-blur-sm group/progress relative"
            title={story.title}
          >
            <div
              className={`h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-0 ease-linear ${
                idx < currentIndex ? 'w-full' : idx === currentIndex ? '' : 'w-0'
              }`}
              style={{ width: idx === currentIndex ? `${progress}%` : undefined }}
            />
          </div>
        ))}
      </div>

      {/* --- Header Info --- */}
      <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5">
             <img
               src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentArticle.source)}&background=random&color=fff`}
               className="w-full h-full rounded-full object-cover"
               alt={currentArticle.source}
             />
           </div>
           <div className="flex flex-col drop-shadow-md">
             <span className="text-sm font-bold text-white leading-none mb-0.5">{currentArticle.source}</span>
             <span className="text-[10px] font-medium text-white/80">{new Date(currentArticle.publishedAt).toLocaleDateString()}</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
                className="p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-white/10"
                title={isPaused ? "Resume" : "Pause"}
            >
                {isPaused ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
            </button>
            <button 
                onClick={onClose} 
                className="p-2 bg-black/20 backdrop-blur-md rounded-full hover:bg-white/10"
                title="Close"
            >
                <X size={24} />
            </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div
        className="flex-1 relative w-full h-full bg-slate-900"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
            <img
            src={currentArticle.imageUrl}
            alt={currentArticle.title}
            className={`w-full h-full object-cover transition-transform duration-[20s] ease-linear ${isPaused ? '' : 'scale-110'}`}
            />
            {/* Gradients for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/60 to-transparent" />
        </div>

        {/* Tap Zones for Navigation */}
        <div className="absolute inset-0 flex z-20">
            <div className="w-1/4 h-full" onClick={handlePrev} title="Previous Story"></div>
            <div className="w-2/4 h-full" title="Hold to Pause"></div> {/* Center taps pass through to pause */}
            <div className="w-1/4 h-full" onClick={handleNext} title="Next Story"></div>
        </div>

        {/* --- Bottom Overlay --- */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 z-30 flex flex-col gap-4 pointer-events-none">
            <div className="pointer-events-auto animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-blue-900/50">
                        {currentArticle.category}
                    </span>
                    {currentArticle.whyItMatters && (
                        <span className="inline-block px-3 py-1 bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-purple-900/50">
                            Breaking
                        </span>
                    )}
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3 text-white drop-shadow-2xl">
                    {currentArticle.title}
                </h1>
                
                <p className="text-sm md:text-base text-white/90 font-medium leading-relaxed line-clamp-3 mb-6 drop-shadow-md border-l-2 border-white/50 pl-3">
                    {currentArticle.summary}
                </p>

                <button
                    onClick={(e) => { e.stopPropagation(); onViewArticle(currentArticle); }}
                    className="w-full bg-white/10 backdrop-blur-xl border border-white/30 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/20 transition-all active:scale-95 group"
                    title={`Read full article: ${currentArticle.title}`}
                >
                    Read Full Story 
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;