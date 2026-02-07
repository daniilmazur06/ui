import type {
  RepoAnalysis,
  CategoryScores,
  RecommendationLevel,
  AnalysisReport,
} from "./types";
import type { GitHubUser } from "./types";

export function scoreDocumentation(repos: RepoAnalysis[]): number {
  if (repos.length === 0) return 0;
  const withReadme = repos.filter((r) => r.hasReadme).length;
  return Math.min(100, Math.round((withReadme / repos.length) * 100) + (withReadme === repos.length ? 15 : 0));
}

export function scoreTesting(repos: RepoAnalysis[]): number {
  if (repos.length === 0) return 0;
  const withTests = repos.filter((r) => r.hasTests).length;
  const withCI = repos.filter((r) => r.hasCI).length;
  const testScore = (withTests / repos.length) * 60;
  const ciScore = (withCI / repos.length) * 40;
  return Math.min(100, Math.round(testScore + ciScore));
}

export function scoreActivity(repos: RepoAnalysis[], user: GitHubUser): number {
  if (repos.length === 0) return 0;
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
  const recent = repos.filter((r) => new Date(r.updatedAt).getTime() > sixMonthsAgo).length;
  const activityFromRepos = Math.min(100, (recent / Math.max(repos.length, 1)) * 100);
  const followerBonus = Math.min(20, user.followers);
  return Math.min(100, Math.round(activityFromRepos * 0.8 + followerBonus * 0.4));
}

export function scoreProjects(repos: RepoAnalysis[]): number {
  if (repos.length === 0) return 0;
  const withDesc = repos.filter((r) => r.description && r.description.length > 10).length;
  const starWeight = repos.reduce((s, r) => s + Math.min(r.stars, 50), 0) / repos.length;
  const projectScore = Math.min(60, (withDesc / repos.length) * 60) + Math.min(40, starWeight * 2);
  return Math.min(100, Math.round(projectScore));
}

export function scoreCodeQuality(repos: RepoAnalysis[]): number {
  if (repos.length === 0) return 0;
  const withReadme = repos.filter((r) => r.hasReadme).length;
  const withTests = repos.filter((r) => r.hasTests).length;
  const withCI = repos.filter((r) => r.hasCI).length;
  const avg =
    (withReadme / repos.length) * 30 +
    (withTests / repos.length) * 40 +
    (withCI / repos.length) * 30;
  return Math.min(100, Math.round(avg));
}

export function scoreTechBreadth(repos: RepoAnalysis[]): number {
  if (repos.length === 0) return 0;
  const allLangs = new Set<string>();
  repos.forEach((r) => {
    Object.keys(r.languages).forEach((l) => allLangs.add(l));
    if (r.language) allLangs.add(r.language);
  });
  const breadth = Math.min(100, allLangs.size * 15);
  return Math.round(breadth);
}

export function computeCategoryScores(
  repos: RepoAnalysis[],
  user: GitHubUser
): CategoryScores {
  return {
    codeQuality: scoreCodeQuality(repos),
    projects: scoreProjects(repos),
    documentation: scoreDocumentation(repos),
    testing: scoreTesting(repos),
    activity: scoreActivity(repos, user),
    techBreadth: scoreTechBreadth(repos),
  };
}

export function overallScoreFromCategories(categoryScores: CategoryScores): number {
  const sum =
    categoryScores.codeQuality * 0.2 +
    categoryScores.projects * 0.2 +
    categoryScores.documentation * 0.15 +
    categoryScores.testing * 0.2 +
    categoryScores.activity * 0.15 +
    categoryScores.techBreadth * 0.1;
  return Math.round(Math.min(100, sum));
}

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

export function getRecommendation(overall: number, scores: CategoryScores): RecommendationLevel {
  if (overall >= 75 && scores.testing >= 50 && scores.documentation >= 50) return "strong_yes";
  if (overall >= 60) return "yes";
  if (overall >= 40) return "maybe";
  return "no";
}

export function buildReport(
  username: string,
  user: GitHubUser,
  analyzedRepos: RepoAnalysis[]
): AnalysisReport {
  const categoryScores = computeCategoryScores(analyzedRepos, user);
  const overallScore = overallScoreFromCategories(categoryScores);
  const recommendation = getRecommendation(overallScore, categoryScores);

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
    overallScore,
    categoryScores,
    strengths: deriveStrengths(analyzedRepos, categoryScores),
    weaknesses: deriveWeaknesses(analyzedRepos, categoryScores),
    technicalHighlights: buildHighlights(analyzedRepos),
    growthAreas: deriveGrowthAreas(analyzedRepos, categoryScores),
    recommendation,
    analyzedRepos,
    fetchedAt: new Date().toISOString(),
  };
}
