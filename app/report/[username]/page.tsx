"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  AnalysisReport,
  RecommendationLevel,
  ScoringCategoryScores,
  BonusScores,
} from "@/lib/types";

const CATEGORY_LABELS: Record<keyof AnalysisReport["categoryScores"], string> = {
  codeQuality: "Code Quality",
  projects: "Projects",
  documentation: "Documentation",
  testing: "Testing/CI",
  activity: "Activity",
  techBreadth: "Tech Breadth",
};

const SCORING_CATEGORY_MAX: Record<keyof ScoringCategoryScores, number> = {
  codeQuality: 30,
  projectSubstance: 25,
  documentation: 15,
  testingCI: 15,
  activity: 10,
  techBreadth: 5,
};

const BONUS_LABELS: Record<keyof BonusScores, string> = {
  ownership: "Exceptional Ownership",
  engineeringMaturity: "Engineering Maturity",
  collaborationImpact: "Collaboration & Impact",
  raritySignals: "Rarity Signals",
};

const RECO_LABELS: Record<RecommendationLevel, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const RECO_STYLES: Record<RecommendationLevel, string> = {
  strong_yes: "bg-blue-50 text-blue-800 border-blue-200",
  yes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  maybe: "bg-amber-50 text-amber-800 border-amber-200",
  no: "bg-red-50 text-red-800 border-red-200",
};

function ScoreCard({
  label,
  score,
  max = 100,
}: {
  label: string;
  score: number;
  max?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
  const color =
    pct >= 70 ? "bg-primary"
    : pct >= 50 ? "bg-amber-400"
    : "bg-muted-foreground/40";
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-muted-foreground/60 text-sm">/ {max}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-pulse">
      <div className="h-4 bg-secondary rounded w-2/3 mb-2" />
      <div className="h-8 bg-secondary rounded w-1/3" />
      <div className="mt-2 h-1.5 w-full rounded-full bg-secondary" />
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const username = typeof params.username === "string" ? params.username : "";
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);

  function fetchReport(skipCache: boolean) {
    if (!username) return;
    setError(null);
    if (!report) setLoading(true);
    else setRerunning(true);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, skipCache }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setError(data?.error || "Analysis failed");
          setReport(null);
          return;
        }
        setReport(data.report);
      })
      .catch(() => {
        setError("Network error");
        setReport(null);
      })
      .finally(() => {
        setLoading(false);
        setRerunning(false);
      });
  }

  useEffect(() => {
    if (username) fetchReport(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when username changes
  }, [username]);

  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-foreground">Missing username.</p>
        <Link href="/" className="text-primary ml-2 hover:underline">Go home</Link>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-secondary rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="h-24 w-48 bg-secondary rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
            <div className="h-20 bg-secondary rounded-lg animate-pulse" />
            <div className="h-20 bg-secondary rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-destructive mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => fetchReport(false)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Analyze another
          </Link>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const rec = report.recommendation;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={report.user.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="rounded-full border border-border shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {report.user.name || report.user.login}
              </h1>
              <a
                href={report.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                @{report.user.login}
              </a>
              <p className="text-sm text-muted-foreground mt-0.5">
                {report.user.followers} followers
                {report.user.topLanguages.length > 0 && (
                  <> · {report.user.topLanguages.slice(0, 3).join(", ")}</>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-semibold text-foreground">Overall Score</h2>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Analyze Another
            </Link>
            <button
              onClick={() => fetchReport(true)}
              disabled={rerunning}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {rerunning ? "Re-running…" : "Re-run Analysis"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 shadow-sm mb-8 text-center">
          <span className="text-5xl font-bold text-primary">{report.overallScore}</span>
          {report.scoreBreakdown ? (
            <>
              <p className="text-muted-foreground mt-2 text-sm">
                Base: {report.scoreBreakdown.baseTotal} + Bonus: {report.scoreBreakdown.bonusTotal} (scores can exceed 100)
              </p>
            </>
          ) : (
            <span className="text-2xl text-muted-foreground ml-1">/ 100</span>
          )}
        </div>

        {report.scoreBreakdown && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Category breakdown (base max 100)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(Object.keys(report.scoreBreakdown.categoryScores) as Array<keyof ScoringCategoryScores>).map(
                (key) => (
                  <ScoreCard
                    key={key}
                    label={key === "projectSubstance" ? "Project Substance" : key === "testingCI" ? "Testing/CI" : CATEGORY_LABELS[key as keyof AnalysisReport["categoryScores"]] ?? key}
                    score={report.scoreBreakdown!.categoryScores[key]}
                    max={SCORING_CATEGORY_MAX[key]}
                  />
                )
              )}
            </div>
          </section>
        )}

        {report.scoreBreakdown && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Bonus breakdown (additive, cap 45)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(report.scoreBreakdown.bonusScores) as Array<keyof BonusScores>).map(
                (key) => (
                  <ScoreCard
                    key={key}
                    label={BONUS_LABELS[key]}
                    score={report.scoreBreakdown!.bonusScores[key]}
                    max={key === "ownership" ? 15 : key === "raritySignals" ? 12 : 10}
                  />
                )
              )}
            </div>
          </section>
        )}

        {!report.scoreBreakdown && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {(Object.keys(CATEGORY_LABELS) as Array<keyof AnalysisReport["categoryScores"]>).map(
              (key) => (
                <ScoreCard
                  key={key}
                  label={CATEGORY_LABELS[key]}
                  score={report.categoryScores[key]}
                />
              )
            )}
          </div>
        )}

        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Strengths</h3>
            <ul className="flex flex-col gap-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-primary mt-0.5 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                  <span className="text-secondary-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Weaknesses / Risks</h3>
            <ul className="flex flex-col gap-2">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </span>
                  <span className="text-secondary-foreground">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Technical Highlights</h3>
            <ul className="flex flex-col gap-3">
              {report.technicalHighlights.map((h, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-2">
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {h.repo}
                  </a>
                  <span className="text-muted-foreground">{"--"} {h.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Growth Areas</h3>
            <ul className="flex flex-col gap-2">
              {report.growthAreas.map((g, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="text-primary mt-0.5 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7-7-7 7"/></svg>
                  </span>
                  <span className="text-secondary-foreground">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Final Recommendation</h3>
            <span
              className={`inline-block px-4 py-2 rounded-lg border font-medium ${RECO_STYLES[rec]}`}
            >
              {RECO_LABELS[rec]}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
