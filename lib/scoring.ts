import type {
  RepoAnalysis,
  CategoryScores,
  RecommendationLevel,
  AnalysisReport,
  GithubAnalysisInput,
  NormalizedRepo,
  ScoringCategoryScores,
  BonusScores,
  ScoreBreakdown,
} from "./types";
import type { GitHubUser } from "./types";
import { normalizedToRepoAnalysis } from "./github";

const BONUS_CAP = 45;
const TOP_N = 10;

/** Top repos sorted by pushed_at desc. */
function topRepos(repos: NormalizedRepo[], n: number): NormalizedRepo[] {
  return [...repos]
    .filter((r) => !r.fork)
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    .slice(0, n);
}

/** Days since latest push across all repos. */
function daysSinceLatestPush(repos: NormalizedRepo[]): number | null {
  if (repos.length === 0) return null;
  const latest = repos.reduce((max, r) => {
    const t = new Date(r.pushed_at).getTime();
    return t > max ? t : max;
  }, 0);
  const now = Date.now();
  return Math.floor((now - latest) / (24 * 60 * 60 * 1000));
}

// --- Base category scoring (max 100 total) ---

/** A) Documentation (0–15): +1 has_readme, +1 readme>=400, +1 readme>=1000 per repo, cap 15. */
function scoreDocumentation(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const top = topRepos(repos, TOP_N);
  let raw = 0;
  for (const r of top) {
    if (r.has_readme) raw += 1;
    if (r.readme_length >= 400) raw += 1;
    if (r.readme_length >= 1000) raw += 1;
  }
  const score = Math.min(15, raw);
  if (score > 0) exp.push(`Documentation: ${score}/15 (READMEs and length across top repos)`);
  return { score, explanations: exp };
}

/** B) Testing & CI (0–15): +2 per repo has_tests (cap 10), +1 per repo has_ci (cap 5), total cap 15. */
function scoreTestingCI(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const top = topRepos(repos, TOP_N);
  let tests = 0;
  let ci = 0;
  for (const r of top) {
    if (r.has_tests) tests += 2;
    if (r.has_ci) ci += 1;
  }
  tests = Math.min(10, tests);
  ci = Math.min(5, ci);
  const score = Math.min(15, tests + ci);
  if (score > 0) exp.push(`Testing/CI: ${score}/15 (tests and CI in top repos)`);
  return { score, explanations: exp };
}

/** C) Activity (0–10): bands by days since latest push; +1 if >=3 repos pushed in last 30 days. */
function scoreActivity(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const days = daysSinceLatestPush(repos);
  let score = 0;
  if (days !== null) {
    if (days <= 7) score = 10;
    else if (days <= 30) score = 8;
    else if (days <= 90) score = 6;
    else if (days <= 180) score = 4;
    else score = 2;
    exp.push(`Activity: days since latest push = ${days}`);
  }
  const top = topRepos(repos, TOP_N);
  const last30 = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentCount = top.filter((r) => now - new Date(r.pushed_at).getTime() <= last30).length;
  if (recentCount >= 3) {
    score = Math.min(10, score + 1);
    exp.push(`Activity: +1 for >=3 repos pushed in last 30 days`);
  }
  return { score, explanations: exp };
}

/** Aggregate language bytes across all repos. */
function aggregateLanguages(repos: NormalizedRepo[]): Record<string, number> {
  const agg: Record<string, number> = {};
  for (const r of repos) {
    for (const [lang, bytes] of Object.entries(r.languages)) {
      agg[lang] = (agg[lang] ?? 0) + bytes;
    }
  }
  return agg;
}

/** D) Tech Breadth (0–5): meaningful = >=5% of total bytes OR primary in >=2 repos. */
function scoreTechBreadth(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const agg = aggregateLanguages(repos);
  const total = Object.values(agg).reduce((s, v) => s + v, 0);
  const primaryPerRepo = repos.map((r) => {
    const lang = r.language;
    if (lang) return lang;
    const entries = Object.entries(r.languages);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  });
  const meaningful = new Set<string>();
  for (const [lang, bytes] of Object.entries(agg)) {
    if (total > 0 && bytes / total >= 0.05) meaningful.add(lang);
  }
  const primaryCount: Record<string, number> = {};
  for (const lang of primaryPerRepo) {
    if (lang) primaryCount[lang] = (primaryCount[lang] ?? 0) + 1;
  }
  for (const [lang, count] of Object.entries(primaryCount)) {
    if (count >= 2) meaningful.add(lang);
  }
  const n = meaningful.size;
  let score = 0;
  if (n >= 6) score = 5;
  else if (n >= 5) score = 5;
  else if (n >= 4) score = 4;
  else if (n >= 3) score = 3;
  else if (n >= 2) score = 2;
  else if (n >= 1) score = 1;
  score = Math.min(5, score);
  if (score > 0) exp.push(`Tech breadth: ${meaningful.size} meaningful languages → ${score}/5`);
  return { score, explanations: exp };
}

