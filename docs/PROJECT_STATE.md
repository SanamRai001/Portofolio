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


## Surreal hero world — Phase 1
Active branch: `feat/hero-surreal-island-phase-1`.

### Scope
- Replaced only the hero-side technical System Core with a new handcrafted Three.js miniature world.
- Architecture Story and Backend Lab System Core remain unchanged.
- Added a faceted floating island with tapered rocky underside.
- Added a warm low-poly house with emissive windows and local amber light.
- Added one stylized tree, surface/underside rocks, a simple pond, and three drifting clouds.
- Added restrained pointer-driven camera parallax and slow island hover.
- No OrbitControls, scroll hijacking, GLB model, shader, post-processing, or physics dependency.
- Desktop shadows are limited; compact/coarse-pointer rendering disables shadow maps and uses lower DPR.
- Rendering pauses off-screen and when the document is hidden.
- Reduced-motion/WebGL-failure mode uses a static CSS diorama instead of a render loop.
- Scene geometry/materials and WebGL context are disposed on unmount.

### Explicitly deferred
- Forge living inside the island.
- Wind/grass/leaf animation.
- Advanced water or waterfall.
- Day/night cycle.
- Fireflies, shooting stars, click secrets, or other ambient life.
- Imported 3D assets.

### Phase 1 success criterion
Judge the composition and visual identity first. Only continue into environmental animation if the basic island feels memorable in the deployed hero.


## Surreal hero world — Phase 2
Active branch: `feat/hero-surreal-island-phase-2`.

### Living environment added
- Added lightweight grass tufts built from shared primitive geometry; desktop renders the full set and compact devices render a reduced set.
- Added subtle wind motion to the tree, individual canopy clusters, and grass groups using deterministic sine-based motion.
- Replaced cloud bobbing-in-place with slow continuous horizontal drift plus small vertical variation.
- Added two procedural pond ripple rings and gentle pond surface breathing without introducing a water shader.
- Added a narrow surface stream and translucent waterfall ribbon over the island edge.
- Added a small deterministic floating-mote field around the island.
- Preserved Phase 1 camera parallax, hover motion, reduced-motion fallback, offscreen/document-hidden pause, and full WebGL cleanup.
- No new dependency, GLB asset, physics system, post-processing stack, or backend change.

### Still deferred
- Forge living inside the island.
- Day/night lighting cycle.
- Fireflies or shooting stars.
- Click/hover secrets.
- Advanced water/reflection shader.


## Surreal hero world — Phase 3
Active branch: `feat/hero-surreal-island-phase-3`.

### Personality and atmosphere added
- Added a tiny Forge cameo inside the 3D island using the existing `/forge/forge-sprite.svg` asset; no second mascot design or new image asset was introduced.
- Forge idles/looks by the tree and switches to its authored wave row when hovered.
- Added a small warm firefly field around the tree/house zone with deterministic low-cost motion.
- Added soft procedural chimney smoke using a few reusable sphere puffs.
- Added raycast hover affordances without OrbitControls or click gameplay.
- Hovering the house smoothly increases window emissive intensity and the local amber house light.
- Hovering the pond increases ripple speed, spread, and visibility.
- Updated the reduced-motion CSS diorama so Forge remains present in static mode.
- Explicit texture disposal was added for the island Forge sprite texture in addition to the existing geometry/material/WebGL cleanup.

### Still deferred
- Day/night cycle.
- Shooting stars.
- Additional secrets or click interactions.
- Advanced water/reflection shader.
- Any change to the global cursor-following Forge behavior.


## Surreal hero world — Phase 4
Active branch: `feat/hero-surreal-island-phase-4`.

### Atmosphere cycle added
- Added a deterministic 72-second dawn → day → sunset → night → dawn loop entirely inside the existing Three.js render loop.
- Scene background color now transitions through authored atmosphere colors without a sky shader or post-processing pass.
- Hemisphere light, directional sunlight, cool fill light, and a dedicated moonlight respond to the same atmosphere phase.
- Sun direction moves across the scene while sunset warms its color and night lowers its contribution.
- Clouds darken and soften slightly after sunset.
- Added a small deterministic star field that fades in only at night.
- Added one rare shooting-star pass during the night portion of the cycle using a single lightweight line primitive.
- House window emissive strength and local amber light now increase naturally after dark.
- Fireflies become much more visible at night and remain subtle during daylight.
- The hero metadata reports DAWN / DAY / SUNSET / NIGHT without causing React renders every frame.
- Reduced-motion/WebGL fallback stays static and uses a dusk-like CSS atmosphere rather than animating a cycle.
- No shader, post-processing dependency, clock/time API, or backend change was introduced.

### Still deferred
- Extra click secrets.
- Advanced reflective water.
- More weather systems.
- Any additional major hero feature before a production/performance pass.


## Surreal hero world — Phase 5 production pass
Active branch: `chore/hero-surreal-island-production-pass`.

