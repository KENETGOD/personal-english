# personal-english

English Coach — a personal web app to practice English (B1–B2) with a focus on conversational fluency, grammar and pronunciation.

Stack: Next.js 16 + TypeScript · Supabase · Vercel · AI SDK (Claude) · Azure Speech.

## Requirements

- Node.js 24+

## Scripts

| Command                           | Purpose                                       |
| --------------------------------- | --------------------------------------------- |
| `npm run dev`                     | Development server                            |
| `npm run build`                   | Production build                              |
| `npm run lint`                    | ESLint                                        |
| `npm run format` / `format:check` | Prettier                                      |
| `npm run typecheck`               | Generate route types and run `tsc`            |
| `npm test`                        | Unit tests (Vitest)                           |
| `npm run test:coverage`           | Unit tests with coverage (domain logic ≥ 80%) |
| `npm run test:e2e`                | E2E tests (Playwright, desktop + 360 px)      |