/** E) Project Substance (0–25). Penalty if >50% top repos empty description. */
function scoreProjectSubstance(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const top = topRepos(repos, TOP_N);
  let raw = 0;
  let emptyDesc = 0;
  for (const r of top) {
    if (r.description && r.description.length >= 40) raw += 2;
    else emptyDesc += 1;
    if (r.size >= 200) raw += 2;
    if (r.has_docker || r.has_deploy_config) raw += 2;
    if ((r.topics?.length ?? 0) >= 3) raw += 1;
    if (r.stargazers_count >= 5) raw += 1;
  }
  if (emptyDesc > top.length / 2) {
    raw = Math.max(0, raw - 3);
    exp.push("Project substance: penalty -3 for >50% top repos with empty description");
  }
  const score = Math.min(25, raw);
  if (score > 0) exp.push(`Project substance: ${score}/25`);
  return { score, explanations: exp };
}

/** F) Code Quality (0–30). has_structure inferred from has_tests || has_ci || has_docker || has_readme. */
function scoreCodeQuality(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  const top = topRepos(repos, TOP_N);
  let raw = 0;
  for (const r of top) {
    if (r.has_lint) raw += 2;
    const hasStructure =
      r.has_tests || r.has_ci || r.has_docker || r.has_readme;
    if (hasStructure) raw += 2;
    if (r.readme_length >= 400) raw += 1;
  }
  const score = Math.min(30, raw);
  exp.push(
    "Code quality: has_structure inferred from has_tests/has_ci/has_docker/has_readme (no explicit folder structure signal)"
  );
  if (score > 0) exp.push(`Code quality: ${score}/30`);
  return { score, explanations: exp };
}

// --- Bonus scoring ---

function scoreOwnership(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  let score = 0;
  for (const r of repos) {
    const pushed = new Date(r.pushed_at).getTime();
    const created = r.created_at ? new Date(r.created_at).getTime() : pushed;
    const spanDays = (pushed - created) / (24 * 60 * 60 * 1000);
    if (spanDays >= 180) {
      score += 5;
      exp.push(`Ownership: +5 for repo "${r.name}" with long-lived history (span >= 180 days; used created_at vs pushed_at where first_commit unavailable)`);
      break;
    }
  }
  if (repos.some((r) => r.has_deploy_config)) {
    score += 5;
    exp.push("Ownership: +5 for at least one repo with deploy config");
  }
  if (repos.some((r) => r.has_tests && r.has_ci && r.has_lint)) {
    score += 5;
    exp.push("Ownership: +5 for repo with tests + CI + lint");
  }
  score = Math.min(15, score);
  return { score, explanations: exp };
}

function scoreEngineeringMaturity(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  let score = 0;
  if (repos.some((r) => r.has_docker)) {
    score += 3;
    exp.push("Engineering maturity: +3 for Docker");
  }
  if (repos.some((r) => r.has_ci && r.has_tests)) {
    score += 3;
    exp.push("Engineering maturity: +3 for CI and tests");
  }
  if (repos.some((r) => r.has_lint && r.has_tests)) {
    score += 4;
    exp.push("Engineering maturity: +4 for lint and tests");
  }
  score = Math.min(10, score);
  return { score, explanations: exp };
}

function scoreCollaborationImpact(
  repos: NormalizedRepo[]
): { score: number; explanations: string[] } {
  const exp: string[] = [];
  let score = 0;
  if (repos.some((r) => r.forks_count >= 10 || r.stargazers_count >= 25)) {
    score += 5;
    exp.push("Collaboration/impact: +5 for repo with forks>=10 or stars>=25");
  }
  exp.push(
    "Collaboration: open_issues field not used (not in normalized input); commit message quality not measured — limitation noted"
  );
  score = Math.min(10, score);
  return { score, explanations: exp };
}

const LIBRARY_KEYWORDS = ["sdk", "lib", "package", "client"];

