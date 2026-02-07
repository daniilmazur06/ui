"use client";

import { useState } from "react";

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
    <div>
      <section className="pt-20 pb-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-6 tracking-wide uppercase">
              GitHub Profile Analytics
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-5 text-balance">
              Headstarter Track
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Turn GitHub profiles into hiring-ready insights.
            </p>
            <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md mx-auto">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GitHub username"
                className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm"
                disabled={loading}
                aria-label="GitHub username"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Analyzing…" : "Analyze Profile"}
              </button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              No login required. Takes ~10-30 seconds.
            </p>
            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-4 text-balance">
              How it works
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
              Three simple steps to get actionable hiring insights.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-sm">1</div>
                <h3 className="font-semibold text-foreground mb-2">Fetch GitHub profile + repos</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We pull your public profile and top repos (by recency and popularity), ignoring forks.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-sm">2</div>
                <h3 className="font-semibold text-foreground mb-2">Score engineering signals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We evaluate docs, tests, CI, activity, and tech breadth to produce category scores.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4 font-semibold text-sm">3</div>
                <h3 className="font-semibold text-foreground mb-2">Generate hiring-style report</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You get strengths, risks, highlights, growth areas, and a clear recommendation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground text-center mb-4 text-balance">
              What you get
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
              A comprehensive developer profile assessment.
            </p>
            <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
              <ul className="grid sm:grid-cols-2 gap-4">
                {[
                  "Scores by category (Code Quality, Projects, Docs, Testing, Activity, Tech Breadth)",
                  "Strengths and weaknesses in plain language",
                  "Best repos with short reasoning",
                  "Growth plan with concrete action steps",
                  "Hiring recommendation: Strong Yes / Yes / Maybe / No",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-primary mt-0.5 flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                    <span className="text-secondary-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
    </div>
  );
}
