# PROJECT_STATE

## Objective
Refresh Sanam Rai's portfolio into a polished backend-focused engineering portfolio while preserving the existing interactive backend demonstration. Add Forge, an original lightweight living companion driven by a sprite sheet, cursor-aware motion, idle behavior, subtle particles, mobile ambient movement, and reduced-motion fallbacks.

## Current branch
`feat/forge-living-portfolio`

The branch existed before this phase at an older June commit. It had no commits ahead of `master` and was eight commits behind, so it was safely fast-forwarded to current `master` (`ca72e2e`) without force-updating divergent work.

## Completed phase
**Phase 1 — Forge living portfolio UI implementation**

- Mapped the frontend/backend split and preserved the independent package structure.
- Preserved the backend lab API contracts for system state, controls, logs, projects, and auth.
- Reworked navigation, hero hierarchy, engineering identity, project presentation, backend control panel, observability console, architecture section, auth overlay, and footer.
- Added reusable `LivingForge` behavior with cleanup for listeners, timers, animation frames, and generated sparkle nodes.
- Added a 1536 × 2288, 8 × 11 SVG sprite sheet using 192 × 208 cells. Rows 0–8 contain the requested Forge behaviors; rows 9–10 are intentionally empty.
- Improved keyboard focus treatment and converted the visual system toggle into a semantic switch control.
- Kept the existing static project fallback alongside the live backend-fetched project section.

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

## Verification performed
- Confirmed repository default branch is `master`.
- Confirmed the requested feature branch had no unique commits before fast-forwarding it.
- Inspected frontend package scripts and confirmed frontend uses Vite + React 19 + Tailwind 4 plus regular CSS.
- Inspected the backend route/controller/middleware path for authentication, database switching, caching, logging, rate limiting, pagination, project fetching, controls, and system state before editing.
- No backend source files are changed in this phase.
- Existing API endpoints consumed by the frontend remain unchanged: `/api/system`, `/api/controls`, `/api/logs`, `/api/projects`, and `/api/auth/login`.
- Local shell validation could not be completed in the available execution sandbox because outbound DNS/network access prevented cloning/installing the GitHub repository. Do not treat build/lint or interactive browser checks as verified yet.

## Known risks
- `npm install`, `npm run build`, and `npm run lint` still need to be executed in a normal networked checkout.
- Desktop cursor-following, sparkle density, mobile ambient placement, keyboard flow, reduced-motion rendering, auth overlay, live logs, and backend toggles require browser-level manual verification.
- The backend package currently has no runnable automated test suite; its `test` script intentionally exits with an error.
- Some static project entries reference image paths that are not present in the current public project-assets directory. Project cards now fail gracefully by hiding a broken image, but the missing source artwork was not invented or deleted.
- The backend's rate-limit middleware is present in source but is not currently included in the project route's middleware chain. This phase deliberately does not change backend routing because the requested scope is the portfolio UI/Forge layer.

## Next phase
Run the frontend in a normal checkout, execute install/build/lint, then manually validate Forge motion and every backend-lab state. Fix only verified runtime or accessibility regressions, update this state file with concrete results, and merge only after those checks are green.
