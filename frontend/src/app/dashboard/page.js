"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function Dashboard() {
  const searchParams = useSearchParams();
  const repoName = searchParams.get("repo") || "Unknown Repository";
  
  const [activeTab, setActiveTab] = useState("qna");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "system", content: "Synapse initialized. Ask me anything about the architecture." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/codebase/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev, 
          { role: "assistant", content: data.answer, sources: data.sources }
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "system", content: "Error: Failed to fetch context from vector database." }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "system", content: "Critical pipeline error. Check connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-gray-200">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="flex-1">
          <h2 className="text-sm font-mono text-gray-400">
            <span className="text-blue-500">repo:</span> {repoName}
          </h2>
        </div>
        
        {/* Center Toggles */}
        <div className="flex bg-[#222] rounded-lg p-1 border border-[#333]">
          <button 
            onClick={() => setActiveTab("logic")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "logic" ? "bg-[#333] text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            Logic Tree
          </button>
          <button 
            onClick={() => setActiveTab("qna")}
            className={`px-6 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === "qna" ? "bg-[#333] text-white shadow" : "text-gray-500 hover:text-gray-300"}`}
          >
            Q&A
          </button>
        </div>
        
        <div className="flex-1" /> {/* Spacer for centering */}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === "logic" ? (
          <div className="flex h-full items-center justify-center text-gray-600 font-mono">
            [ Interactive Graph Component Pending ]
          </div>
        ) : (
          <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4">
            
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-4 scrollbar-hide">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[80%] p-4 rounded-xl text-sm ${
                    msg.role === "user" ? "bg-[#2a2a2a] text-gray-100" : 
                    msg.role === "system" ? "bg-red-900/20 text-red-400 font-mono border border-red-900/50" : 
                    "bg-transparent text-gray-300 leading-relaxed w-full"
                  }`}>
                    
{/* Markdown and Syntax Highlighting */}
                    {msg.role === "assistant" ? (
                      // Move the prose classes to a wrapper div
                      <div className="prose prose-invert prose-sm max-w-none w-full">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          // className is completely removed from here
                          components={{
                            code({node, inline, className, children, ...props}) {
                              const match = /language-(\w+)/.exec(className || '');
                              
                              return !inline && match ? (
                                <div className="my-4 rounded-md overflow-hidden border border-[#333]">
                                  <div className="bg-[#1e1e1e] px-4 py-1 text-xs text-gray-500 font-mono border-b border-[#333] uppercase">
                                    {match[1]}
                                  </div>
                                  <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, background: "transparent", fontSize: "0.85rem" }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-[#2a2a2a] text-blue-300 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  
                  {/* Sources tag for Assistant responses */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 ml-4">
                      {msg.sources.map((src, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-[#1e1e1e] border border-[#333] text-gray-500 font-mono rounded">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="text-gray-500 text-sm font-mono animate-pulse ml-4">Synapse is analyzing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-4 border-t border-[#2a2a2a]">
              <form onSubmit={handleChatSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about the repository..."
                  className="w-full pl-6 pr-14 py-4 bg-[#1e1e1e] border border-[#333] rounded-full focus:outline-none focus:border-gray-500 text-sm text-gray-200 placeholder-gray-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 p-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-full text-gray-300 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                </button>
              </form>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}