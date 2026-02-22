"use client";

import { useState } from "react";
import Link from "next/link";

interface RankingEntry {
  username: string;
  overallScore: number;
  baseScore: number;
  bonusScore: number;
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
  lastUpdated: string;
}

const MOCK_DATA: RankingEntry[] = [
  { username: "torvalds", overallScore: 118, baseScore: 87, bonusScore: 31, recommendation: "strong_yes", lastUpdated: "2026-02-05" },
  { username: "gaearon", overallScore: 105, baseScore: 82, bonusScore: 23, recommendation: "strong_yes", lastUpdated: "2026-02-04" },
  { username: "sindresorhus", overallScore: 98, baseScore: 79, bonusScore: 19, recommendation: "yes", lastUpdated: "2026-02-03" },
  { username: "tj", overallScore: 91, baseScore: 74, bonusScore: 17, recommendation: "yes", lastUpdated: "2026-02-02" },
  { username: "mxstbr", overallScore: 84, baseScore: 68, bonusScore: 16, recommendation: "yes", lastUpdated: "2026-02-01" },
  { username: "kentcdodds", overallScore: 79, baseScore: 65, bonusScore: 14, recommendation: "yes", lastUpdated: "2026-01-30" },
  { username: "wesbos", overallScore: 72, baseScore: 60, bonusScore: 12, recommendation: "maybe", lastUpdated: "2026-01-28" },
  { username: "yyx990803", overallScore: 112, baseScore: 85, bonusScore: 27, recommendation: "strong_yes", lastUpdated: "2026-02-06" },
];

const RECO_BADGE: Record<string, string> = {
  strong_yes: "bg-blue-50 text-blue-700 border-blue-200",
  yes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  maybe: "bg-amber-50 text-amber-700 border-amber-200",
  no: "bg-red-50 text-red-700 border-red-200",
};

const RECO_LABEL: Record<string, string> = {
  strong_yes: "Strong Yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "No",
};

const SCORE_RANGES = [
  { label: "All scores", min: 0, max: Infinity },
  { label: "100+", min: 100, max: Infinity },
  { label: "80 - 99", min: 80, max: 99 },
  { label: "60 - 79", min: 60, max: 79 },
  { label: "Below 60", min: 0, max: 59 },
];

export default function RankingsPage() {
  const [search, setSearch] = useState("");
  const [rangeIdx, setRangeIdx] = useState(0);

  const sorted = [...MOCK_DATA].sort((a, b) => b.overallScore - a.overallScore);

  const filtered = sorted.filter((entry) => {
    const range = SCORE_RANGES[rangeIdx];
    const matchesSearch = entry.username.toLowerCase().includes(search.toLowerCase());
    const matchesRange = entry.overallScore >= range.min && entry.overallScore <= range.max;
    return matchesSearch && matchesRange;
  });

  return (
    <div className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">Rankings</h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Opt-in leaderboard of analyzed profiles. See how developers stack up across our scoring criteria.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm text-sm"
              aria-label="Search by username"
            />
          </div>
          <select
            value={rangeIdx}
            onChange={(e) => setRangeIdx(Number(e.target.value))}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by score range"
          >
            {SCORE_RANGES.map((r, i) => (
              <option key={i} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">#</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Username</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">Overall</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Base</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Bonus</th>
                  <th className="text-center font-medium text-muted-foreground px-4 py-3">Recommendation</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <tr
                    key={entry.username}
                    className="border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground font-mono">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/report/${entry.username}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {entry.username}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground font-mono">
                      {entry.overallScore}
                    </td>
                    <td className="px-4 py-3 text-right text-secondary-foreground font-mono hidden sm:table-cell">
                      {entry.baseScore}
                    </td>
                    <td className="px-4 py-3 text-right text-secondary-foreground font-mono hidden sm:table-cell">
                      +{entry.bonusScore}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-medium ${RECO_BADGE[entry.recommendation]}`}
                      >
                        {RECO_LABEL[entry.recommendation]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                      {entry.lastUpdated}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No profiles match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
