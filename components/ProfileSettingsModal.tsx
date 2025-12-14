import React, { useState, useEffect } from 'react';
import { X, User, Trash2, Save, RotateCcw, Shield, Award, BookOpen, Image as ImageIcon } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUpdateUsername: (name: string) => void;
  onClearBookmarks: () => void;
  onClearHistory: () => void;
  bookmarkCount: number;
  historyCount: number;
  onRegenerateLogo?: () => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  username,
  onUpdateUsername,
  onClearBookmarks,
  onClearHistory,
  bookmarkCount,
  historyCount,
  onRegenerateLogo
}) => {
  const [tempName, setTempName] = useState(username);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTempName(username);
  }, [username, isOpen]);

  if (!isOpen) return null;

  const handleSaveName = () => {
    onUpdateUsername(tempName);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Profile & Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* User Profile Section */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1 mb-4 shadow-lg">
               <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <User size={40} className="text-slate-400" />
               </div>
            </div>
            
            <div className="flex items-center gap-2 w-full justify-center">
              {isEditing ? (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 rounded-lg px-3 py-1.5 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-center w-40"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveName}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{username}</h3>
                  <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Edit</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tech Explorer</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group cursor-default">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                   <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-3xl font-black text-slate-800 dark:text-white mb-1">{bookmarkCount.toLocaleString()}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Saved Articles</span>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group cursor-default">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform duration-300">
                   <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-3xl font-black text-slate-800 dark:text-white mb-1">{historyCount.toLocaleString()}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wide">Articles Read</span>
             </div>
          </div>

          {/* Data Management */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Account Actions</h4>
             
             {onRegenerateLogo && (
               <button 
                 onClick={onRegenerateLogo}
                 className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all group"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 rounded-lg transition-colors">
                       <ImageIcon size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                     </div>
                     <div className="text-left">
                        <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">Regenerate App Logo</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Create new unique icon with AI</p>
                     </div>
                  </div>
               </button>
             )}

             <button 
               onClick={onClearBookmarks}
               disabled={bookmarkCount === 0}
               className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 rounded-lg transition-colors">
                     <Trash2 size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
                   </div>
                   <div className="text-left">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400">Clear Bookmarks</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Remove all saved articles</p>
                   </div>
                </div>
             </button>

             <button 
               onClick={onClearHistory}
               disabled={historyCount === 0}
               className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-900/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-slate-100 dark:bg-slate-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 rounded-lg transition-colors">
                     <RotateCcw size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                   </div>
                   <div className="text-left">
                      <p className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-400">Reset Recommendations</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Clear reading history</p>
                   </div>
                </div>
             </button>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
             <Shield size={12} />
             <span className="text-xs">NowFlowAI v1.0 • Privacy First</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;