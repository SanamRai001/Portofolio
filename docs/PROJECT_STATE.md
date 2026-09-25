# PROJECT_STATE

## Objective and authorization
Integrate existing Galaxy G1 with a fast backend/systems homepage. Preserve backend/security contracts and Galaxy behavior. User authorizes merging into authoritative `master` **only after tests, CI/Vercel and desktop/laptop/mobile visual verification pass**. Do not add Galaxy G2 or delete branches.

## Repository baseline
- Default/authoritative branch verified: `master` at `24b40f7add62c12d3f94acf450a6e5ba0c41ed4b`.
- Galaxy source: `feat/galaxy-g1-foundation` at `662ff87`; implementation `14b9760`.
- Integration branch: `refactor/backend-focused-homepage`, created from Galaxy source after a fresh fetch. Master had no newer commits to integrate; worktree was clean.
- Galaxy is G1 only. Full solar system is not implemented. Preserve stars/camera/performance/fallback, do not describe later phases as complete.

## Completed phase H1 — static homepage separation
- Hero is a static engineering request contract with the existing API ping and explicit Galaxy entry.
- Architecture is an ordered DOM middleware map with cache/database/failure paths matching actual backend route/controller order.
- Removed homepage wiring for HeroIsland, SystemCore, cursor-following Forge, reaction dispatch, GSAP and ScrollTrigger.
- Replaced Backend Lab's WebGL presentation with a DOM definition list using the same toggle state. Request synchronization, one-write guard, rollback, auth and project-fetch behavior are preserved.
- Replaced pinned/scroll-driven project storytelling with compact problem/architecture/engineering-decision case studies using existing repository projects; API-driven Core Projects remains separate.
- Preserved dark technical brand, existing SEO/social metadata, assets, routing and public demo credentials. Removed obsolete cinematic/sticky-section CSS and mobile spacing reserved for Forge.
- Corrected a stale static portfolio project description that implied enforced throttling. Rate Limit Flag remains configuration-only.
- Reusable island/SystemCore/Forge sources and assets remain unimported for possible future reuse. Galaxy files and backend files have no diff.

## H1 verification
- `npm run lint`: passed.
- `npm run test:auth-runtime`: 6 passed; `npm run test:galaxy`: 10 passed.
- `npm run build`: passed; strengthened emitted-bundle guard excludes Three.js/WebGL, GSAP/ScrollTrigger, Forge and Galaxy from homepage static imports/code.
- Homepage JS static graph: approximately 968 kB → 273 kB raw, 285 kB → 90 kB gzip. Homepage CSS: 50.5 kB → 30.0 kB raw. Build sizes, not measured network or device performance.
- Three.js remains in Galaxy's deferred scene (~521 kB raw), so Vite's >500 kB chunk warning remains Galaxy-only.
- Browser visual checks are still pending. Prior G1 preview failed with `ERR_BLOCKED_BY_CLIENT`; Vercel preview was sign-in protected and automatic review rejected starting sign-in without explicit user authorization.

## Risks / decisions
- Do not merge based only on automated tests. Required visual viewports: 1440×900, 1280×800, 390×844; check both routes, lab, projects, auth overlay, focus, scroll/overflow, and console errors.
- Preserve native document links for route separation and browser back/forward. No router replacement or API contract changes.
- Keep backend validation, bcrypt-only auth, JWT scope, privacy-safe logging, pagination HTTP semantics, public demo configuration and production CORS unchanged.
- No production backend data/configuration was changed for testing.
- Historical phase narrative remains available in git history rather than accumulating here.

## Completed phase H2 — restrained motion and regression coverage
- One shared IntersectionObserver adds a 460ms / 16px entry effect. Content is visible by default; focused sections, reduced motion, hidden tabs and auth suspension settle without animation. No scroll listeners or RAF loop.
- Removed unused GSAP helper/CSS and dependency after reference checks; shared Galaxy reduced-motion hook is unchanged.
- Added 8 rendered DOM tests for API-backed content, serialized config writes, rollback, auth isolation, bearer requests/refetch, request cancellation/error display and reveal lifecycle. CI includes them.
- DOM tests exposed and fixed a React 19 boolean `inert` bug in the existing auth overlay. No API contract changes.
- Updated README to reflect the separated routes and bcrypt-only authentication.
- Local verification: lint, 6 auth-runtime tests, 10 Galaxy tests, 8 homepage tests, 28 backend tests and production build/bundle guard passed.
- Final homepage JS graph: 274.76 kB raw / 90.19 kB gzip; homepage CSS: 30.41 kB raw / 7.39 kB gzip. Galaxy scene remains 520.82 kB raw / 131.33 kB gzip, loaded separately.
- Supported local preview starts, but browser navigation again returns `ERR_BLOCKED_BY_CLIENT`. No desktop/laptop/mobile screenshot, layout, overflow or browser-console acceptance is claimed.

## Exact next step / merge gate
Publish integration commits, verify GitHub CI and Vercel deployment. Obtain authorized access to a renderable preview for required 1440×900, 1280×800 and 390×844 browser checks. Prior automatic approval review rejected Vercel sign-in because explicit permission was absent. Do not retry sign-in without authorization; do not bypass access controls. Merge remains conditional on successful visual acceptance. After that, fetch master again, safely merge, and verify production. No branch is approved for deletion.
