import Link from "next/link";

const TEAM = [
  {
    name: "Daniil Mazur",
    role: "Developer",
    initials: "DM",
  },
  {
    name: "Lars Ponikvar",
    role: "Developer",
    initials: "LP",
  },
  {
    name: "Igor Wozniak",
    role: "Developer",
    initials: "IW",
  },
];

export default function AboutPage() {
  return (
    <div className="px-6 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Mission */}
        <section className="text-center mb-16">
          <h1 className="text-3xl font-bold text-foreground mb-3 text-balance">About Headstarter Track</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Turn GitHub profiles into hiring-ready insights. We built Headstarter Track to give recruiters
            and developers a fast, transparent way to evaluate engineering quality from public GitHub activity.
          </p>
        </section>

        {/* How We Built This */}
        <section className="mb-16">
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-secondary-foreground leading-relaxed mb-4">
              Hiring decisions often rely on resumes and interviews alone. We believe a developer{"'"}s
              public code tells a richer story -- one of consistency, craft, and continuous learning.
            </p>
            <p className="text-secondary-foreground leading-relaxed">
              Headstarter Track analyzes GitHub profiles using a transparent, multi-dimensional scoring
              model that evaluates code quality, project substance, documentation, testing practices,
              activity patterns, and technical breadth. The result is a comprehensive report that highlights
              strengths, identifies growth areas, and provides a clear hiring recommendation.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-foreground text-center mb-8">The Team</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="rounded-lg border border-border bg-card p-6 shadow-sm text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-lg font-bold mb-4">
                  {member.initials}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hackathon callout */}
        <section className="mb-16">
          <div className="rounded-lg border border-primary/20 bg-accent p-6 text-center">
            <p className="text-accent-foreground font-medium mb-1">
              Junior students of St. John{"'"}s University
            </p>
            <p className="text-sm text-accent-foreground/80">
              Built for St. John{"'"}s Hacks Hackathon
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            Try Headstarter Track
          </Link>
        </section>
      </div>
    </div>
  );
}
