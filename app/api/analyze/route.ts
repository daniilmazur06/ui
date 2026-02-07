import { NextResponse } from "next/server";
import { getCached, setCache, cacheKey } from "@/lib/cache";
import { fetchGitHubUser, fetchUserRepos, selectTopRepos, analyzeRepo } from "@/lib/github";
import { buildReport } from "@/lib/scoring";
import type { AnalyzeRequest, AnalyzeResponse, AnalyzeErrorResponse } from "@/lib/types";

const CACHE_KEY_PREFIX = "analyze";

export async function POST(request: Request) {
  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<AnalyzeErrorResponse>(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { success: false, error: "username is required" },
      { status: 400 }
    );
  }

  const skipCache = Boolean(body.skipCache);
  const key = cacheKey(CACHE_KEY_PREFIX, username);
  if (!skipCache) {
    const cached = getCached<AnalyzeResponse["report"]>(key);
    if (cached) {
      return NextResponse.json<AnalyzeResponse>({ success: true, report: cached });
    }
  }

  const user = await fetchGitHubUser(username);
  if (!user) {
    return NextResponse.json<AnalyzeErrorResponse>(
      { success: false, error: "GitHub user not found" },
      { status: 404 }
    );
  }

  const repos = await fetchUserRepos(username);
  const topRepos = selectTopRepos(repos, 10);

  const analyzedRepos = await Promise.all(
    topRepos.map((repo) => analyzeRepo(repo, username))
  );

  const report = buildReport(username, user, analyzedRepos);
  setCache(key, report);

  return NextResponse.json<AnalyzeResponse>({ success: true, report });
}
