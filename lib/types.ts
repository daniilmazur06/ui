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
  updated_at: string;
  language: string | null;
  fork: boolean;
  default_branch: string;
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
  overallScore: number;
  categoryScores: CategoryScores;
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