### Hardening changes
- Added a conservative low-power mode using coarse-pointer/compact layout plus available hardware-concurrency/device-memory hints.
- Low-power mode disables real-time shadows, caps DPR at 1, disables antialiasing, requests a low-power WebGL context, and reduces grass, motes, fireflies, stars, and smoke detail.
- Desktop shadow-map size was reduced from 768 to 512 because the hero uses stylized soft forms rather than shadow-detail-critical geometry.
- Raycasting no longer runs directly on every pointer event. Pointer movement only marks interaction state dirty; at most one raycast is processed inside the next render frame.
- Pointer/raycast listeners are not installed for coarse-pointer devices.
- Added CSS paint/layout containment to the island component.
- Raised the existing visual overlay above the opaque Three.js canvas so its subtle vignette remains effective after Phase 4 introduced an opaque scene background.
- The global cursor-following Forge now yields to the island Forge while the hero panel is prominently visible, preventing two mascot instances from competing in the same composition.
- Global Forge spark generation and cursor following pause while it is yielding; normal behavior resumes after the island panel leaves the main viewport.
- Existing offscreen/document-hidden render pause, reduced-motion fallback, scene disposal, texture disposal, and backend isolation remain unchanged.

### Completion boundary
No new creative system was added. The surreal island should now be treated as feature-complete unless a deployed visual or performance regression is verified.


## Authentication hardening — Phase A1/A2 foundation
Active branch: `security/auth-hardening-phase-1`.

### Audit findings
- `POST /api/auth/login` is the only authentication entry point; there is no signup route.
- Users are provisioned through `backend/data/seedUser.js` or directly in MongoDB.
- The previous login implementation compared `users.password !== password`, so existing records may contain plaintext passwords.
- `bcrypt` was already installed but was not used by the login controller or user seed.
- The public frontend demo credentials differ from the repository seed credentials, so the live database must not be assumed to match `seedUser.js`.
- Protected project requests use the existing one-hour JWT through `Authorization: Bearer <token>`; this contract is intentionally unchanged in this phase.

### Safe migration implemented
- Added `backend/utils/password.js` as the password boundary.
- New/seeded passwords are bcrypt-hashed with 12 rounds.
- Login verifies bcrypt hashes normally.
- Legacy plaintext records remain login-compatible temporarily.
- After a successful legacy plaintext login, that exact MongoDB record is conditionally upgraded to a bcrypt hash.
- The upgrade write is best-effort: a temporary migration-write failure does not lock out a user who supplied valid credentials.
- Invalid email/user and invalid password now return the same generic 401 response, reducing account-enumeration detail.
- Explicitly inactive users are rejected.
- Missing `JWT_SECRETKEY` returns a controlled 500 instead of relying on an unhandled signing error.
- JWT response shape, one-hour expiry, frontend localStorage behavior, and auth-disabled behavior remain unchanged.
- Added focused Node tests for bcrypt hashing, bcrypt verification, and the temporary legacy migration path.
- Added `npm run test:auth` and `npm run seed:users` scripts.

### Migration boundary
The legacy plaintext compatibility path is temporary. Once the live demo account has successfully logged in and its stored password is confirmed hashed, remove plaintext compatibility in a later security phase.


## Authentication hardening — Phase A3 JWT boundary
Active branch: `security/auth-hardening-phase-2`.

### JWT middleware hardening
- Removed server-console logging of bearer tokens.
- Added strict Bearer-header parsing rather than splitting any Authorization value on spaces.
- Auth-disabled behavior still bypasses JWT verification exactly as the live Backend Lab requires.
- Missing `JWT_SECRETKEY` now returns a controlled 500 response.
- Missing/malformed bearer credentials return a stable 401 `Authentication required`.
- Invalid or expired JWTs return a stable generic 401 without exposing verifier details.
- Valid JWT payload continues to be assigned to `req.user`; the current one-hour token contract is unchanged.
- Added focused middleware tests for disabled-auth bypass, Bearer parsing, missing token, valid JWT, and invalid JWT.
- `npm run test:auth` now covers both password migration and JWT middleware tests.

### Frontend expired-token recovery
- The protected Projects request now detects a 401 while auth is enabled.
- On that 401 it removes the stale localStorage token and reloads once, allowing the existing authentication overlay to reappear.
- No global Axios interceptor or broader auth architecture change was introduced.

### Known product boundary
The Backend Lab intentionally leaves system/config controls public so visitors can experiment with toggles, including the auth feature flag. Authentication therefore demonstrates a protected request path; it is not presented as an administrative security boundary for the public portfolio.


## Authentication hardening — Phase A4 model + CI safety
Active branch: `security/auth-hardening-phase-3`.

### User-model safety
- Password is now `select: false` by default so ordinary Mongoose user queries do not retrieve it.
- The login controller explicitly uses `.select('+password')` only at the credential-verification boundary.
- Added a pre-save guard that hashes a changed plaintext password and leaves an already-bcrypt value unchanged.
- Added a `toJSON` transform that removes the password field if a user document is serialized.
- The existing seed script still hashes explicitly because Mongoose `insertMany` does not rely on document save middleware.

### Executable backend workflow
- Replaced the placeholder failing `npm test` script with Node's built-in test runner.
- Added `npm start` and `npm run dev` scripts for the backend.
- Kept `npm run test:auth` as the focused authentication suite.
- Added `.github/workflows/backend-security-tests.yml` to run `npm ci` and `npm test` on backend-related pushes to master and pull requests.
- Workflow uses Node 24 and read-only repository contents permission.
- README local backend setup now uses the real dev script and documents the security test commands.

### Verification boundary
Vercel validates deployment/build integration but is not the authoritative backend test runner. The new GitHub Actions workflow is the intended executable gate for these Node tests.
