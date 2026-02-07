import { describe, it, expect } from "vitest";
import { scoreGithubProfile } from "./scoring";
import type { GithubAnalysisInput, NormalizedRepo } from "./types";

function makeRepo(overrides: Partial<NormalizedRepo> = {}): NormalizedRepo {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    name: "repo",
    full_name: "user/repo",
    html_url: "https://github.com/user/repo",
    description: null,
    fork: false,
    stargazers_count: 0,
    forks_count: 0,
    watchers_count: 0,
    size: 100,
    language: "JavaScript",
    updated_at: weekAgo.toISOString(),
    pushed_at: weekAgo.toISOString(),
    has_readme: false,
    readme_length: 0,
    languages: { JavaScript: 1000 },
    has_tests: false,
    has_ci: false,
    has_lint: false,
    has_docker: false,
    has_deploy_config: false,
    ...overrides,
  };
}

const baseUser = {
  login: "testuser",
  followers: 0,
  public_repos: 5,
  created_at: "2020-01-01T00:00:00Z",
};

describe("scoreGithubProfile", () => {
  it("scores a low-activity profile (low base, no bonus)", () => {
    const input: GithubAnalysisInput = {
      user: baseUser,
      repos: [
        makeRepo({
          pushed_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
          description: null,
          has_readme: false,
          has_tests: false,
          has_ci: false,
        }),
        makeRepo({
          pushed_at: new Date(Date.now() - 500 * 24 * 60 * 60 * 1000).toISOString(),
          description: null,
        }),
      ],
    };
    const result = scoreGithubProfile(input);
    expect(result.baseTotal).toBeLessThanOrEqual(100);
    expect(result.bonusTotal).toBeLessThanOrEqual(45);
    expect(result.finalScore).toBe(result.baseTotal + result.bonusTotal);
    expect(result.categoryScores.activity).toBeLessThanOrEqual(4); // 180+ days => 2 or 4
    expect(result.explanations.length).toBeGreaterThan(0);
  });

  it("scores a strong profile with tests, CI, readmes (high base)", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const input: GithubAnalysisInput = {
      user: { ...baseUser, followers: 10 },
      repos: [
        makeRepo({
          pushed_at: twoWeeksAgo.toISOString(),
          has_readme: true,
          readme_length: 1500,
          has_tests: true,
          has_ci: true,
          has_lint: true,
          description: "A well-documented project with tests and CI.",
          size: 300,
          languages: { TypeScript: 5000, JavaScript: 2000 },
        }),
        makeRepo({
          pushed_at: twoWeeksAgo.toISOString(),
          has_readme: true,
          readme_length: 500,
          has_tests: true,
          has_ci: true,
          description: "Another solid repo.",
          size: 250,
        }),
        makeRepo({
          pushed_at: twoWeeksAgo.toISOString(),
          has_readme: true,
          readme_length: 800,
          has_tests: true,
          description: "Good repo.",
        }),
      ],
    };
    const result = scoreGithubProfile(input);
    expect(result.baseTotal).toBeGreaterThan(30);
    expect(result.categoryScores.documentation).toBeGreaterThan(0);
    expect(result.categoryScores.testingCI).toBeGreaterThan(0);
    expect(result.categoryScores.codeQuality).toBeGreaterThan(0);
    expect(result.categoryScores.activity).toBeGreaterThanOrEqual(6);
  });

  it("allows finalScore to exceed 100 when bonus applies", () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const createdOld = new Date(Date.now() - 250 * 24 * 60 * 60 * 1000);
    // Build enough base (many strong repos) + bonus so finalScore > 100
    const strongRepo = makeRepo({
      name: "my-sdk",
      pushed_at: oneDayAgo.toISOString(),
      created_at: createdOld.toISOString(),
      has_readme: true,
      readme_length: 2000,
      has_tests: true,
      has_ci: true,
      has_lint: true,
      has_docker: true,
      has_deploy_config: true,
      description: "A library for doing things with proper documentation and tooling.",
      size: 2500,
      stargazers_count: 30,
      forks_count: 12,
      languages: { TypeScript: 10000, JavaScript: 5000, CSS: 2000, HTML: 1000 },
    });
    const repos = [
      strongRepo,
      ...Array.from({ length: 8 }, () =>
        makeRepo({
          pushed_at: oneDayAgo.toISOString(),
          has_readme: true,
          readme_length: 600,
          has_tests: true,
          has_ci: true,
          has_lint: true,
          description: "Another project with good signals and structure.",
          size: 300,
          stargazers_count: 5,
        })
      ),
    ];
    const input: GithubAnalysisInput = { user: baseUser, repos };
    const result = scoreGithubProfile(input);
    expect(result.bonusTotal).toBeGreaterThan(0);
    expect(result.finalScore).toBeGreaterThan(100);
    expect(result.bonusScores.ownership).toBeGreaterThan(0);
    expect(result.bonusScores.engineeringMaturity).toBeGreaterThan(0);
    expect(result.bonusScores.raritySignals).toBeGreaterThan(0);
    expect(result.explanations.some((e) => e.includes("Bonus total"))).toBe(true);
  });

  it("returns zero breakdown for empty repos", () => {
    const result = scoreGithubProfile({ user: baseUser, repos: [] });
    expect(result.baseTotal).toBe(0);
    expect(result.bonusTotal).toBe(0);
    expect(result.finalScore).toBe(0);
    expect(result.explanations).toContain("No non-fork repos to score.");
  });

  it("caps bonus total at 45", () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const createdOld = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000);
    const input: GithubAnalysisInput = {
      user: baseUser,
      repos: Array.from({ length: 5 }, (_, i) =>
        makeRepo({
          name: `sdk-${i}`,
          pushed_at: oneDayAgo.toISOString(),
          created_at: createdOld.toISOString(),
          has_readme: true,
          readme_length: 2000,
          has_tests: true,
          has_ci: true,
          has_lint: true,
          has_docker: true,
          has_deploy_config: true,
          size: 3000,
          stargazers_count: 50,
          forks_count: 20,
          languages: { TypeScript: 1, JavaScript: 1, Go: 1, Rust: 1 },
        })
      ),
    };
    const result = scoreGithubProfile(input);
    expect(result.bonusTotal).toBeLessThanOrEqual(45);
  });
});
