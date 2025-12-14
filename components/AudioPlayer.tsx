import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, X, MessageCircle, Send, MoreHorizontal, Volume2, ChevronDown, Share2, Sparkles, UserPlus, Disc, ArrowLeft, Music2 } from 'lucide-react';
import { Article } from '../types';

interface AudioPlayerProps {
  playlist: Article[];
  currentIndex: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onShare: (article: Article, mode: 'view' | 'audio') => void;
  onAskAI: (article: Article) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playlist,
  currentIndex,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  onClose,
  onIndexChange,
  onShare,
  onAskAI
}) => {
  const currentArticle = playlist[currentIndex];
  
  // TTS State
  const [sentences, setSentences] = useState<string[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  
  // Progress State
  const [sentenceProgress, setSentenceProgress] = useState(0); // 0 to 1
  const durationRef = useRef(1000); // Estimated duration of current sentence in ms
  const animationFrameRef = useRef<number>(0);
  
  // Refs
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synth = window.speechSynthesis;
  const activeSentenceRef = useRef<HTMLSpanElement>(null);
  
  // UI State
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Auto-scroll to active sentence
  useEffect(() => {
    if (activeSentenceRef.current) {
        activeSentenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSentenceIndex]);

  // Strict Cleanup on Unmount
  useEffect(() => {
    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.speechSynthesis.cancel();
    };
  }, []);

  // Helper to split text
  const prepareText = (article: Article) => {
    const parts = [];
    parts.push(`${article.title}`); 
    if (article.whyItMatters) parts.push(`Why it matters: ${article.whyItMatters}`);
    parts.push(`Quick Insight: ${article.summary}`);
    if (article.keyTakeaways && article.keyTakeaways.length > 0) {
        parts.push(`Key Takeaways: ${article.keyTakeaways.join('. ')}`);
    }
    const fullText = parts.join('. ');
    const chunks = fullText.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [fullText];
    return chunks.map(s => s.trim()).filter(s => s.length > 0);
  };

  // 1. Initialize Article & Sentences
  useEffect(() => {
    if (currentArticle) {
        synth.cancel();
        const chunks = prepareText(currentArticle);
        setSentences(chunks);
        setCurrentSentenceIndex(0);
        setSentenceProgress(0);
    }
  }, [currentArticle]);

  // 2. Queue & Speak Current Sentence
  useEffect(() => {
    if (sentences.length === 0) return;

    // Check if finished
    if (currentSentenceIndex >= sentences.length) {
         // Brief pause before next article
        const timer = setTimeout(() => {
            onNext();
        }, 500);
        return () => clearTimeout(timer);
    }

    const text = sentences[currentSentenceIndex];
    if (!text) {
        setCurrentSentenceIndex(prev => prev + 1);
        return;
    }

    // Estimate duration: ~70ms per character (approx 14 chars/sec or ~150wpm)
    // Minimum 1 second duration
    durationRef.current = Math.max(text.length * 70, 1000);
    setSentenceProgress(0);

    // Cancel previous
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                           voices.find(v => v.name.includes('Samantha')) || 
                           voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    
    utterance.onend = () => {
       setCurrentSentenceIndex(prev => prev + 1);
       setSentenceProgress(0);
    };

    utterance.onerror = (e) => {
        // 'interrupted' usually means we cancelled it manually (e.g. skip), so we ignore
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
            setCurrentSentenceIndex(prev => prev + 1);
        }
    };

    synth.speak(utterance);

    // If we are currently paused state-wise, pause immediately
    if (!isPlaying) {
        synth.pause();
    }

  }, [currentSentenceIndex, sentences, onNext]);

  // 3. Handle Play/Pause State Changes
  useEffect(() => {
    if (isPlaying) {
        synth.resume();
    } else {
        synth.pause();
    }
  }, [isPlaying]);

  // 4. Continuous Progress Animation
  useEffect(() => {
    const animate = () => {
        if (isPlaying) {
            setSentenceProgress(prev => {
                // Increment based on assumed 60fps (16.6ms per frame)
                const step = 16.6 / durationRef.current;
                // Cap at 1 (100%) - wait for onend event to reset
                return Math.min(prev + step, 1);
            });
        }
        animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, currentSentenceIndex]); 

  // 5. Broadcast Total Progress (Accurate Character-Weighted)
  useEffect(() => {
      if (!currentArticle || sentences.length === 0) return;
      
      const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;
      const charsSoFar = sentences.slice(0, currentSentenceIndex).reduce((acc, s) => acc + s.length, 0);
      const currentChars = sentences[currentSentenceIndex]?.length || 0;
      
      const currentAdded = currentChars * sentenceProgress;
      const total = Math.min(((charsSoFar + currentAdded) / totalChars) * 100, 100);

      // Dispatch Custom Event for decoupled progress updates
      const event = new CustomEvent('nowflow-audio-progress', { 
          detail: { id: currentArticle.id, progress: total } 
      });
      window.dispatchEvent(event);
      
  }, [sentenceProgress, currentSentenceIndex, sentences, currentArticle]);


  // Keyboard & Mouse Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') onPrev();
      if (e.key === 'ArrowDown') onNext();
      if (e.key === ' ') {
          e.preventDefault(); 
          onPlayPause();
      }
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onPlayPause, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientY);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (touchStart === null) return;
      const touchEnd = e.changedTouches[0].clientY;
      const diff = touchStart - touchEnd;

      if (Math.abs(diff) > 50) { 
          if (diff > 0) onNext(); 
          else onPrev(); 
      }
      setTouchStart(null);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
      // Prevent triggering if clicking buttons
      if ((e.target as HTMLElement).closest('button')) return;
      onPlayPause();
  };

  const handleShareClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onShare(currentArticle, 'audio');
  };

  const handleAskAIClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onAskAI(currentArticle);
  };

  if (!currentArticle) return null;

  // Calculate Accurate Global Progress for Player UI
  const totalChars = sentences.reduce((acc, s) => acc + s.length, 0) || 1;
  const charsSoFar = sentences.slice(0, currentSentenceIndex).reduce((acc, s) => acc + s.length, 0);
  const currentChars = sentences[currentSentenceIndex]?.length || 0;
  const currentAdded = currentChars * sentenceProgress;
  const totalProgress = Math.min(((charsSoFar + currentAdded) / totalChars) * 100, 100);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentArticle.source)}&background=random&color=fff&size=128`;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col animate-in fade-in duration-300 font-sans select-none">
        
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
             <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors pointer-events-auto">
                 <ArrowLeft size={28} className="text-white drop-shadow-md" />
             </button>
             <h2 className="font-bold text-lg text-white drop-shadow-md tracking-wide">Briefing</h2>
             <div className="w-10"></div>
        </div>

        {/* Main Content */}
        <div 
            className="relative flex-1 w-full h-full overflow-hidden bg-slate-900 cursor-pointer"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={handleContainerClick}
        >
            {/* Full Screen Media */}
             <div className="absolute inset-0">
                <img 
                    src={currentArticle.imageUrl} 
                    alt={currentArticle.title}
                    className="w-full h-full object-cover opacity-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent bottom-0 h-1/2" />
            </div>

            {/* Play Pause Overlay (Animation) */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md p-6 rounded-full border border-white/10 animate-in zoom-in duration-200">
                        <Play size={40} fill="white" className="ml-2 text-white" />
                    </div>
                </div>
            )}

            {/* Right Action Bar */}
            <div className="absolute bottom-8 right-2 z-40 flex flex-col items-center gap-5 w-[60px]">
                 {/* ASK AI BUTTON */}
                 <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto" onClick={handleAskAIClick}>
                    <div className="p-2 transition-transform active:scale-90 group-hover:scale-110">
                        <MessageCircle size={30} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-semibold drop-shadow-md tracking-tight">Ask AI</span>
                 </div>
                 
                 {/* SHARE BUTTON */}
                 <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto" onClick={handleShareClick}>
                    <div className="p-2 transition-transform active:scale-90 group-hover:scale-110">
                        <Send size={30} className="text-white drop-shadow-lg -rotate-45 mb-1" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-semibold drop-shadow-md tracking-tight">Share</span>
                 </div>
                 
                 <div className="mt-4 relative w-12 h-12 flex items-center justify-center pointer-events-auto">
                    <div className={`w-10 h-10 rounded-full border-[3px] border-slate-800 bg-slate-900 overflow-hidden ${isPlaying ? 'animate-[spin_5s_linear_infinite]' : ''}`}>
                         <img src={avatarUrl} alt="source" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-1 bg-black rounded-full">
                       <Music2 size={10} className="text-white" />
                    </div>
                 </div>
            </div>

            {/* Bottom Info Area */}
            <div className="absolute bottom-4 left-3 right-20 z-40 flex flex-col gap-3 text-left pointer-events-none w-[75%] md:w-[80%]">
                 {/* User / Source Profile */}
                 <div className="flex items-center gap-2 pointer-events-auto mb-1">
                     <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden shadow-sm bg-black">
                         <img src={avatarUrl} alt={currentArticle.source} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[15px] drop-shadow-md leading-tight">{currentArticle.source.replace(/\s/g, '').toLowerCase()}</span>
                        <div className="w-1 h-1 rounded-full bg-white/60"></div>
                        <button className="border border-white/50 text-white font-semibold text-[12px] px-2.5 py-0.5 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm">
                            Follow
                        </button>
                     </div>
                 </div>

                 {/* Description / Text - Scrollable */}
                 <div className="pointer-events-auto w-full">
                    <div className="max-h-[30vh] overflow-y-auto pr-2 scrollbar-hide">
                         <div className="text-sm text-white/90 leading-relaxed drop-shadow-md font-normal whitespace-pre-wrap">
                            {sentences.map((sentence, index) => (
                                <span 
                                    key={index} 
                                    ref={index === currentSentenceIndex ? activeSentenceRef : null}
                                    className={`transition-all duration-300 ${
                                        index === currentSentenceIndex 
                                            ? 'bg-white/20 text-white font-bold px-1 rounded shadow-sm' 
                                            : 'text-white/70'
                                    }`}
                                >
                                    {sentence}{" "}
                                </span>
                            ))}
                        </div>
                    </div>
                 </div>

                 {/* Audio Marquee */}
                 <div className="flex items-center gap-2 mt-1 pointer-events-auto max-w-[90%] overflow-hidden">
                     <div className="px-1 shrink-0">
                         <Music2 size={12} className="text-white" />
                     </div>
                     <div className="whitespace-nowrap overflow-hidden w-full">
                        <div className="inline-block animate-marquee text-[13px] text-white font-medium pl-2">
                            {currentArticle.source} Briefing • NowFlow AI • {currentArticle.category} • {currentArticle.source} Briefing •
                        </div>
                     </div>
                 </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-50">
                <div 
                    className="h-full bg-white transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                    style={{ width: `${totalProgress}%` }} 
                />
            </div>
        </div>
    </div>
  );
};

export default AudioPlayer;