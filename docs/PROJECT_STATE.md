# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-4`

## Completed phases

### Forge living portfolio
- Backend-focused portfolio redesign, Forge companion, backend lab, project presentation, observability console, auth overlay, and existing API contracts are preserved.

### Phase 1 — Motion foundation
- Merged to `master` at `16048d8 feat: establish immersive motion foundation`.
- GSAP 3.15.0, shared motion tokens, reduced-motion handling, scoped cleanup, and hero entrance.
- Vercel passed before merge.

### Phase 2 — System Core prototype
- Merged to `master` at `b483bd6 feat: prototype interactive system core`.
- Three.js System Core with capped DPR, compact-device reductions, off-screen pause, static fallback, and full disposal.
- Vercel passed before merge.

### Phase 3 — Scroll architecture story
- Merged to `master` at `870db1a feat: add scroll architecture story`.
- Sticky System Core plus API/Auth/Cache/Database/Runtime chapters driven by native scroll + ScrollTrigger.
- Mobile remains linear; reduced motion remains readable/static.
- Vercel passed before merge.

## Active phase
**Phase 4 — Backend Lab visual synchronization**

### Added
- Embedded a dedicated System Core inside the real Backend Feature Control Panel.
- The visual reads directly from the same local configuration object that is synchronized with `GET/POST /api/system`.
- Optimistic toggle changes update both the switch and System Core immediately.
- Failed backend writes already revert the existing toggle object, which now also reverts the visualization automatically.
- AUTH maps to the authentication flag and trust-boundary ring.
- CACHE maps to the cache flag and cache/request path.
- DATABASE maps to the database flag and persistence path.
- RUNTIME maps to request logging/observability.
- Disabled mapped services visibly dim their node, halo, connection, and request pulse.
- Logging state also controls the ambient observability particle field.
- Static/reduced-motion mode still exposes ON/OFF state through labels and adjacent status cards.
- Rate limiting and pagination remain visible as configuration flags only; they are not given fabricated network behavior.

## Truthfulness guardrail
`rateLimitMiddleware` exists but is not currently attached to the project route middleware chain. Phase 4 explicitly labels rate limiting as configuration-only rather than animating it as if it were enforced.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 4.

## Explicitly not included yet
- No project-stack redesign.
- No Forge reactions to backend state.
- No backend route or middleware changes.
- No new API endpoint.
- No page-wide WebGL background.
- No sound, shaders, post-processing, or imported 3D models.

## Next phase
**Phase 5 — project storytelling**, if Phase 4 passes build and visual review. Replace ordinary project-card browsing with a more editorial engineering case-study sequence while retaining accessible direct links and mobile simplicity.
