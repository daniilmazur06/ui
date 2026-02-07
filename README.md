# Headstarter Track

Turn GitHub profiles into hiring-ready insights. Enter a GitHub username, run analysis, and get a structured report with scores, strengths, weaknesses, and a hiring recommendation.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create a `.env.local` in the project root:

   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   ```

   - Get a token: [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens).
   - Without `GITHUB_TOKEN`, the app still works but is subject to strict GitHub API rate limits (60 requests/hour for unauthenticated requests).

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Env vars

| Variable       | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `GITHUB_TOKEN` | No       | GitHub PAT for higher rate limits (recommended). |

## Usage

1. Go to the landing page.
2. Enter a GitHub username and click **Analyze Profile**.
3. Wait ~10–30 seconds (or less if the result is cached).
4. View the report at `/report/[username]`: overall score, category scores, strengths, weaknesses, technical highlights, growth areas, and recommendation (Strong Yes / Yes / Maybe / No).

## Project structure

- `app/` — Next.js App Router: landing (`/`), report (`/report/[username]`), placeholders (Privacy, Contact).
- `app/api/analyze/` — `POST /api/analyze`: accepts `{ username, skipCache? }`, returns the analysis report.
- `lib/types.ts` — Shared TypeScript types for GitHub, report, and API.
- `lib/github.ts` — GitHub API: user, repos (no forks), languages, repo contents (README, CI, test indicators).
- `lib/scoring.ts` — Rule-based scoring and report building (categories, strengths, weaknesses, highlights, growth areas, recommendation).
- `lib/cache.ts` — In-memory cache for analysis results (15-minute TTL) to reduce GitHub requests.

## Optional: AI refinement (TODO)

A separate function can later call an LLM to refine:

- strengths / weaknesses
- technical highlights
- growth plan
- final recommendation

Use a strict JSON output schema when integrating the LLM.

## Scripts

- `npm run dev` — Start dev server.
- `npm run build` — Production build.
- `npm run start` — Run production server.
- `npm run lint` — Run ESLint.
