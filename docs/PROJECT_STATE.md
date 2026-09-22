# PROJECT_STATE

## Objective
Refresh Sanam Rai's portfolio into a polished backend-focused engineering portfolio while preserving the existing interactive backend demonstration. Add Forge, an original lightweight living companion driven by a sprite sheet, cursor-aware motion, idle behavior, subtle particles, mobile ambient movement, and reduced-motion fallbacks.

## Current branch
`feat/forge-living-portfolio`

The branch existed before this phase at an older June commit. It had no commits ahead of `master` and was eight commits behind, so it was safely fast-forwarded to current `master` (`ca72e2e`) without force-updating divergent work.

## Completed phase
**Phase 1 — Forge living portfolio UI implementation + repository verification**

- Mapped the frontend/backend split and preserved the independent package structure.
- Preserved the backend lab API contracts for system state, controls, logs, projects, and auth.
- Reworked navigation, hero hierarchy, engineering identity, project presentation, backend control panel, observability console, architecture section, auth overlay, and footer.
- Added reusable `LivingForge` behavior with cleanup for listeners, timers, animation frames, and generated sparkle nodes.
- Added a 1536 × 2288, 8 × 11 SVG sprite sheet using 192 × 208 cells. Rows 0–8 contain the requested Forge behaviors; rows 9–10 are intentionally empty.
- Improved keyboard focus treatment and converted the visual system toggle into a semantic switch control.
- Kept the existing static project fallback alongside the live backend-fetched project section.
- Committed the implementation as `73e7f89 feat: add living Forge companion to portfolio`.

## Files changed
- `frontend/src/App.jsx`
- `frontend/src/NavBar.jsx`
- `frontend/src/HeroSection.jsx`
- `frontend/src/InfoSection.jsx`
- `frontend/src/Projects.jsx`
- `frontend/src/SystemControl.jsx`
- `frontend/src/Logs.jsx`
- `frontend/src/TechStack.jsx`
- `frontend/src/Footer.jsx`
- `frontend/src/Form.jsx`
- `frontend/src/reusable/ProjectCard.jsx`
- `frontend/src/reusable/Toggle.jsx`
- `frontend/src/LivingForge.jsx`
- `frontend/src/LivingForge.css`
- `frontend/src/index.css`
- `frontend/public/forge/forge-sprite.svg`
- `docs/PROJECT_STATE.md`

No backend source file was changed.

## Verification performed
- Confirmed repository default branch is `master`.
- Confirmed the requested feature branch had no unique commits before fast-forwarding it.
- Inspected frontend package scripts and confirmed frontend uses Vite + React 19 + Tailwind 4 plus regular CSS.
- Inspected the backend route/controller/middleware path for authentication, database switching, caching, logging, rate limiting, pagination, project fetching, controls, and system state before editing.
- Confirmed the feature implementation diff contains only frontend/docs changes and is based directly on current `master`.
- Existing API endpoints consumed by the frontend remain unchanged: `/api/system`, `/api/controls`, `/api/logs`, `/api/projects`, and `/api/auth/login`.
- Confirmed the committed Forge asset declares `1536 × 2288` and the component uses the requested 192 × 208 frame geometry.
- Static JSX parsing with the locally available TypeScript parser succeeded for `App.jsx`, `LivingForge.jsx`, and `reusable/Toggle.jsx`.
- The previous `master` Vercel deployment was green. The preview deployment for implementation commit `73e7f89` is currently **failed**. GitHub only exposes Vercel's instruction to inspect deployment `dpl_AU86f6YNzmnmjDNQYKZSwGu2jfHg` logs; the underlying Vercel build log is not available through the currently connected repository integration.
- Local shell validation could not be completed in the available execution sandbox because outbound DNS/network access prevented cloning/installing the GitHub repository. Do not treat `npm install`, `npm run build`, `npm run lint`, or browser interaction checks as verified.

## Known risks
- The Vercel preview failure is unresolved until its deployment/build logs are inspected.
- `npm install`, `npm run build`, and `npm run lint` still need to be executed in a normal networked checkout.
- Desktop cursor-following, cursor-distance behavior, idle sequence, sparkle density, viewport-leave return, mobile ambient placement, keyboard flow, reduced-motion rendering, auth overlay, live logs, API ping, resume links, and backend toggles require browser-level manual verification.
- The backend package currently has no runnable automated test suite; its `test` script intentionally exits with an error.
- Some static project entries reference image paths that are not present in the current public project-assets directory. Project cards now fail gracefully by hiding a broken image, but the missing source artwork was not invented or deleted.
- The backend's rate-limit middleware is present in source but is not currently included in the project route's middleware chain. This phase deliberately does not change backend routing.
- The backend CORS configuration currently allows only the production portfolio domains. A local Vite frontend pointed at a local backend will require a development CORS allowance before browser API calls can succeed.

## Next phase
Inspect the failed Vercel deployment log, then run the frontend in a normal checkout with install/build/lint. Manually validate Forge motion and every backend-lab state in desktop, mobile, keyboard, and reduced-motion modes. Fix only verified runtime/accessibility regressions, update this file with concrete results, and merge only after those checks are green.