function scoreRaritySignals(repos: NormalizedRepo[]): { score: number; explanations: string[] } {
  const exp: string[] = [];
  let score = 0;
  const complex = repos.some(
    (r) =>
      r.size >= 2000 ||
      Object.keys(r.languages).length >= 4 ||
      (r.has_docker && r.has_ci && r.has_tests)
  );
  if (complex) {
    score += 5;
    exp.push("Rarity: +5 for complex repo (size>=2000 or 4+ languages or docker+CI+tests)");
  }
  const libraryLike = repos.some((r) => {
    const nameLower = r.name.toLowerCase();
    const hasKeyword = LIBRARY_KEYWORDS.some((k) => nameLower.includes(k));
    return hasKeyword && r.has_readme && r.has_tests;
  });
  if (libraryLike) {
    score += 5;
    exp.push("Rarity: +5 for library/package-like repo (name + readme + tests)");
  }
  if (complex && libraryLike) {
    score += 2;
    exp.push("Rarity: +2 for both complex and library-like");
  }
  score = Math.min(12, score); // category can go slightly over 10
  return { score, explanations: exp };
}

/** Main entry: compute full score breakdown. Scores can exceed 100. */
export function scoreGithubProfile(input: GithubAnalysisInput): ScoreBreakdown {
  const { repos } = input;
  const explanations: string[] = [];

  const top = topRepos(repos, TOP_N);
  if (top.length === 0) {
    return {
      baseTotal: 0,
      bonusTotal: 0,
      finalScore: 0,
      categoryScores: {
        codeQuality: 0,
        projectSubstance: 0,
        documentation: 0,
        testingCI: 0,
        activity: 0,
        techBreadth: 0,
      },
      bonusScores: {
        ownership: 0,
        engineeringMaturity: 0,
        collaborationImpact: 0,
        raritySignals: 0,
      },
      explanations: ["No non-fork repos to score."],
    };
  }

  const doc = scoreDocumentation(repos);
  const testCi = scoreTestingCI(repos);
  const activity = scoreActivity(repos);
  const tech = scoreTechBreadth(repos);
  const substance = scoreProjectSubstance(repos);
  const code = scoreCodeQuality(repos);

  const categoryScores: ScoringCategoryScores = {
    codeQuality: code.score,
    projectSubstance: substance.score,
    documentation: doc.score,
    testingCI: testCi.score,
    activity: activity.score,
    techBreadth: tech.score,
  };

  const baseTotal = Math.min(
    100,
    code.score +
      substance.score +
      doc.score +
      testCi.score +
      activity.score +
      tech.score
  );
  explanations.push(
    `Base total: ${baseTotal}/100 (Code Quality ${code.score}/30, Project Substance ${substance.score}/25, Documentation ${doc.score}/15, Testing/CI ${testCi.score}/15, Activity ${activity.score}/10, Tech Breadth ${tech.score}/5)`
  );
  explanations.push(...code.explanations, ...substance.explanations, ...doc.explanations, ...testCi.explanations, ...activity.explanations, ...tech.explanations);

  const own = scoreOwnership(repos);
  const eng = scoreEngineeringMaturity(repos);
  const collab = scoreCollaborationImpact(repos);
  const rarity = scoreRaritySignals(repos);

  let bonusTotal =
    own.score + eng.score + collab.score + rarity.score;
  bonusTotal = Math.min(BONUS_CAP, bonusTotal);
  const bonusScores: BonusScores = {
    ownership: own.score,
    engineeringMaturity: eng.score,
    collaborationImpact: collab.score,
    raritySignals: rarity.score,
  };
  explanations.push(
    `Bonus total: ${bonusTotal} (capped at ${BONUS_CAP}) — Ownership ${own.score}/15, Engineering Maturity ${eng.score}/10, Collaboration ${collab.score}/10, Rarity ${rarity.score}`
  );
  explanations.push(...own.explanations, ...eng.explanations, ...collab.explanations, ...rarity.explanations);

  const finalScore = baseTotal + bonusTotal;

  return {
    baseTotal,
    bonusTotal,
    finalScore,
    categoryScores,
    bonusScores,
    explanations,
  };
}

// --- Legacy helpers for report (backward compat) ---

export function deriveStrengths(repos: RepoAnalysis[], scores: CategoryScores): string[] {
  const strengths: string[] = [];
  if (scores.documentation >= 70) strengths.push("Strong documentation (READMEs present across repos)");
  if (scores.testing >= 60) strengths.push("Good test and CI practices");
  if (scores.activity >= 60) strengths.push("Recent commit activity and engagement");
  if (scores.projects >= 60) strengths.push("Notable projects with clear descriptions");
  if (scores.techBreadth >= 50) strengths.push("Diverse technology usage");
  if (scores.codeQuality >= 60) strengths.push("Code quality signals (docs, tests, CI)");
  if (repos.some((r) => r.stars > 10)) strengths.push("At least one repo with notable stars");
  if (strengths.length === 0) strengths.push("Profile shows potential with more structure");
  return strengths;
}

