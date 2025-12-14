import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Newspaper, MessageSquare, Search, Filter, Loader2, Bookmark, Sparkles, Cpu, ArrowUp, Menu, ChevronRight, User, Headphones, Moon, Sun, Home, Heart, Share2, MoreHorizontal, TrendingUp, Users, Zap, Compass, Hash, X, RotateCw, Calendar, ArrowDownUp, Globe, Link, CheckCircle, Clock } from 'lucide-react';
import { Article, ArticleCategory, SearchFilters } from './types';
import ArticleCard from './components/ArticleCard';
import ArticleDetailModal from './components/ArticleDetailModal';
import ChatPanel from './components/ChatPanel';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import AudioPlayer from './components/AudioPlayer';
import StoryViewer from './components/StoryViewer';
import { getRecommendations, generateAppLogo, fetchLiveNews } from './services/geminiService';

// Category Thumbnails Mapping
const CATEGORY_THUMBNAILS: Record<string, string> = {
  [ArticleCategory.AI]: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.IOT]: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.CLOUD]: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.CYBERSECURITY]: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.VLSI]: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.QUANTUM]: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.BLOCKCHAIN]: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.ROBOTICS]: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.BIOTECH]: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.SPACE]: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.CLEANTECH]: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=150&q=80',
  [ArticleCategory.TELECOM]: 'https://images.unsplash.com/photo-1512428559087-560fa5ce7d94?auto=format&fit=crop&w=150&q=80'
};

