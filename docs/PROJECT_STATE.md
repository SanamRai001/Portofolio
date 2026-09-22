# PROJECT_STATE

## Objective
Turn Sanam Rai's portfolio into a distinctive interactive engineering experience where the visual language explains backend systems rather than adding decoration. Preserve the real backend lab and Forge companion while introducing motion and 3D in small, measurable phases.

## Current authoritative branch
`master`

Active development branch: `feat/immersive-system-phase-6`

## Completed phases
- **Forge living portfolio** — backend-focused redesign, backend lab, observability console, auth overlay, and companion baseline.
- **Phase 1 — Motion foundation** — merged at `16048d8`; GSAP foundation, motion tokens, reduced-motion handling, scoped cleanup.
- **Phase 2 — System Core** — merged at `b483bd6`; Three.js architecture core with performance fallbacks and cleanup.
- **Phase 3 — Scroll architecture story** — merged at `870db1a`; native-scroll API/Auth/Cache/Database/Runtime narrative.
- **Phase 4 — Backend Lab visual synchronization** — merged at `ecd0895`; real synchronized backend config drives a dedicated System Core.
- **Phase 5 — Project storytelling** — merged at `2c81f16`; editorial selected-work sequence while the live API project section remains separate.

## Active phase
**Phase 6 — Forge contextual reactions**

### Added
- Small `forgeEvents.js` event boundary so other components can request a reaction without importing or controlling Forge internals.
- Only authored Forge states are accepted: look, think, wave, build, celebrate, recovery, support.
- Reaction duration is bounded to avoid long or sticky mascot states.
- Backend Lab manual configuration apply → Forge uses the authored build state.
- Successful backend sync → brief celebrate reaction plus a small three-spark burst.
- Failed backend sync and automatic configuration rollback → recovery reaction.
- Project-story chapter changes → subtle think/look reactions.
- Context reactions temporarily own the sprite state so pointer movement does not instantly overwrite them.
- Forge still follows the pointer during a reaction; only the animation row is temporarily locked.
- Existing calm/idle sequence resumes automatically after each reaction.
- All reaction listeners and timers are cleaned up on unmount.
- Reduced-motion and coarse-pointer/mobile paths keep their existing simpler behavior and do not add contextual reactions.

## Interaction guardrails
- No speech bubbles.
- No sound.
- No modal/popup behavior.
- No extra mascot art or dependency.
- No continuous new animation loop.
- Reactions are short and tied to meaningful user/system events only.

## Backend behavior preserved
Frontend contracts remain unchanged for:
- `/api/system`
- `/api/controls`
- `/api/logs`
- `/api/projects`
- `/api/auth/login`

No backend source file is modified in Phase 6.

## Existing truthfulness guardrail
`rateLimitMiddleware` still exists without being attached to the project route middleware chain. The portfolio continues to present that capability as configuration-only rather than pretending it is enforced.

## Next phase
**Phase 7 — final production pass.** No new creative feature work by default. Audit mobile layout, reduced motion, keyboard/accessibility, WebGL/GSAP performance, dead CSS/code, deployment behavior, docs, and stale feature branches before calling the immersive redesign complete.
