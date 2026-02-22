/**
 * Client-side store for previously analyzed profile summaries.
 * Persists across page reloads via localStorage.
 *
 * This is intentionally client-side: "previously searched profiles"
 * is a per-browser concept (what *you* have analyzed in this browser).
 */

export interface RankingEntry {
  username: string;
  name: string | null;
  avatarUrl: string;
  overallScore: number;
  baseScore: number;
  bonusScore: number;
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
  analyzedAt: string;
}

const STORAGE_KEY = "headstarter-track-analyzed-profiles";

export function getAnalyzedProfiles(): RankingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RankingEntry[];
  } catch {
    return [];
  }
}

export function saveAnalyzedProfile(entry: RankingEntry): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getAnalyzedProfiles();
    // Replace if username already exists (updated analysis), otherwise append
    const idx = existing.findIndex(
      (e) => e.username.toLowerCase() === entry.username.toLowerCase()
    );
    if (idx >= 0) {
      existing[idx] = entry;
    } else {
      existing.push(entry);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage full or unavailable – silently ignore
  }
}

export function removeAnalyzedProfile(username: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getAnalyzedProfiles().filter(
      (e) => e.username.toLowerCase() !== username.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}
