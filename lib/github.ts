import type { GitHubUser, GitHubRepo, RepoAnalysis, NormalizedRepo } from "./types";

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

/** Fetch README size in bytes (for readme_length). Returns 0 if no README. */
export async function fetchRepoReadmeSize(owner: string, repo: string): Promise<number> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
    { headers: headers(), next: { revalidate: 0 } }
  );
  if (!res.ok) return 0;
  const data: { size?: number } = await res.json();
  return typeof data.size === "number" ? data.size : 0;
}

/** Fetch repo topics (requires mercy-preview). Returns [] if not available. */
export async function fetchRepoTopics(owner: string, repo: string): Promise<string[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics`,
    {
      headers: { ...headers(), Accept: "application/vnd.github.mercy-preview+json" },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return [];
  const data: { names?: string[] } = await res.json();
  return Array.isArray(data.names) ? data.names : [];
}

const LINT_INDICATORS = [
  "eslint", ".eslintrc", "prettier", ".prettierrc", "ruff", "pyproject.toml",
  "tslint", ".editorconfig",
];
const DOCKER_INDICATORS = ["dockerfile", "docker-compose", "compose.yml", "compose.yaml"];
const DEPLOY_INDICATORS = ["vercel.json", "netlify.toml", "firebase.json", ".firebaserc", "railway.json"];

function hasLint(rootNames: string[]): boolean {
  const lower = rootNames.map((n) => n.toLowerCase());
  return LINT_INDICATORS.some((ind) =>
    lower.some((n) => n === ind || n.startsWith(ind) || n.includes(ind))
  );
}
function hasDocker(rootNames: string[]): boolean {
  const lower = rootNames.map((n) => n.toLowerCase());
  return DOCKER_INDICATORS.some((ind) =>
    lower.some((n) => n === ind || n.includes(ind))
  );
}
function hasDeployConfig(rootNames: string[]): boolean {
  const lower = rootNames.map((n) => n.toLowerCase());
  return DEPLOY_INDICATORS.some((ind) => lower.includes(ind));
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
      const aPush = a.pushed_at || a.updated_at || "";
      const bPush = b.pushed_at || b.updated_at || "";
      const scoreA = a.stargazers_count * 2 + (aPush ? 1 : 0);
      const scoreB = b.stargazers_count * 2 + (bPush ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, count);
}

/** Build NormalizedRepo for scoring. Fetches languages, root contents, README size, topics. */
export async function analyzeRepo(repo: GitHubRepo, username: string): Promise<NormalizedRepo> {
  const [languages, rootContents, readmeSize, topics] = await Promise.all([
    fetchRepoLanguages(username, repo.name),
    fetchRepoContentPaths(username, repo.name),
    fetchRepoReadmeSize(username, repo.name),
    fetchRepoTopics(username, repo.name),
  ]);

  const hasReadme =
    rootContents.some((n) => n.toLowerCase() === "readme.md") ||
    rootContents.some((n) => n.toLowerCase().startsWith("readme"));
  const hasCI = checkHasCI(rootContents);
  const testIndicators = findTestIndicators(rootContents, repo.name);

  return {
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count ?? 0,
    watchers_count: repo.watchers_count ?? 0,
    size: typeof repo.size === "number" ? repo.size : 0,
    language: repo.language,
    topics: topics.length > 0 ? topics : undefined,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at ?? repo.updated_at,
    has_readme: hasReadme,
    readme_length: hasReadme ? readmeSize : 0,
    languages,
    has_tests: testIndicators.length > 0,
    has_ci: hasCI,
    has_lint: hasLint(rootContents),
    has_docker: hasDocker(rootContents),
    has_deploy_config: hasDeployConfig(rootContents),
    is_archived: (repo as { archived?: boolean }).archived,
    is_template: (repo as { is_template?: boolean }).is_template,
    created_at: repo.created_at,
  };
}

/** Convert NormalizedRepo to RepoAnalysis for report display. */
export function normalizedToRepoAnalysis(r: NormalizedRepo): RepoAnalysis {
  return {
    name: r.name,
    fullName: r.full_name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    languages: r.languages,
    stars: r.stargazers_count,
    updatedAt: r.updated_at,
    hasReadme: r.has_readme,
    hasCI: r.has_ci,
    hasTests: r.has_tests,
    testIndicators: [],
  };
}
