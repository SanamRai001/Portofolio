# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration, while preserving the real backend lab and Forge companion.

## Current authoritative branch
`master`

Phase 7 source branch: `chore/immersive-system-phase-7`

## Completed creative phases
- **Forge living portfolio** — backend-focused redesign and companion baseline.
- **Phase 1 — Motion foundation** — `16048d8`.
- **Phase 2 — System Core** — `b483bd6`.
- **Phase 3 — Scroll architecture story** — `870db1a`.
- **Phase 4 — Backend Lab visual synchronization** — `ecd0895`.
- **Phase 5 — Project storytelling** — `2c81f16`.
- **Phase 6 — Forge contextual reactions** — `23a8690`.

## Phase 7 — final production pass
No new creative feature work was added.

### Production hardening completed
- Added a keyboard skip link and focusable `#main-content` target.
- Authentication modal now makes the complete background, including navigation, `inert` and `aria-hidden` so keyboard focus cannot escape behind it.
- Login email receives initial focus.
- Removed the non-functional “Remember me” UI because the existing auth flow already persists its token through localStorage.
- Live project cards no longer use a pseudo-link article containing nested real links; only explicit Live demo and Source anchors are interactive.
- Live project API calls now use AbortController so rapid database/config changes cannot allow an older response to overwrite newer state.
- Live-log polling pauses while the document is hidden and refreshes when visibility returns.
- Three.js System Core rendering pauses both off-screen and while the browser document is hidden, then resumes when visible.
- Selected-work images are lazy-loaded because the story section sits below the initial viewport.
- Fixed the compact/coarse-pointer + reduced-motion Forge positioning conflict.
- Removed confirmed dead source files `frontend/src/App.css` and `frontend/src/Testimonials.jsx`.

## Verification
- Phase 7 production-hardening commit: `8953db7 chore: harden immersive portfolio for production`.
- Vercel deployment/build for `8953db7`: **success**.
- Phase 7 diff contains frontend/docs changes only; no backend source changes.
- Static verification confirmed modal inertness, skip navigation, project-request cancellation, hidden-document WebGL pause, compact reduced-motion Forge handling, and removal of the two dead source files.
- Full physical-device/browser testing is not claimed; exact sticky spacing, WebGL appearance, and uncommon viewport behavior should still be visually spot-checked on the deployed site.

## Backend contracts preserved
Unchanged:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file was modified by the immersive redesign phases.

## Truthfulness guardrail
`rateLimitMiddleware` exists but is not currently attached to the project route middleware chain. The portfolio continues to present rate limiting as configuration-only rather than implying project-route throttling is enforced.

## Branch audit
Safe cleanup candidates after Phase 7 is merged because they have no unique commits relative to current master history:
- `feat/immersive-system-phase-1`
- `feat/immersive-system-phase-2`
- `feat/immersive-system-phase-3`
- `feat/immersive-system-phase-4`
- `feat/immersive-system-phase-5`
- `feat/immersive-system-phase-6`
- `feat/forge-living-portfolio`
- `dev`

`readme-brand-001` has 2 historically unique commits, but its current `README.md` and `assets/readme/project-cover.svg` blobs are byte-for-byte identical to `master`. It is therefore content-redundant and can be treated as a cleanup candidate once branch deletion is performed externally.

No branch has been deleted automatically.

## Legacy assets
Several older source assets remain in the repository and were intentionally not deleted during this pass. Asset cleanup should be a separate approved action.

## Completion state
The immersive portfolio redesign is feature-complete by default. No additional visual feature phase is planned. Future work should be limited to verified regressions, content/project updates, backend fixes, or explicitly approved cleanup.


## README refresh
- GitHub-facing documentation was refreshed after the immersive redesign.
- README now documents the live Backend Lab, Three.js System Core, GSAP architecture story, Forge, project storytelling, current frontend/backend stack, performance/accessibility behavior, and accurate local setup.
- README deliberately does not present the current demo authentication as production-grade password security.


## Feature toggle visibility fix
- Restored the six Backend Lab feature switches as the primary interaction block directly below the Backend Lab heading.
- The System Core remains below the switches as visual feedback rather than replacing or visually burying the controls.
- Existing backend synchronization, rollback behavior, Forge reactions, and feature semantics are unchanged.