function App() {
  const [category, setCategory] = useState<ArticleCategory>(ArticleCategory.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState(''); // Input state for debounce
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeChatArticle, setActiveChatArticle] = useState<Article | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Advanced Search Filters
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    dateRange: 'any',
    sortBy: 'relevance',
    source: 'all'
  });
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'saved' | 'history' | 'profile'>('home');

  // Audio Player State
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Article[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Story Viewer State
  const [storyCategory, setStoryCategory] = useState<ArticleCategory | null>(null);
  const clickTimeoutRef = useRef<any>(null); // Using 'any' for timeout to avoid NodeJS/Browser type conflicts

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nowflowai_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Logo State
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
     if (typeof window !== 'undefined') {
       return localStorage.getItem('nowflowai_logo_tech');
     }
     return null;
  });
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  // User Profile State
  const [username, setUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nowflowai_username') || 'Guest User';
    }
    return 'Guest User';
  });

  // Bookmark State
  const [bookmarks, setBookmarks] = useState<Article[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nowflowai_bookmarks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse bookmarks", e);
        }
      }
    }
    return [];
  });

  // Read History State (Previously 'viewedIds', now storing full articles for History tab)
  const [readHistory, setReadHistory] = useState<Article[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nowflowai_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Recommendations State
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);

  // Live News & Pagination State
  const [articles, setArticles] = useState<Article[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true); // Initial load
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Pagination load
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Intersection Observer for Infinite Scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- SHARE LINK LOGIC ---
  const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
  };

  const encodeArticle = (article: Article) => {
    // Minimal data needed to reconstruct the article view
    const minData = {
      t: article.title,
      s: article.source,
      u: article.url,
      sum: article.summary,
      img: article.imageUrl,
      cat: article.category,
      pub: article.publishedAt,
      // We can also encode key takeaways if needed, but summary is usually enough for share view
    };
    return btoa(encodeURIComponent(JSON.stringify(minData)));
  };

  const decodeArticle = (str: string): Article | null => {
    try {
      const json = JSON.parse(decodeURIComponent(atob(str)));
      return {
        id: `shared-${Date.now()}`,
        title: json.t,
        source: json.s,
        url: json.u,
        summary: json.sum,
        imageUrl: json.img,
        category: json.cat,
        publishedAt: json.pub,
        content: json.sum, // Fallback content since we don't share full text
        keyTakeaways: []
      };
    } catch (e) {
      console.error("Failed to decode shared article", e);
      return null;
    }
  };

  // Handle Shared Link on Mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    const mode = params.get('mode');

    if (shareData) {
      const sharedArticle = decodeArticle(shareData);
      if (sharedArticle) {
        if (mode === 'audio') {
          // Deep Link directly to Audio Player
          setPlaylist([sharedArticle]);
          setCurrentTrackIndex(0);
          setIsPlayerOpen(true);
          setIsPlaying(true);
        } else {
          // Standard view
          setSelectedArticle(sharedArticle);
        }
        // Clean the URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleShare = async (article: Article, mode: 'view' | 'audio' = 'view') => {
      const shareCode = encodeArticle(article);
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareCode}&mode=${mode}`;
      
      const shareText = mode === 'audio' 
        ? `Listen to this briefing on NowFlowAI: ${article.title}`
        : `Check out this article on NowFlowAI: ${article.title}`;

      const shareData = {
          title: article.title,
          text: shareText,
          url: shareUrl
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.log("Error sharing", err);
          }
      } else {
          try {
            await navigator.clipboard.writeText(shareUrl);
            showToast(mode === 'audio' ? "Audio Link copied!" : "Link copied to clipboard!");
          } catch (err) {
            showToast("Failed to copy link.");
          }
      }
  };
  // ------------------------

  // Debounce Effect for Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Check for API Key on mount
  useEffect(() => {
    if (process.env.API_KEY) {
      setHasApiKey(true);
    } else {
      console.warn("API_KEY is missing from environment.");
    }
  }, []);

  // Handle Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nowflowai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nowflowai_theme', 'light');
    }
  }, [isDarkMode]);

  // Generate Logo if missing
  useEffect(() => {
    const initLogo = async () => {
      if (hasApiKey && !logoUrl && !isGeneratingLogo) {
        const saved = localStorage.getItem('nowflowai_logo_tech');
        if (saved) {
          setLogoUrl(saved);
        } else {
          setIsGeneratingLogo(true);
          const generatedLogo = await generateAppLogo();
          if (generatedLogo) {
            setLogoUrl(generatedLogo);
            localStorage.setItem('nowflowai_logo_tech', generatedLogo);
          }
          setIsGeneratingLogo(false);
        }
      }
    };
    
    initLogo();
  }, [hasApiKey, logoUrl]);

  // --- CORE NEWS FETCHING LOGIC (STALE-WHILE-REVALIDATE) ---
  
  const fetchNews = useCallback(async (targetCategory: string, targetPage: number, forceRefresh: boolean = false) => {
    // Prevent fetching if search is active (client side search)
    if (searchQuery) return;
    
    // Create a cache key that includes filter state to avoid stale cache on filter change
    const filterKey = `${searchFilters.dateRange}-${searchFilters.sortBy}-${searchFilters.source}`;
    const cacheKey = `nowflow_news_v2_${targetCategory}_${filterKey}`;

    // 1. INSTANT LOAD: Check LocalStorage first (Stale-While-Revalidate)
    if (targetPage === 1 && !forceRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setArticles(parsed);
                    setHasMore(true);
                    setIsNewsLoading(false); // IMPORTANT: Stop loading immediately so user sees content
                } else {
                    setIsNewsLoading(true);
                }
            } catch (e) {
                console.warn("Cache parse error", e);
                setIsNewsLoading(true);
            }
        } else {
            setIsNewsLoading(true);
        }
    } else if (targetPage > 1) {
        setIsLoadingMore(true);
    }

    try {
        // 2. FETCH FRESH DATA in background
        const newArticles = await fetchLiveNews(targetCategory, targetPage, searchFilters);
        
        if (newArticles.length === 0) {
            if (targetPage > 1) setHasMore(false);
        } else {
            setArticles(prev => {
                let updatedList: Article[];
                
                if (targetPage === 1) {
                    updatedList = newArticles;
                    localStorage.setItem(cacheKey, JSON.stringify(updatedList));
                } else {
                    // Infinite Scroll Append with Dedup
                    const existingTitles = new Set(prev.map(a => a.title));
                    const uniqueNew = newArticles.filter(a => !existingTitles.has(a.title));
                    updatedList = [...prev, ...uniqueNew];
                    
                    const cacheSlice = updatedList.slice(0, 50);
                    localStorage.setItem(cacheKey, JSON.stringify(cacheSlice));
                }

                return updatedList;
            });
        }
    } catch (err) {
        console.error("Failed to load news", err);
    } finally {
        setIsNewsLoading(false);
        setIsLoadingMore(false);
    }
  }, [searchQuery, searchFilters]); // Depend on filters

  // Initial Load & Category Change & Filter Change
  useEffect(() => {
      setPage(1);
      window.scrollTo({ top: 0, behavior: 'auto' });
      fetchNews(category, 1, false); 
  }, [category, fetchNews, searchFilters]); 

  // Pagination Effect
  useEffect(() => {
      // Only fetch if page incremented > 1 (page 1 handled by category effect)
      if (page > 1) {
          fetchNews(category, page, false);
      }
  }, [page, category, fetchNews]);

  // Infinite Scroll Observer
  useEffect(() => {
      const observer = new IntersectionObserver(
          entries => {
              if (entries[0].isIntersecting && hasMore && !isNewsLoading && !isLoadingMore && !searchQuery) {
                  setPage(prev => prev + 1);
              }
          },
          { threshold: 0.1, rootMargin: '100px' }
      );

      if (loadMoreRef.current) {
          observer.observe(loadMoreRef.current);
      }

      return () => observer.disconnect();
  }, [hasMore, isNewsLoading, isLoadingMore, searchQuery]);

  const handleManualRefresh = () => {
      setPage(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchNews(category, 1, true); 
  };

  const handleRegenerateLogo = () => {
      setLogoUrl(null);
      localStorage.removeItem('nowflowai_logo_tech');
  };

  // Save bookmarks
  useEffect(() => {
    localStorage.setItem('nowflowai_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Save Read History
  useEffect(() => {
    localStorage.setItem('nowflowai_history', JSON.stringify(readHistory));
  }, [readHistory]);

  // Save username
  useEffect(() => {
    localStorage.setItem('nowflowai_username', username);
  }, [username]);

  // Scroll Listener for "Back to Top"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Recommendations
  useEffect(() => {
    const generateRecs = async () => {
      if (bookmarks.length === 0 && readHistory.length === 0) return;

      const historyArticles = [
        ...bookmarks,
        ...readHistory
      ];
      
      const uniqueHistory = Array.from(new Set(historyArticles.map(a => a.id)))
        .map(id => historyArticles.find(a => a.id === id))
        .filter((a): a is Article => !!a);

      if (uniqueHistory.length > 0 && process.env.API_KEY && !isGeneratingRecs) {
        setIsGeneratingRecs(true);
        try {
          const ids = await getRecommendations(uniqueHistory, articles); // Use live articles for recs
          setRecommendedIds(ids);
        } catch (e) {
          console.error("Failed to generate recommendations", e);
        } finally {
          setIsGeneratingRecs(false);
        }
      }
    };

    const timeoutId = setTimeout(generateRecs, 5000); // Delay slightly to let articles load
    return () => clearTimeout(timeoutId);
  }, [bookmarks, readHistory, articles]); 

  // Filter Articles
  let sourceArticles: Article[] = [];
  if (activeTab === 'saved') sourceArticles = bookmarks;
  else if (activeTab === 'history') sourceArticles = readHistory;
  else sourceArticles = articles;

  const filteredArticles = sourceArticles.filter(article => {
    // 1. Category Filtering
    const matchesCategory = (activeTab === 'saved' || activeTab === 'history')
        ? (category === ArticleCategory.ALL || article.category === category)
        : true; 

    // 2. Search Query
    const matchesSearch = 
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 3. Read History Exclusion (Only for Home Tab)
    // If activeTab is 'home', exclude articles that are in readHistory
    const isAlreadyRead = activeTab === 'home' && readHistory.some(h => h.id === article.id);

    return matchesCategory && matchesSearch && !isAlreadyRead;
  });

  // Handle Category Interaction (Single vs Double Tap)
  const handleCategoryInteraction = (targetCategory: ArticleCategory) => {
    if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        setCategory(targetCategory);
    } else {
        clickTimeoutRef.current = setTimeout(() => {
            clickTimeoutRef.current = null;
            setStoryCategory(targetCategory);
        }, 250); 
    }
  };

  const handleStartBriefing = () => {
    if (isPlayerOpen && isPlaying) {
        setIsPlaying(false);
        return;
    }
    const newPlaylist = filteredArticles.slice(0, 50);
    if (newPlaylist.length === 0) return;

    setPlaylist(newPlaylist);
    setCurrentTrackIndex(0);
    setIsPlayerOpen(true);
    setIsPlaying(true);
  };

  const handleToggleBookmark = (article: Article) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.id === article.id);
      if (exists) {
        return prev.filter(b => b.id !== article.id);
      } else {
        return [...prev, article];
      }
    });
  };

  const markAsRead = (article: Article) => {
     setReadHistory(prev => {
        // Avoid duplicates, put newest at top
        const filtered = prev.filter(a => a.id !== article.id);
        return [article, ...filtered].slice(0, 100); // Limit history to 100
     });
  };

  const handleAskAI = (article: Article) => {
    setActiveChatArticle(article);
    setIsChatOpen(true);
    markAsRead(article);
  };

  const handleViewArticle = (article: Article) => {
    setSelectedArticle(article);
    markAsRead(article);
  };

  const handleClearContext = () => {
    setActiveChatArticle(null);
  };

  const handleUpdateUsername = (name: string) => {
    setUsername(name);
  };

  const handleClearBookmarks = () => {
    if (window.confirm("Are you sure you want to clear all bookmarks?")) {
      setBookmarks([]);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your reading history?")) {
      setReadHistory([]);
      setRecommendedIds([]);
    }
  };

  const handleTabChange = (tab: 'home' | 'search' | 'saved' | 'history' | 'profile') => {
      if (tab === 'profile') {
          setIsProfileOpen(true);
      } else {
          setActiveTab(tab);
          if (tab === 'home') {
            setSearchQuery('');
            setInputValue('');
          }
      }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 relative animate-in fade-in duration-500 pb-28 md:pb-0 font-sans selection:bg-blue-500/30">
      
      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 dark:bg-white/90 backdrop-blur-xl text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-5 fade-in duration-300">
              <CheckCircle size={18} className="text-emerald-500" />
              <span className="font-bold text-sm">{toastMessage}</span>
          </div>
      )}

      {/* Aurora Background Component */}
      <div className="aurora-bg" />

      {/* --- DESKTOP SIDEBAR (Floating Glass) --- */}
      <aside className="hidden md:flex flex-col fixed left-6 top-6 bottom-6 w-[72px] lg:w-64 bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 dark:border-white/5 shadow-2xl z-50 p-3 lg:p-5 transition-all">
         <div className="mb-8 px-2 lg:px-2 py-4 flex justify-center lg:justify-start">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => { setActiveTab('home'); setCategory(ArticleCategory.ALL); }}
            >
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                {logoUrl ? (
                  <img src={logoUrl} alt="NowFlowAI" className="w-full h-full object-cover" />
                ) : (
                   <Zap className="text-white w-5 h-5 fill-current" />
                )}
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white hidden lg:block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">NowFlow</span>
            </div>
         </div>
         
         <nav className="flex flex-col gap-3 flex-1">
             <button onClick={() => handleTabChange('home')} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === 'home' ? 'bg-white dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                  <Home size={24} className={`transition-colors ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 fill-blue-600/10' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} /> 
                  <span className={`hidden lg:block text-sm ${activeTab === 'home' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>For You</span>
             </button>
             <button onClick={() => handleTabChange('search')} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === 'search' ? 'bg-white dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                  <Compass size={24} className={`transition-colors ${activeTab === 'search' ? 'text-purple-600 dark:text-purple-400 fill-purple-600/10' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} /> 
                  <span className={`hidden lg:block text-sm ${activeTab === 'search' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Discover</span>
             </button>
             <button onClick={handleStartBriefing} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group hover:bg-white/40 dark:hover:bg-white/5`}>
                  <Headphones size={24} className="text-slate-500 dark:text-slate-400 group-hover:text-pink-500 transition-colors" /> 
                  <span className="hidden lg:block text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">Audio Brief</span>
             </button>
             <button onClick={() => handleTabChange('saved')} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === 'saved' ? 'bg-white dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                  <Bookmark size={24} className={`transition-colors ${activeTab === 'saved' ? 'text-green-600 dark:text-green-400 fill-green-600/10' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} /> 
                  <span className={`hidden lg:block text-sm ${activeTab === 'saved' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>Saved</span>
             </button>
             <button onClick={() => handleTabChange('history')} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all group ${activeTab === 'history' ? 'bg-white dark:bg-white/10 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                  <Clock size={24} className={`transition-colors ${activeTab === 'history' ? 'text-amber-600 dark:text-amber-400 fill-amber-600/10' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} /> 
                  <span className={`hidden lg:block text-sm ${activeTab === 'history' ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400'}`}>History</span>
             </button>
             <button onClick={() => setIsChatOpen(true)} className={`relative flex items-center gap-4 p-3.5 rounded-2xl transition-all group hover:bg-white/40 dark:hover:bg-white/5 mt-auto mb-2`}>
                  <div className="absolute top-3.5 left-8 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white dark:ring-black"></div>
                  <MessageSquare size={24} className="text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" /> 
                  <span className="hidden lg:block text-sm font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">AI Assistant</span>
             </button>
         </nav>

         <div className="flex flex-col gap-2 border-t border-slate-200/50 dark:border-white/5 pt-4">
             <button onClick={() => handleTabChange('profile')} className={`flex items-center gap-3 p-2 rounded-2xl transition-all group hover:bg-white/40 dark:hover:bg-white/5`}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-sm">
                      <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{username.charAt(0)}</span>
                      </div>
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                      <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{username}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Pro Member</span>
                  </div>
             </button>
             <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center justify-center lg:justify-start gap-4 p-3 rounded-2xl transition-all group hover:bg-white/40 dark:hover:bg-white/5 w-full"
            >
                {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-500" />}
                <span className="hidden lg:block text-xs font-medium text-slate-500 dark:text-slate-400">Theme</span>
            </button>
         </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden sticky top-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 transition-colors duration-300">
        <div className="w-full mx-auto px-4 h-16 flex items-center justify-between">
           <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => { setActiveTab('home'); setCategory(ArticleCategory.ALL); }}
            >
              <div className="relative w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                {logoUrl ? (
                  <img src={logoUrl} alt="NowFlowAI" className="w-full h-full object-cover" />
                ) : (
                   <Zap className="text-white w-4 h-4 fill-current" />
                )}
              </div>
              <span className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white">NowFlow</span>
            </div>

            <div className="flex items-center gap-3">
               <button 
                onClick={() => setIsChatOpen(true)}
                className="relative p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
               >
                 <MessageSquare className="w-6 h-6" />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse"></span>
               </button>
               <div 
                 onClick={() => setIsProfileOpen(true)}
                 className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] cursor-pointer"
               >
                  <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{username.charAt(0)}</span>
                  </div>
               </div>
            </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="flex w-full min-h-screen md:pl-[90px] lg:pl-[290px]">
        
        <div className="flex-1 flex justify-center min-w-0">
            <main className="w-full flex flex-col pt-2 md:pt-6 px-0 sm:px-6 max-w-[1200px]">
            
            {/* Spotlight Search Bar */}
            <div className="mb-8 px-4 md:px-0 mt-2 md:mt-0 relative z-30">
              <div className="relative group max-w-2xl mx-auto flex items-center gap-2">
                 {/* Search Input */}
                 <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-focus-within:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-full shadow-sm group-focus-within:ring-2 ring-blue-500/50 transition-all flex items-center">
                        <Search className="ml-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            className="block w-full px-4 py-3.5 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none rounded-full transition-all font-medium"
                            placeholder={activeTab === 'saved' ? "Search your library..." : activeTab === 'history' ? "Search your history..." : "Search topics, trends, or keywords..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        {inputValue && (
                            <button onClick={() => setInputValue('')} className="mr-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">
                                <X size={16} />
                            </button>
                        )}
                        
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <button 
                            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} 
                            className={`p-2 mr-2 rounded-full transition-all ${isFilterPanelOpen ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            title="Advanced Filters"
                        >
                            <Filter size={18} />
                        </button>
                    </div>
                 </div>

                 {/* Refresh Button */}
                 {activeTab === 'home' && (
                     <button 
                        onClick={handleManualRefresh}
                        className="p-3.5 bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all active:scale-95"
                        title="Refresh News"
                     >
                        <RotateCw size={20} className={isNewsLoading ? 'animate-spin' : ''} />
                     </button>
                 )}
              </div>

              {/* Advanced Filter Panel */}
              {isFilterPanelOpen && (
                  <div className="max-w-2xl mx-auto mt-4 p-4 md:p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-4">
                          {/* Date Range */}
                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Calendar size={12} /> Date Range</label>
                              <div className="flex flex-wrap gap-2">
                                  {['any', 'today', 'week', 'month'].map((option) => (
                                      <button 
                                          key={option}
                                          onClick={() => updateFilter('dateRange', option)}
                                          className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${searchFilters.dateRange === option ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                      >
                                          {option === 'any' ? 'Any Time' : option === 'today' ? 'Past 24h' : option === 'week' ? 'Past Week' : 'Past Month'}
                                      </button>
                                  ))}
                              </div>
                          </div>
                          
                          <div className="h-px bg-slate-200 dark:bg-slate-800" />

                          {/* Sort By */}
                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><ArrowDownUp size={12} /> Sort Order</label>
                              <div className="flex flex-wrap gap-2">
                                  {['relevance', 'newest'].map((option) => (
                                      <button 
                                          key={option}
                                          onClick={() => updateFilter('sortBy', option)}
                                          className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${searchFilters.sortBy === option ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                      >
                                          {option === 'relevance' ? 'Relevance' : 'Newest First'}
                                      </button>
                                  ))}
                              </div>
                          </div>

                           <div className="h-px bg-slate-200 dark:bg-slate-800" />

                           {/* Sources */}
                           <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Globe size={12} /> Source</label>
                                <div className="flex flex-wrap gap-2">
                                    {['all', 'TechCrunch', 'The Verge', 'Wired', 'Reuters', 'Bloomberg', 'VentureBeat'].map((source) => (
                                        <button 
                                            key={source}
                                            onClick={() => updateFilter('source', source)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${searchFilters.source === source ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            {source === 'all' ? 'All Sources' : source}
                                        </button>
                                    ))}
                                </div>
                           </div>
                      </div>
                  </div>
              )}
            </div>

            {/* Categories Rail (Instagram Style) */}
            {activeTab === 'home' && !searchQuery && (
                <div className="w-full overflow-x-auto scrollbar-hide pt-2 pb-6 -mt-2">
                    <div className="flex gap-4 px-4 md:px-0 md:justify-center min-w-max mx-auto">
                        
                        {/* "For You" / All Story */}
                        <button 
                            onClick={() => handleCategoryInteraction(ArticleCategory.ALL)}
                            className="flex flex-col items-center gap-2 group select-none transition-all duration-300"
                        >
                            <div className={`relative p-[3px] rounded-full transition-transform duration-300 ${category === ArticleCategory.ALL ? 'scale-110' : 'group-hover:scale-105'}`}>
                                {/* Gradient Ring */}
                                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 ${category === ArticleCategory.ALL ? 'animate-[spin_3s_linear_infinite] opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-500'}`}></div>
                                
                                {/* Inactive Ring */}
                                {category !== ArticleCategory.ALL && (
                                    <div className="absolute inset-0 rounded-full border-[2px] border-slate-200 dark:border-slate-800 group-hover:border-transparent transition-colors"></div>
                                )}

                                {/* Inner Content */}
                                <div className="relative w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-white dark:border-black flex items-center justify-center overflow-hidden z-10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"></div>
                                    <Sparkles 
                                        size={24} 
                                        className={`transition-colors duration-300 ${category === ArticleCategory.ALL ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500 fill-pink-500' : 'text-slate-400 dark:text-slate-500'}`} 
                                        fill={category === ArticleCategory.ALL ? "#ec4899" : "none"}
                                        strokeWidth={2}
                                    />
                                </div>
                                
                                {/* Live Badge */}
                                {category === ArticleCategory.ALL && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                                        <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm border-[2px] border-white dark:border-black leading-none">
                                            LIVE
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className={`text-[11px] font-semibold tracking-wide ${category === ArticleCategory.ALL ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>For You</span>
                        </button>

                        {/* Category Stories */}
                        {Object.values(ArticleCategory).filter(c => c !== ArticleCategory.ALL).map((cat, idx) => {
                            const isActive = category === cat;
                            return (
                                <button 
                                    key={cat}
                                    onClick={() => handleCategoryInteraction(cat)}
                                    className="flex flex-col items-center gap-2 group select-none transition-all duration-300"
                                >
                                    <div className={`relative p-[3px] rounded-full transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                                        
                                        {/* Active/Hover Gradient Ring (Instagram colors) */}
                                        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-purple-600 ${isActive ? 'animate-[spin_3s_linear_infinite] opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-500'}`}></div>
                                        
                                        {/* Default Ring */}
                                        {!isActive && (
                                            <div className="absolute inset-0 rounded-full border-[2px] border-slate-300 dark:border-slate-700 group-hover:border-transparent transition-colors"></div>
                                        )}

                                        {/* Avatar Container */}
                                        <div className="relative w-16 h-16 rounded-full border-[3px] border-white dark:border-black overflow-hidden z-10 bg-slate-200 dark:bg-slate-800">
                                            <img 
                                                src={CATEGORY_THUMBNAILS[cat]} 
                                                alt={cat} 
                                                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}
                                            />
                                            {/* Dim overlay when not active to make text pop or just style */}
                                            {isActive && <div className="absolute inset-0 bg-black/10"></div>}
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-semibold tracking-wide truncate max-w-[72px] ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {cat.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Discover Grid */}
            {activeTab === 'search' && !searchQuery && (
                <div className="p-4 md:px-0">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-pink-500" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Trending Now</h2>
                    </div>
                    {/* Placeholder for trending - in real app could fetch 'Trending' category */}
                     <div className="flex flex-col items-center justify-center py-20 bg-slate-100 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                        <Sparkles size={40} className="text-purple-400 mb-4 animate-pulse" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Discover Mode</h3>
                        <p className="text-slate-500 dark:text-slate-500 mt-2">Use the search bar to find specific topics.</p>
                     </div>
                </div>
            )}
            
            {/* History Empty State */}
            {activeTab === 'history' && !searchQuery && filteredArticles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in">
                    <div className="w-24 h-24 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center mb-6">
                        <Clock size={40} className="text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">No history yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Articles you read will appear here.</p>
                </div>
            )}

            {/* Feed */}
            {(activeTab !== 'search' || searchQuery) && (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 pb-32 px-4 md:px-0">
                    
                    {/* Skeleton Loading State (Initial) */}
                    {isNewsLoading && activeTab === 'home' && (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden h-[400px] animate-pulse">
                                <div className="h-64 bg-slate-200 dark:bg-slate-800" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                    <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded mt-4" />
                                </div>
                            </div>
                        ))
                    )}

                    {!isNewsLoading && activeTab === 'home' && filteredArticles.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                                <Bookmark size={40} className="text-slate-300 dark:text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nothing here yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">Try searching for something else or adjust your filters.</p>
                        </div>
                    )}

                    {!isNewsLoading && filteredArticles.map((article) => (
                    <ArticleCard 
                        key={article.id} 
                        article={article} 
                        onAskAI={handleAskAI}
                        onView={handleViewArticle}
                        onShare={handleShare}
                        isBookmarked={bookmarks.some(b => b.id === article.id)}
                        onToggleBookmark={handleToggleBookmark}
                        isPlaying={isPlayerOpen && playlist[currentTrackIndex]?.id === article.id}
                    />
                    ))}

                    {/* Infinite Scroll Loader & Trigger */}
                    {!isNewsLoading && activeTab === 'home' && !searchQuery && hasMore && (
                        <div ref={loadMoreRef} className="col-span-full py-8 flex flex-col items-center justify-center opacity-70">
                             {isLoadingMore ? (
                                 <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 animate-pulse">
                                     <Loader2 size={24} className="animate-spin" />
                                     <span className="text-sm font-medium">Fetching more news...</span>
                                 </div>
                             ) : (
                                 <div className="h-8"></div> // Spacer to trigger intersection
                             )}
                        </div>
                    )}

                    {/* End of Feed Message */}
                    {!hasMore && activeTab === 'home' && !searchQuery && filteredArticles.length > 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center text-center opacity-50">
                            <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                            <p className="text-sm text-slate-500 font-medium">You're all caught up</p>
                        </div>
                    )}
                    
                </div>
            )}

            </main>
        </div>

        {/* --- RIGHT SUGGESTIONS (Trending Hashtags) --- */}
        <aside className="hidden xl:block w-[320px] pl-6 pt-6 pr-6 shrink-0 sticky top-0 h-screen overflow-y-auto scrollbar-hide">
            <div className="flex flex-col gap-6">
                
                {/* Trending Topics Card */}
                <div className="p-6 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/30 dark:border-white/5 shadow-sm">
                     <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={18} className="text-slate-900 dark:text-white" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Trending Topics</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {['#AI', '#Quantum', '#SpaceX', '#Crypto', '#Robotics', '#GreenTech', '#Web3', '#Metaverse'].map(tag => (
                            <span key={tag} className="px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors">
                                {tag}
                            </span>
                        ))}
                     </div>
                </div>

                {/* Who to follow */}
                <div className="p-6 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/30 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users size={18} className="text-slate-900 dark:text-white" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Sources</h3>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {[
                            { name: 'TechCrunch', handle: '@techcrunch', avatar: 'https://ui-avatars.com/api/?name=TC&background=00dca6&color=fff' },
                            { name: 'The Verge', handle: '@verge', avatar: 'https://ui-avatars.com/api/?name=TV&background=e10098&color=fff' },
                            { name: 'Wired', handle: '@wired', avatar: 'https://ui-avatars.com/api/?name=Wi&background=000&color=fff' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <img src={item.avatar} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm group-hover:scale-105 transition-transform" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-900 dark:text-white">{item.name}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.handle}</span>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/20 transition-colors">Follow</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-[10px] text-slate-400 dark:text-slate-600 text-center font-medium">
                    © 2024 NowFlow AI • Privacy • Terms
                </div>
            </div>
        </aside>

      </div>

      {/* --- MOBILE FLOATING NAV ISLAND --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/80 dark:bg-white/90 backdrop-blur-xl border border-white/10 dark:border-black/5 rounded-full shadow-2xl z-50 h-16 md:hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="grid grid-cols-6 h-full items-center px-2">
              <button onClick={() => handleTabChange('home')} className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'home' ? 'text-white dark:text-black scale-110' : 'text-white/50 dark:text-black/40 hover:text-white dark:hover:text-black'}`}>
                  <Home size={20} strokeWidth={activeTab === 'home' ? 3 : 2} />
              </button>
              <button onClick={() => handleTabChange('search')} className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'search' ? 'text-white dark:text-black scale-110' : 'text-white/50 dark:text-black/40 hover:text-white dark:hover:text-black'}`}>
                  <Compass size={20} strokeWidth={activeTab === 'search' ? 3 : 2} />
              </button>
              
              {/* Central Action Button (Spans 2 cols visually but centered) */}
              <button onClick={handleStartBriefing} className="col-span-2 flex items-center justify-center -mt-8">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 ring-4 ring-white/10 dark:ring-black/5 transform transition-transform active:scale-90 ${isPlayerOpen && isPlaying ? 'animate-pulse' : ''}`}>
                      {isPlayerOpen && isPlaying ? (
                          <div className="flex gap-1 h-3 items-end">
                              <div className="w-0.5 bg-white animate-[bounce_1s_infinite]"></div>
                              <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.1s]"></div>
                              <div className="w-0.5 bg-white animate-[bounce_1s_infinite_0.2s]"></div>
                          </div>
                      ) : (
                          <Headphones className="text-white" size={24} />
                      )}
                  </div>
              </button>

              <button onClick={() => handleTabChange('saved')} className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'saved' ? 'text-white dark:text-black scale-110' : 'text-white/50 dark:text-black/40 hover:text-white dark:hover:text-black'}`}>
                  <Bookmark size={20} strokeWidth={activeTab === 'saved' ? 3 : 2} />
              </button>
              <button onClick={() => handleTabChange('history')} className={`flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'history' ? 'text-white dark:text-black scale-110' : 'text-white/50 dark:text-black/40 hover:text-white dark:hover:text-black'}`}>
                  <Clock size={20} strokeWidth={activeTab === 'history' ? 3 : 2} />
              </button>
          </div>
      </nav>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)}
          onAskAI={handleAskAI}
          onShare={handleShare}
          isBookmarked={bookmarks.some(b => b.id === selectedArticle.id)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {/* Story Viewer Overlay */}
      {storyCategory && (
        <StoryViewer 
            articles={
                storyCategory === ArticleCategory.ALL 
                ? articles.slice(0, 15) 
                : articles.filter(a => a.category === storyCategory).slice(0, 15)
            }
            onClose={() => setStoryCategory(null)}
            onViewArticle={(article) => {
                setStoryCategory(null);
                handleViewArticle(article);
            }}
        />
      )}

      {/* Chat Sidebar/Overlay */}
      {isChatOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:z-40"
          onClick={() => setIsChatOpen(false)}
        />
      )}
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 md:bottom-10 md:right-10 p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full shadow-xl border border-slate-200 dark:border-slate-700 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300 hover:scale-110 transition-transform"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}

      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        activeArticle={activeChatArticle}
        onClearActiveArticle={handleClearContext}
      />

      {/* Profile/Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        username={username}
        onUpdateUsername={handleUpdateUsername}
        onClearBookmarks={handleClearBookmarks}
        onClearHistory={handleClearHistory}
        bookmarkCount={bookmarks.length}
        historyCount={readHistory.length}
        onRegenerateLogo={handleRegenerateLogo}
      />

      {/* Audio Player (Bottom fixed above nav) */}
      {isPlayerOpen && playlist.length > 0 && (
        <div className="z-[100] relative">
            <AudioPlayer 
            playlist={playlist}
            currentIndex={currentTrackIndex}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onNext={() => setCurrentTrackIndex(i => Math.min(i + 1, playlist.length - 1))}
            onPrev={() => setCurrentTrackIndex(i => Math.max(0, i - 1))}
            onClose={() => { setIsPlayerOpen(false); setIsPlaying(false); }}
            onIndexChange={setCurrentTrackIndex}
            onShare={handleShare}
            onAskAI={handleAskAI}
            />
        </div>
      )}

    </div>
  );
}

export default App;