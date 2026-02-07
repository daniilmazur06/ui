const BASE_CATEGORIES = [
  {
    name: "Code Quality",
    weight: 30,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    bullets: [
      "Clean project structure and naming conventions",
      "Consistent code style with linting configs",
      "Proper use of language-specific patterns",
      "Separation of concerns across files and modules",
    ],
  },
  {
    name: "Project Substance",
    weight: 25,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    bullets: [
      "Non-trivial repos with real features",
      "Stars, forks, and community traction",
      "Meaningful descriptions and README content",
      "Active development with recent pushes",
    ],
  },
  {
    name: "Documentation",
    weight: 15,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    bullets: [
      "Presence and quality of README files",
      "Setup instructions and usage examples",
      "API documentation or contributing guides",
      "README length relative to project complexity",
    ],
  },
  {
    name: "Testing / CI",
    weight: 15,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    bullets: [
      "Test files and test framework configuration",
      "CI/CD workflows (GitHub Actions, etc.)",
      "Test indicators in package configs",
      "Evidence of automated quality gates",
    ],
  },
  {
    name: "Activity",
    weight: 10,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    bullets: [
      "Recent commits and push activity",
      "Consistency of contributions over time",
      "Active maintenance of existing repos",
      "Account age vs. activity level ratio",
    ],
  },
  {
    name: "Tech Breadth",
    weight: 5,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    bullets: [
      "Diversity of programming languages used",
      "Experience across different tech domains",
      "Docker, deployment, and infrastructure configs",
      "Usage of modern tooling and frameworks",
    ],
  },
];

const BONUS_CATEGORIES = [
  { name: "Exceptional Ownership", max: 15, description: "Long-maintained repos with deep commit history and consistent improvement." },
  { name: "Engineering Maturity", max: 10, description: "Evidence of linting, Docker, deployment configs, and production-grade setup." },
  { name: "Collaboration & Impact", max: 10, description: "Stars, forks, watchers, and signs of community contribution." },
  { name: "Rarity Signals", max: 12, description: "Unique patterns like monorepos, template repos, or archived projects showing breadth." },
];

export default function CriteriaPage() {
  return (
    <div className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">Evaluation Criteria</h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            How we score GitHub profiles. A transparent look at the signals we measure and why.
          </p>
        </div>

        {/* Base Score */}
        <section className="mb-16">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-xl font-bold text-foreground">Base Score</h2>
            <span className="text-sm text-muted-foreground font-medium">up to 100 points</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BASE_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      {cat.weight} points max
                    </p>
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5 text-sm text-secondary-foreground">
                  {cat.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="text-primary mt-0.5 flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Bonus Score */}
        <section className="mb-16">
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-xl font-bold text-foreground">Bonus Score</h2>
            <span className="text-sm text-muted-foreground font-medium">up to ~45 additional points</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {BONUS_CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    +{cat.max} max
                  </span>
                </div>
                <p className="text-sm text-secondary-foreground leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Philosophy Callout */}
        <section>
          <div className="rounded-lg border border-primary/20 bg-accent p-6">
            <h3 className="font-semibold text-accent-foreground mb-2">Scoring Philosophy</h3>
            <p className="text-sm text-accent-foreground/80 leading-relaxed">
              Our scoring is designed to reflect real-world engineering quality, not just activity volume.
              A base score of <strong>80 is already high</strong> and indicates a strong engineering profile.
              Scores exceeding <strong>100 are rare</strong> and require exceptional signals across multiple bonus categories.
              The system rewards depth, consistency, and production-readiness over raw commit counts.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
