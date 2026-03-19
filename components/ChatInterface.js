function ChatInterface({ sessionId, language, toggleSidebar, onSessionCreated, onSessionUpdated }) {
  const t = TRANSLATIONS[language];
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // Track if we are currently handling a session creation to prevent duplicates
  const creationInProgress = React.useRef(false);
  // Track if we just created a session to avoid reloading messages and wiping state
  const justCreatedSessionId = React.useRef(null);

  // Load messages when sessionId changes
  React.useEffect(() => {
    if (sessionId) {
      // If this is the session we just created in this very component instance,
      // skip loading because we already have the optimistic state.
      if (sessionId === justCreatedSessionId.current) {
        justCreatedSessionId.current = null; // Reset for next time
        return;
      }
      loadMessages(sessionId);
    } else {
      setMessages([]);
    }
  }, [sessionId]);

  const loadMessages = async (id) => {
    setIsInitializing(true);
    try {
      const dbMessages = await getMessages(id);
      // Map DB objects to UI message format
      const formattedMessages = dbMessages.map(item => ({
        role: item.objectData.role,
        content: item.objectData.content,
        isError: item.objectData.isError
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const API_BASE = window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : window.location.origin;

  const invokeAIWithRetry = async (sessionId, message, language, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message, language })
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.response;
      } catch (error) {
        console.warn(`AI request failed (attempt ${i + 1}/${retries}):`, error);
        if (i === retries - 1) throw error;
        // Wait a bit before retrying
        await new Promise(res => setTimeout(res, 1000 * (i + 1)));
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const content = input;
    setInput('');
    setIsLoading(true);

    // Optimistic UI update
    const userMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      let currentId = sessionId;

      // 1. Create session if it doesn't exist
      if (!currentId) {
        if (creationInProgress.current) return; // Prevent double submission
        creationInProgress.current = true;

        try {
          // Generate a title based on first few words
          const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          const newSession = await createSession(title, language);

          // Mark that we just created this session locally so useEffect doesn't wipe our state
          justCreatedSessionId.current = newSession.objectId;
          currentId = newSession.objectId;

          // Notify parent to update URL/State, this triggers a prop update for sessionId
          onSessionCreated(newSession);
        } finally {
          // ALWAYS reset the lock, even if creation fails
          creationInProgress.current = false;
        }
      }

      // 2. Save User Message to DB
      if (currentId) {
        await saveMessage(currentId, 'user', content);
      }

      // 3. Call AI via backend (server handles memory/context building)
      const responseText = await invokeAIWithRetry(currentId, content, language);

      // 4. Save AI Message to DB
      if (currentId) {
        await saveMessage(currentId, 'ai', responseText);
      }

      // 5. Update UI with AI response
      setMessages(prev => [...prev, { role: 'ai', content: responseText }]);

    } catch (error) {
      console.error("AI/DB Error:", error);
      const errorMsg = t.error + (error.message ? ` (${error.message})` : "");
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg, isError: true }]);
      // Try to save error message to DB if session exists
      if (sessionId || justCreatedSessionId.current) {
        try {
          await saveMessage(sessionId || justCreatedSessionId.current, 'ai', errorMsg, true);
        } catch (e) { console.error("Failed to save error:", e); }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isInitializing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-primary)] h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full relative w-full overflow-hidden" data-name="chat-interface">
      {/* Mobile Header - Flex Shrink 0 to prevent crushing */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-[var(--text-primary)]">
          <div className="icon-menu w-6 h-6"></div>
        </button>
        <span className="font-semibold">{t.appTitle}</span>
        <div className="w-8"></div> {/* Spacer */}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-start">

          {messages.length === 0 && !sessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 mt-10 md:mt-0">
              <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mb-4">
                <div className="icon-wand-sparkles w-8 h-8 text-[var(--accent)]"></div>
              </div>
              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t.welcomeTitle}</h2>
                <p className="text-[var(--text-secondary)]">{t.welcomeSubtitle}</p>
              </div>

              <div className="grid gap-3 w-full max-w-lg">
                {[t.example1, t.example2, t.example3].map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(text)}
                    className="p-3 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors text-left"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <MessageItem
                  key={idx}
                  message={msg}
                  language={language}
                  isLast={idx === messages.length - 1}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6 w-full">
                  <div className="flex max-w-[80%] gap-4">
                    <div className="w-8 h-8 rounded-sm bg-green-500 flex-shrink-0 flex items-center justify-center">
                      <div className="icon-bot text-white w-5 h-5"></div>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </>
          )}
        </div>
      </div>

      {/* Input Area - Flex Shrink 0 to ensure it sticks to bottom */}
      <div className="flex-shrink-0 p-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.typePlaceholder}
            rows={1}
            className="w-full resize-none bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] shadow-sm max-h-48 overflow-y-auto"
            style={{ minHeight: '52px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 bottom-3 p-2 rounded-lg transition-colors ${input.trim() && !isLoading
              ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed'
              }`}
          >
            <div className="icon-arrow-up w-5 h-5"></div>
          </button>
        </div>
        <div className="text-center mt-2 hidden md:block">
          <p className="text-xs text-[var(--text-secondary)]">
            CodeGen AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </main>
  );
}