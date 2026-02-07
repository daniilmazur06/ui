// GitHub API response shapes (minimal)
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count?: number;
  updated_at: string;
  pushed_at?: string;
  language: string | null;
  fork: boolean;
  default_branch: string;
  size?: number; // KB
  has_issues?: boolean;
  created_at?: string;
}

export interface RepoAnalysis {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  languages: Record<string, number>;
  stars: number;
  updatedAt: string;
  hasReadme: boolean;
  hasCI: boolean;
  hasTests: boolean;
  testIndicators: string[];
}

// Category scores 0–100
export type CategoryKey =
  | "codeQuality"
  | "projects"
  | "documentation"
  | "testing"
  | "activity"
  | "techBreadth";

export interface CategoryScores {
  codeQuality: number;
  projects: number;
  documentation: number;
  testing: number;
  activity: number;
  techBreadth: number;
}

export type RecommendationLevel = "strong_yes" | "yes" | "maybe" | "no";

export interface AnalysisReport {
  username: string;
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    publicRepos: number;
    followers: number;
    following: number;
    profileUrl: string;
    topLanguages: string[];
  };
  /** Same as scoreBreakdown.finalScore (can exceed 100). */
  overallScore: number;
  categoryScores: CategoryScores;
  /** New scoring breakdown: base + bonus, scores can exceed 100. */
  scoreBreakdown?: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  technicalHighlights: Array<{
    repo: string;
    reason: string;
    url: string;
  }>;
  growthAreas: string[];
  recommendation: RecommendationLevel;
  analyzedRepos: RepoAnalysis[];
  fetchedAt: string;
}

// --- Scoring system (scores can exceed 100 with bonuses) ---

/** Normalized repo shape used as input to scoreGithubProfile */
export interface NormalizedRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number; // KB
  language: string | null;
  topics?: string[];
  updated_at: string;
  pushed_at: string;
  has_readme: boolean;
  readme_length: number;
  languages: Record<string, number>;
  has_tests: boolean;
  has_ci: boolean;
  has_lint: boolean;
  has_docker: boolean;
  has_deploy_config: boolean;
  is_archived?: boolean;
  is_template?: boolean;
  created_at?: string; // repo creation, for ownership span
}

export interface GithubAnalysisUser {
  login: string;
  followers: number;
  public_repos: number;
  created_at: string;
}

/** Input to scoreGithubProfile */
export interface GithubAnalysisInput {
  user: GithubAnalysisUser;
  repos: NormalizedRepo[];
}

/** Base category scores (max 100 total). */
export interface ScoringCategoryScores {
  codeQuality: number;
  projectSubstance: number;
  documentation: number;
  testingCI: number;
  activity: number;
  techBreadth: number;
}

/** Additive bonus scores (typical 0–45, can push finalScore > 100). */
export interface BonusScores {
  ownership: number;
  engineeringMaturity: number;
  collaborationImpact: number;
  raritySignals: number;
}

export interface ScoreBreakdown {
  baseTotal: number;
  bonusTotal: number;
  finalScore: number;
  categoryScores: ScoringCategoryScores;
  bonusScores: BonusScores;
  explanations: string[];
}

// API request/response
export interface AnalyzeRequest {
  username: string;
  skipCache?: boolean;
}

export interface AnalyzeResponse {
  success: true;
  report: AnalysisReport;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}
