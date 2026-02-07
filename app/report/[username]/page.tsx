"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { AnalysisReport, RecommendationLevel } from "@/lib/types";

const CATEGORY_LABELS: Record<keyof AnalysisReport["categoryScores"], string> = {
  codeQuality: "Code Quality",
  projects: "Projects",
  documentation: "Documentation",
  testing: "Testing/CI",
  activity: "Activity",
  techBreadth: "Tech Breadth",
};

const RECO_LABELS: Record<RecommendationLevel, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const RECO_STYLES: Record<RecommendationLevel, string> = {
  strong_yes: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yes: "bg-green-100 text-green-800 border-green-300",
  maybe: "bg-amber-100 text-amber-800 border-amber-300",
  no: "bg-red-100 text-red-800 border-red-300",
};

function ScoreCard({ label, score }: { label: string; score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 70 ? "bg-emerald-500"
    : pct >= 50 ? "bg-amber-500"
    : "bg-slate-400";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{score}</span>
        <span className="text-slate-400 text-sm">/ 100</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100" />
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-slate-600">Missing username.</p>
        <Link href="/" className="text-emerald-600 ml-2 hover:underline">Go home</Link>
      </div>
    );
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-24 w-48 bg-slate-200 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-20 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => fetchReport(false)}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <Image
              src={report.user.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="rounded-full border border-slate-200"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {report.user.name || report.user.login}
              </h1>
              <a
                href={report.user.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-emerald-600"
              >
                @{report.user.login}
              </a>
              <p className="text-sm text-slate-500 mt-0.5">
                {report.user.followers} followers
                {report.user.topLanguages.length > 0 && (
                  <> · {report.user.topLanguages.slice(0, 3).join(", ")}</>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="text-lg font-semibold text-slate-700">Overall Score</h2>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Analyze Another
            </Link>
            <button
              onClick={() => fetchReport(true)}
              disabled={rerunning}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {rerunning ? "Re-running…" : "Re-run Analysis"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm mb-8 text-center">
          <span className="text-5xl font-bold text-slate-900">{report.overallScore}</span>
          <span className="text-2xl text-slate-400 ml-1">/ 100</span>
        </div>

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

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Strengths</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {report.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Weaknesses / Risks</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {report.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Technical Highlights</h3>
          <ul className="space-y-2">
            {report.technicalHighlights.map((h, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-700 hover:underline"
                >
                  {h.repo}
                </a>
                <span className="text-slate-600">— {h.reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Growth Areas</h3>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            {report.growthAreas.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Final Recommendation</h3>
          <span
            className={`inline-block px-4 py-2 rounded-lg border font-medium ${RECO_STYLES[rec]}`}
          >
            {RECO_LABELS[rec]}
          </span>
        </section>
      </div>
    </div>
  );
}
