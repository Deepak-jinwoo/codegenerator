function Sidebar({ isOpen, onClose, onNewChat, sessions, currentSessionId, onSelectChat, language, setLanguage, currentLanguage, isLoading }) {
  const t = TRANSLATIONS[currentLanguage];

  const languages = ['en', 'ta', 'ru', 'ja'];

  const cycleLanguage = () => {
    const currentIndex = languages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-primary)] border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}
      data-name="sidebar"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
         <div className="flex items-center gap-2 font-bold text-lg text-[var(--text-primary)]">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white">
                <div className="icon-code-xml w-5 h-5"></div>
            </div>
            <span>CodeGen</span>
         </div>
         <button onClick={onClose} className="md:hidden p-2 text-[var(--text-secondary)]">
            <div className="icon-x w-5 h-5"></div>
         </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg transition-colors text-sm font-medium text-[var(--text-primary)]"
        >
          <div className="icon-square-plus w-5 h-5 text-[var(--text-secondary)]"></div>
          {t.newChat}
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
         {isLoading ? (
             <div className="flex justify-center py-4">
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--text-secondary)]"></div>
             </div>
         ) : sessions.length === 0 ? (
             <div className="text-center py-4 text-xs text-[var(--text-secondary)]">
                 No history yet
             </div>
         ) : (
             <>
                <div className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    Recent
                </div>
                {sessions.map(session => (
                    <button 
                        key={session.objectId}
                        onClick={() => onSelectChat(session.objectId)}
                        className={`w-full text-left px-4 py-2 text-sm rounded-md truncate transition-colors flex items-center gap-2 ${
                            currentSessionId === session.objectId 
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <div className="icon-message-square w-4 h-4 flex-shrink-0"></div>
                        <span className="truncate">{session.objectData.title || 'New Chat'}</span>
                    </button>
                ))}
             </>
         )}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[var(--border)] space-y-2">
        {/* Language Selector */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] group cursor-pointer" onClick={cycleLanguage}>
           <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
             <div className="icon-languages w-4 h-4 text-[var(--text-secondary)]"></div>
             <span>{t.langName}</span>
           </div>
           <div className="text-[var(--text-secondary)] text-xs border border-[var(--border)] px-1.5 py-0.5 rounded uppercase">
             {currentLanguage}
           </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                U
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">User</div>
                <div className="text-xs text-[var(--text-secondary)] truncate">Pro Plan</div>
            </div>
            <div className="icon-settings w-4 h-4 text-[var(--text-secondary)]"></div>
        </div>
      </div>
    </aside>
  );
}