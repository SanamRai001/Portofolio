# PROJECT_STATE

## Objective
Refresh Sanam Rai's portfolio into a polished backend-focused engineering portfolio while preserving the existing interactive backend demonstration. Add Forge, an original lightweight living companion driven by a sprite sheet, cursor-aware movement, idle behavior, subtle particles, mobile ambient movement, and reduced-motion fallbacks.

## Current authoritative branch
`master`

Source branch: `feat/forge-living-portfolio`

## Completed phase
**Forge living portfolio UI — merged to master**

- Reworked navigation, hero hierarchy, engineering identity, project presentation, backend control panel, observability console, architecture section, authentication overlay, and footer.
- Added reusable `LivingForge` behavior with listener/timer/animation-frame/particle cleanup.
- Added a transparent 1536 × 2288, 8 × 11 Forge sprite sheet using 192 × 208 cells.
- Added idle breathing, blink, look-around, thinking, waving, building, celebration, recovery, and supportive gesture rows; unused rows remain empty.
- Added desktop cursor-distance following, lightweight spring motion, subtle spark trail, viewport-leave return, touch-device ambient motion, and reduced-motion fallback.
- Improved keyboard focus states and converted backend feature controls to semantic switch buttons.
- Preserved the static project showcase alongside the backend-fetched project path.
- No backend source file was modified.

## Key files changed
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

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

Authentication overlay, project loading, database toggle state, cache state, logging, pagination, API ping, and system configuration continue to use the existing backend paths.

## Verification performed
- Confirmed `feat/forge-living-portfolio` was based directly on the current `master` and had no divergent history before implementation.
- Confirmed the implementation diff contains frontend/docs changes only and zero backend source changes.
- Confirmed the committed Forge asset declares 1536 × 2288 dimensions and uses 192 × 208 frame geometry.
- Confirmed the requested implementation commit exists: `73e7f89 feat: add living Forge companion to portfolio`.
- Repository-level Vercel deployment status was triggered for the feature work, but full local build/lint/browser validation was not available in the execution environment and is not claimed as complete.

## Known risks / existing observations
- Full browser-level verification of cursor motion, particles, mobile placement, reduced motion, authentication, logs, and every backend toggle should still be performed from a normal local checkout or deployed environment.
- The backend package has no runnable automated test suite; its current `test` script intentionally exits with an error.
- Some static project entries reference project image paths not currently present in `frontend/public/projects`; cards hide failed images rather than inventing replacements.
- `rateLimitMiddleware` exists in the backend but is not currently part of the project route middleware chain. This was left unchanged intentionally.
- Backend CORS currently allows the production portfolio domains rather than localhost development origins.

## Next phase
Verify the merged `master` deployment and manually test Forge plus the backend lab in the deployed portfolio. Fix only verified regressions in a new branch.
