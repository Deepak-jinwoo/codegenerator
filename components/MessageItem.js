function MessageItem({ message, isLast, language }) {
  const { role, content, isError } = message;
  const isUser = role === 'user';
  const t = TRANSLATIONS[language];
  
  // Parse content into text and code blocks
  const parsedContent = React.useMemo(() => parseMessageContent(content), [content]);

  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`} data-name="message-item">
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-[var(--text-primary)]' : 'bg-green-500'}`}>
          {isUser ? (
             <div className="icon-user text-white w-5 h-5"></div>
          ) : (
             <div className="icon-bot text-white w-5 h-5"></div>
          )}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-[var(--text-secondary)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser ? t.roleUser : t.roleAI}
          </span>
          
          <div className={`rounded-2xl px-4 py-3 shadow-sm overflow-hidden w-full ${
            isUser 
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tr-sm' 
              : isError 
                ? 'bg-red-50 text-red-600 border border-red-100 rounded-tl-sm'
                : 'bg-transparent text-[var(--text-primary)] p-0 shadow-none'
          }`}>
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            ) : (
              <div className="space-y-4 w-full min-w-0">
                {parsedContent.map((block, idx) => {
                  if (block.type === 'text') {
                    // Split by newlines to handle paragraph spacing in pure text
                    return (
                        <p key={idx} className="whitespace-pre-wrap leading-7 break-words">{block.content}</p>
                    );
                  } else {
                    // Code block
                    const isCopied = copiedIndex === idx;
                    return (
                      <div key={idx} className="rounded-md overflow-hidden border border-[var(--border)] my-2 w-full max-w-full">
                        <div className="bg-[var(--bg-secondary)] px-4 py-2 flex items-center justify-between border-b border-[var(--border)]">
                          <span className="text-xs font-mono text-[var(--text-secondary)] lowercase">
                            {block.language}
                          </span>
                          <button 
                            onClick={() => handleCopy(block.content, idx)}
                            className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            {isCopied ? (
                                <div className="icon-check w-3 h-3"></div>
                            ) : (
                                <div className="icon-copy w-3 h-3"></div>
                            )}
                            {isCopied ? t.copied : t.copy}
                          </button>
                        </div>
                        <div className="bg-[#1e1e1e] p-4 overflow-x-auto scrollbar-thin">
                          <pre className="text-sm font-mono text-gray-300">
                            <code>{block.content}</code>
                          </pre>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}