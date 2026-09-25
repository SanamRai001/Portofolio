# PROJECT_STATE

## Objective
Build `/galaxy` as an isolated immersive portfolio in small phases. Preserve the existing homepage, Forge, island, SystemCore, architecture story, and all backend demonstrations. Current authorization: **G1 only; do not start G2**.

## Branch and baseline
- Working branch: `feat/galaxy-g1-foundation`.
- Base: `master` at `24b40f7` (clean checkout before changes).
- Implementation commit: `14b976081e64dfaa4554f302c1d208df4d429c3c` (saved on the same GitHub branch).
- Repository code/git is authoritative. Historical phase details remain in this file's git history.

## G1 — implementation complete; visual acceptance pending
- Added `/galaxy` and `/galaxy/` with native document links, a Galaxy navbar entry, a lazy React route, and a lazy scene import. Existing hash navigation remains native.
- Split homepage styles out of the shared entry. Galaxy does not import the backend application, GSAP, Forge, homepage CSS, or public project API.
- Added full-viewport `#020204` space, three deterministic 3D star layers, restrained camera parallax, responsive framing, minimal identity/exit controls, pause motion, and a still-view option.
- Centralized camera, starfield, renderer lifecycle, performance profile, and GPU disposal in separate modules.
- Low power hints: compact viewport, coarse pointer, <=4 GB memory or <=4 logical cores when available. DPR <=1 low power / <=1.5 desktop; 900 / 2720 stars; 30 / 60 fps targets.
- Reduced motion draws on demand without ambient motion/parallax. Hidden/offscreen/page-cached scenes stop scheduling frames. Resize invalidates a paused scene once.
- Unmount/still view removes observers, listeners, RAF, geometry, materials, textures, canvas and context. Renderer/import/context-loss failures reach a static sky with real homepage links.
- Added frontend-root Vercel rewrites for both Galaxy URL forms. Production settings are not changed.
- No Sun, planets, orbit paths, system map, travel/selection state machine, project moons, or homepage cleanup: these are later phases.

## Architecture decisions
- No routing dependency for two isolated experiences: native links perform full document navigation, with normal browser back/forward. A minimal lazy entry selects the route. Unknown paths retain previous homepage behavior.
- Three.js was already eagerly used by the homepage. It remains there to preserve existing experiments. The enforceable G1 boundary is **no Galaxy-specific code/assets on the homepage**, not removing its existing Three.js dependency.
- Fallback intentionally uses stars and existing portfolio destinations only. A solar-system map and Galaxy-specific content links would prematurely implement G2+.
- No added packages, textures, models, audio, bloom, shadows, or postprocessing.

## Verification
- Baseline: frontend lint, 6 auth-runtime tests, 28 backend tests, production build passed.
- G1: frontend lint, 6 auth-runtime tests, 10 Galaxy regression tests passed.
- Galaxy tests cover device profiles, DPR, one-frame ownership, hidden pause/resume, paused invalidation, frame throttling, teardown, error handling, bounded camera framing, deterministic 3D layers, and shared GPU disposal.
- Production build and emitted-manifest guard passed: initial entry excludes experiences/Three.js; homepage static imports exclude Galaxy route/scene; Galaxy excludes the homepage; scene remains dynamically loaded.
- Frontend CI runs Galaxy tests and the build isolation guard alongside auth/lint. GitHub Actions run `36087401221` passed for `14b9760`.
- Vercel automatic Preview deployment `6652577225` succeeded for `14b9760`: `https://portofolio-opqi21itr-sanamrai001s-projects.vercel.app`. This is a branch preview, not a production promotion.
- Backend diff is empty. Backend was not connected to a live database or mutated during this task.
- Browser visual QA: **blocked**. Supported supervised preview reports running, but the cloud browser rejects its address with `ERR_BLOCKED_BY_CLIENT`. The successful Vercel preview redirects to Vercel login. A secure sign-in request was rejected by automatic approval review because Vercel authentication/private-deployment access was not explicitly authorized. No authentication or access-control bypass was attempted. Desktop/mobile appearance, live WebGL context loss, browser memory behavior, and interactive navigation have NOT been visually verified.

## Risks and boundaries
- G1 is not ready for visual acceptance or merge until browser QA passes. CPU tests do not prove GPU rendering, accessibility, or physical-device performance.
- Existing shared Three.js chunk is ~546 kB raw / 137 kB gzip and triggers Vite's >500 kB warning. G1 route JS is ~4.4 kB, scene JS ~4.3 kB, route CSS ~3.4 kB before gzip. These are build sizes, not measured browser transfer or frame rates.
- Direct-route Vercel behavior still needs a deployed preview smoke check; rewrite assumes the existing frontend-root project.
- Device profile is chosen on scene mount; viewport resize updates camera/canvas, not the star budget.
- Existing backend security: bcrypt-only login and scoped JWTs; public configuration is intentional for the demo. Rate limiting remains configuration-only, not enforced on project routes. Preserve these truthful distinctions.
- Many remote branches are fully merged into master (including Forge, immersive phases 1–6, island phases 1–4, and several security/fix branches). Cleanup is worth a separate review. No branches deleted.

## Exact next action
1. Obtain explicit authorization for secure Vercel sign-in, or use restored supported preview access. Complete G1 visual QA at desktop and mobile sizes: open `/galaxy` directly/reload, check visible stars and controls, keyboard focus, pause/still/resume, reduced motion, unavailable WebGL/context loss, repeated entry/exit, back/forward, and unchanged homepage/backend UI.
2. Only after G1 review and explicit continuation: **G2 — Sun, orbit system, four placeholder planets, scale hierarchy and solar-system overview framing**.
3. Stop here for this request. G2 has not started; master has not been merged or deployed by this task.
