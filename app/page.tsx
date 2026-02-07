"use client";

import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const value = username.trim();
    if (!value) {
      setError("Enter a GitHub username");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Analysis failed");
        return;
      }
      if (data.success && data.report) {
        window.location.href = `/report/${encodeURIComponent(data.report.username)}`;
        return;
      }
      setError("Invalid response");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-semibold text-lg text-slate-800">Headstarter Track</span>
          <nav className="flex gap-6 text-sm text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="pt-16 pb-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Headstarter Track
            </h1>
            <p className="text-xl text-slate-600 mb-10">
              Turn GitHub profiles into hiring-ready insights.
            </p>
            <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md mx-auto">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GitHub username"
                className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
                aria-label="GitHub username"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Analyzing…" : "Analyze Profile"}
              </button>
            </form>
            <p className="mt-3 text-sm text-slate-500">
              No login required. Takes ~10–30 seconds.
            </p>
            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        <section id="how-it-works" className="py-16 px-4 bg-white border-y border-slate-200/80">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              How it works
            </h2>
            <div className="grid sm:grid-cols-3 gap-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-semibold">1</div>
                <h3 className="font-semibold text-slate-900 mb-2">Fetch GitHub profile + repos</h3>
                <p className="text-sm text-slate-600">
                  We pull your public profile and top repos (by recency and popularity), ignoring forks.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-semibold">2</div>
                <h3 className="font-semibold text-slate-900 mb-2">Score engineering signals</h3>
                <p className="text-sm text-slate-600">
                  We evaluate docs, tests, CI, activity, and tech breadth to produce category scores.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 font-semibold">3</div>
                <h3 className="font-semibold text-slate-900 mb-2">Generate hiring-style report</h3>
                <p className="text-sm text-slate-600">
                  You get strengths, risks, highlights, growth areas, and a clear recommendation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              What you get
            </h2>
            <ul className="grid sm:grid-cols-2 gap-4">
              {[
                "Scores by category (Code Quality, Projects, Docs, Testing, Activity, Tech Breadth)",
                "Strengths and weaknesses in plain language",
                "Best repos with short reasoning",
                "Growth plan with concrete action steps",
                "Hiring recommendation: Strong Yes / Yes / Maybe / No",
              ].map((text, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span className="text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700">
            GitHub
          </a>
          <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
          <Link href="/contact" className="hover:text-slate-700">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
