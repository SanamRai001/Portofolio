# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-5`

## Completed phases

### Forge living portfolio
- Backend-focused portfolio redesign, Forge companion, backend lab, observability console, authentication overlay, and existing API contracts are preserved.

### Phase 1 — Motion foundation
- Merged to `master` at `16048d8 feat: establish immersive motion foundation`.
- GSAP foundation, shared motion tokens, reduced-motion handling, scoped cleanup, and hero entrance.

### Phase 2 — System Core prototype
- Merged to `master` at `b483bd6 feat: prototype interactive system core`.
- Three.js System Core with capped DPR, compact-device reductions, off-screen pause, static fallback, and full disposal.

### Phase 3 — Scroll architecture story
- Merged to `master` at `870db1a feat: add scroll architecture story`.
- Sticky System Core plus API/Auth/Cache/Database/Runtime chapters driven by native scroll + ScrollTrigger.

### Phase 4 — Backend Lab visual synchronization
- Merged to `master` at `ecd0895 feat: sync backend lab with system core`.
- Real backend configuration state now drives a dedicated System Core inside the Backend Lab.
- Rate limiting remains explicitly configuration-only because its middleware is not currently wired to the project route.

## Active phase
**Phase 5 — Project storytelling**

### Added
- Replaced the static three-card Selected Work grid with an editorial engineering case-study sequence.
- Desktop uses one sticky visual stage and three scroll chapters.
- Active project changes the large project image, engineering signal, focus statement, and progress rail.
- Case studies preserve the existing project descriptions, technology lists, source links, and live-product links.
- Added a small architecture lens for each selected project using facts already represented in the project descriptions.
- GSAP ScrollTrigger only observes chapter position and reveal state; native scrolling is untouched.
- Mobile removes the sticky stage and places the corresponding project image directly inside each project chapter.
- Reduced-motion mode also becomes a linear document with no crossfade or scroll reveal dependency.
- The backend-fetched Core Projects section remains unchanged so the portfolio still demonstrates the live project API separately.

## Selected projects in story
- Krishi Bazar — marketplace flows, JWT auth, synchronized cart state, dual checkout, persistence.
- Backend-Controlled Portfolio System — runtime configuration, auth/cache/logging/pagination/system behavior.
- YakTalk — authenticated Socket.IO handshake, presence, private realtime messaging.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 5.

## Explicitly not included yet
- No changes to the live API-driven Core Projects component.
- No Forge project reactions.
- No new project data model or backend fields.
- No page-wide WebGL background.
- No audio, shaders, post-processing, or imported 3D models.

## Next phase
**Phase 6 — Forge contextual reactions and final interaction polish**, if Phase 5 passes build and visual review. Give Forge restrained reactions to project/lab context, then perform mobile, reduced-motion, performance, accessibility, and branch-cleanup review before considering the immersive pass complete.
