import type { GitHubUser, GitHubRepo, RepoAnalysis } from "./types";

const GITHUB_API = "https://api.github.com";

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github.v3+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser | null> {
  const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: headers(),
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUserRepos(
  username: string,
  perPage: number = 100
): Promise<GitHubRepo[]> {
  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&sort=updated&type=owner`,
    { headers: headers(), next: { revalidate: 0 } }
  );
  if (!res.ok) return [];
  const repos: GitHubRepo[] = await res.json();
  return repos.filter((r) => !r.fork);
}

export async function fetchRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
    { headers: headers(), next: { revalidate: 0 } }
  );
  if (!res.ok) return {};
  return res.json();
}

export async function fetchRepoContentPaths(owner: string, repo: string): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`,
    { headers: headers(), next: { revalidate: 0 } }
  );
  if (!res.ok) return [];
  const items: Array<{ name: string; type: string }> = await res.json();
  return items.map((i) => i.name);
}

export async function fetchRepoDirPaths(
  owner: string,
  repo: string,
  path: string
): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`,
    { headers: headers(), next: { revalidate: 0 } }
  );
  if (!res.ok) return [];
  const items: Array<{ name: string; type: string }> = await res.json();
  return items.map((i) => i.name);
}

const TEST_INDICATORS = [
  "jest",
  "pytest",
  "mocha",
  "vitest",
  "jasmine",
  "test",
  "tests",
  "__tests__",
  "spec",
  ".test.",
  ".spec.",
  "cypress",
  "playwright",
];

function checkHasCI(rootNames: string[]): boolean {
  if (!rootNames.includes(".github")) return false;
  // We'd need to check .github contents; assume workflows exist if .github exists
  // Optional: fetch .github contents and look for "workflows"
  return true;
}

function findTestIndicators(rootNames: string[], repoName: string): string[] {
  const found: string[] = [];
  const lower = rootNames.map((n) => n.toLowerCase());
  const nameLower = repoName.toLowerCase();
  for (const ind of TEST_INDICATORS) {
    if (lower.some((n) => n.includes(ind) || n === ind)) found.push(ind);
    if (nameLower.includes(ind)) found.push(ind);
  }
  return Array.from(new Set(found));
}

export function selectTopRepos(repos: GitHubRepo[], count: number = 10): GitHubRepo[] {
  return repos
    .sort((a, b) => {
      const scoreA = a.stargazers_count * 2 + (a.updated_at ? 1 : 0);
      const scoreB = b.stargazers_count * 2 + (b.updated_at ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, count);
}

export async function analyzeRepo(repo: GitHubRepo, username: string): Promise<RepoAnalysis> {
  const [languages, rootContents] = await Promise.all([
    fetchRepoLanguages(username, repo.name),
    fetchRepoContentPaths(username, repo.name),
  ]);

  const langNames = Object.keys(languages);
  const primaryLanguage = repo.language || (langNames.length ? langNames[0] : null);

  const hasReadme =
    rootContents.some((n) => n.toLowerCase() === "readme.md") ||
    rootContents.some((n) => n.toLowerCase().startsWith("readme"));

  const hasCI = checkHasCI(rootContents);
  const testIndicators = findTestIndicators(rootContents, repo.name);

  return {
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    language: primaryLanguage,
    languages,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
    hasReadme,
    hasCI,
    hasTests: testIndicators.length > 0,
    testIndicators,
  };
}