export function deriveWeaknesses(repos: RepoAnalysis[], scores: CategoryScores): string[] {
  const weaknesses: string[] = [];
  if (scores.documentation < 50) weaknesses.push("Missing or sparse READMEs");
  if (scores.testing < 40) weaknesses.push("Limited testing or CI visibility");
  if (scores.activity < 40) weaknesses.push("Low recent activity on analyzed repos");
  if (scores.projects < 40) weaknesses.push("Few projects with clear descriptions");
  if (scores.techBreadth < 30 && repos.length > 0) weaknesses.push("Narrow tech stack visibility");
  if (repos.length < 3) weaknesses.push("Few public repos to assess");
  if (weaknesses.length === 0) weaknesses.push("No major gaps identified");
  return weaknesses;
}

export function buildHighlights(repos: RepoAnalysis[]): Array<{ repo: string; reason: string; url: string }> {
  return repos.slice(0, 5).map((r) => {
    const reasons: string[] = [];
    if (r.hasReadme) reasons.push("documented");
    if (r.hasTests) reasons.push("tests");
    if (r.hasCI) reasons.push("CI");
    if (r.stars > 0) reasons.push(`${r.stars} stars`);
    if (r.description) reasons.push("clear description");
    const reason = reasons.length ? reasons.join(", ") : "recent activity";
    return { repo: r.name, reason, url: r.url };
  });
}

export function deriveGrowthAreas(repos: RepoAnalysis[], scores: CategoryScores): string[] {
  const areas: string[] = [];
  if (scores.documentation < 70) areas.push("Add READMEs to key repos with setup and usage");
  if (scores.testing < 50) areas.push("Introduce tests (e.g. Jest, pytest) and CI (e.g. GitHub Actions)");
  if (scores.activity < 50) areas.push("Keep at least a few repos updated in the last 6 months");
  if (scores.projects < 50) areas.push("Write short descriptions for each public repo");
  if (areas.length === 0) areas.push("Consider highlighting 1–2 flagship projects on your profile");
  return areas;
}

export function getRecommendation(finalScore: number): RecommendationLevel {
  if (finalScore >= 75) return "strong_yes";
  if (finalScore >= 60) return "yes";
  if (finalScore >= 40) return "maybe";
  return "no";
}

/** Build full analysis report; uses normalized repos and attaches scoreBreakdown. */
export function buildReport(
  username: string,
  user: GitHubUser,
  normalizedRepos: NormalizedRepo[]
): AnalysisReport {
  const analyzedRepos: RepoAnalysis[] = normalizedRepos.map(normalizedToRepoAnalysis);

  const input: GithubAnalysisInput = {
    user: {
      login: user.login,
      followers: user.followers,
      public_repos: user.public_repos,
      created_at: user.created_at ?? new Date(0).toISOString(),
    },
    repos: normalizedRepos,
  };

  const scoreBreakdown = scoreGithubProfile(input);
  const finalScore = scoreBreakdown.finalScore;

  // Map new category keys to legacy CategoryScores for derive* and UI compat
  const categoryScores: CategoryScores = {
    codeQuality: scoreBreakdown.categoryScores.codeQuality,
    projects: scoreBreakdown.categoryScores.projectSubstance,
    documentation: scoreBreakdown.categoryScores.documentation,
    testing: scoreBreakdown.categoryScores.testingCI,
    activity: scoreBreakdown.categoryScores.activity,
    techBreadth: scoreBreakdown.categoryScores.techBreadth,
  };

  const recommendation = getRecommendation(finalScore);

  const allLangs = new Set<string>();
  analyzedRepos.forEach((r) => {
    Object.keys(r.languages).forEach((l) => allLangs.add(l));
    if (r.language) allLangs.add(r.language);
  });
  const topLanguages = Array.from(allLangs).slice(0, 5);

  return {
    username,
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      profileUrl: user.html_url,
      topLanguages,
    },
    overallScore: finalScore,
    categoryScores,
    scoreBreakdown,
    strengths: deriveStrengths(analyzedRepos, categoryScores),
    weaknesses: deriveWeaknesses(analyzedRepos, categoryScores),
    technicalHighlights: buildHighlights(analyzedRepos),
    growthAreas: deriveGrowthAreas(analyzedRepos, categoryScores),
    recommendation,
    analyzedRepos,
    fetchedAt: new Date().toISOString(),
  };
}
