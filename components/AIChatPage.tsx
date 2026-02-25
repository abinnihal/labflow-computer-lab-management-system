import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hello! I am your Academic Assistant. I can explain concepts, guide you through lab manuals, or help with scheduling. I cannot provide direct exam answers, but I am happy to help you learn!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAI(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Network error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header Updated for Academic Theme */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="fa-solid fa-graduation-cap text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold">Academic Lab Assistant</h1>
            <p className="text-blue-100 text-sm">Guided learning support & system inquiries</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-6 py-4 shadow-sm text-base leading-relaxed ${msg.role === 'user'
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
              }`}>

              {/* React Markdown handles the AI response formatting */}
              {msg.role === 'model' ? (

                /* FIX: Wrapped in a div instead of putting className directly on ReactMarkdown */
                <div className="space-y-3 text-slate-700">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-slate-800" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-3 mb-2 text-slate-900" {...props} />,
                      code: ({ node, className, children, ...props }: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <pre className="bg-slate-800 text-slate-50 p-4 rounded-xl overflow-x-auto text-sm my-4 font-mono shadow-inner">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

              ) : (
                /* User messages don't need markdown parsing */
                <p>{msg.text}</p>
              )}

            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-none px-6 py-4 shadow-sm flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400">Thinking</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 border border-slate-300 rounded-full px-6 py-3 text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;