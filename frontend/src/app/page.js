"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("test_repo");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/codebase/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl })
      });

      if (res.ok) {
        // Redirect to dashboard, passing the repo name in the URL bar
        router.push(`/dashboard?repo=${encodeURIComponent(repoUrl)}`);
      } else {
        const err = await res.json();
        alert(`Indexing failed: ${err.detail}`);
        setLoading(false);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect to Synapse Core.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-6">
      <div className="max-w-2xl w-full flex flex-col gap-8 items-center">
        <h1 className="text-5xl font-bold tracking-tighter text-gray-100">Synapse</h1>
        
        <form onSubmit={handleIngest} className="relative w-full flex items-center">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Paste GitHub URL or local repo name..."
            className="w-full pl-6 pr-16 py-4 bg-[#1e1e1e] border border-[#333] rounded-lg focus:outline-none focus:border-gray-500 font-mono text-sm text-gray-200 placeholder-gray-600 transition-colors shadow-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded text-gray-300 transition-colors disabled:opacity-50"
          >
            {loading ? (
               <span className="block w-5 h-5 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            )}
          </button>
        </form>
        
        {loading && <p className="text-sm text-gray-500 font-mono animate-pulse">Building vector logic tree...</p>}
      </div>
    </main>
  );
}