# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration, while preserving the real backend lab and Forge companion.

## Current authoritative branch
`master`

Active audit branch: `chore/immersive-system-phase-7`

## Completed creative phases
- **Forge living portfolio** — backend-focused redesign and companion baseline.
- **Phase 1 — Motion foundation** — `16048d8`.
- **Phase 2 — System Core** — `b483bd6`.
- **Phase 3 — Scroll architecture story** — `870db1a`.
- **Phase 4 — Backend Lab visual synchronization** — `ecd0895`.
- **Phase 5 — Project storytelling** — `2c81f16`.
- **Phase 6 — Forge contextual reactions** — `23a8690`.

## Active phase
**Phase 7 — final production pass**

No new creative feature work is included.

### Concrete fixes
- Added a keyboard skip link and a focusable `#main-content` target.
- When the authentication modal is active, the entire background including navigation is now `inert` and `aria-hidden`, preventing keyboard focus from escaping behind the modal.
- Login email receives initial focus.
- Removed the non-functional “Remember me” control because authentication already persists via the existing localStorage token behavior.
- Live project cards no longer make the whole article a pseudo-link containing nested real links; only the explicit Live demo and Source anchors are interactive.
- Live project API requests use AbortController so rapid database/config changes cannot let an older request overwrite newer results.
- Live log polling skips hidden tabs and refreshes once visibility returns.
- Three.js System Core rendering now pauses both when off-screen and when the browser tab/document is hidden, then resumes when visible.
- Selected-work imagery is lazy-loaded because that section is below the initial viewport.
- Fixed the reduced-motion + compact/coarse-pointer Forge positioning conflict so the mascot does not receive the desktop translation on mobile.
- Removed confirmed dead source files `frontend/src/App.css` and `frontend/src/Testimonials.jsx`.

## Preserved backend contracts
Unchanged:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 7.

## Existing truthfulness guardrail
`rateLimitMiddleware` exists but is not currently attached to the project route middleware chain. The portfolio continues to describe rate limiting as configuration-only rather than implying that project-route throttling is enforced.

## Verification boundaries
- Vercel build/deployment status is used as the repository build gate.
- Static source review covers listener/timer/RAF/ScrollTrigger cleanup, reduced-motion fallbacks, keyboard semantics, request races, and responsive CSS.
- A real-browser device pass is still recommended for subjective visual details such as exact sticky spacing, WebGL appearance, and Forge placement across uncommon viewport sizes; this document does not claim physical-device testing.

## After Phase 7
No additional visual feature phase is planned by default. Remaining work should be regression fixes, content updates, or explicitly approved branch/asset cleanup.
