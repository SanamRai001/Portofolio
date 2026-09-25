# PROJECT_STATE

## Objective / scope
Backend-focused lightweight `/` plus isolated Galaxy **G1 only** at `/galaxy`. Preserve backend/security contracts; no G2 or branch deletion.

## Branch and authorization
- Authoritative branch: `master`.
- Source: `feat/galaxy-g1-foundation`; integration: `refactor/backend-focused-homepage`.
- On 2026-09-25 the user explicitly changed the verification order: merge first, then inspect production. This superseded the earlier pre-merge visual gate.
- Fresh fetch found master at `24b40f7`; the tested integration branch was its descendant. Safely fast-forwarded master to `6ff9586237b17ef22bf859c0bde7138d93a5e2a2`. No force push, reset or branch deletion.

## Completed phases
- G1: isolated lazy Galaxy stars/camera/performance controls and WebGL fallback. No planets or camera travel.
- H1 (`8d6e93f`): static engineering hero, ordered request pipeline, DOM Backend Lab map, project case studies; removed homepage WebGL, GSAP/pinned scrolling and global Forge. Existing reusable scene/Forge files remain isolated.
- H2 (`af6adaf`): one progressive-enhancement IntersectionObserver; 460ms / 16px reveal; reduced-motion, focus, hidden-tab and auth suspension cleanup. Removed unused GSAP dependency/helpers. Added 8 DOM tests and fixed React 19 boolean `inert` handling.
- H3: merged and deployed to production under the revised user instruction; performed available live checks below.
- Backend source, Galaxy implementation, security/API contracts and SEO assets remain unchanged by the homepage refactor. Rate Limit Flag remains configuration-only.

## Verification
- Re-ran on merged master: 6 auth-runtime + 10 Galaxy + 8 homepage DOM + 28 backend tests passed; ESLint and Vite build/bundle guard passed.
- Master frontend CI `36090473113`: success. Backend CI is path-filtered; backend tests passed locally and its source was unchanged.
- Production Vercel deployment `6653067199`: success for `6ff9586`.
- Homepage emitted JS static graph: 274.76 kB raw / 90.19 kB gzip, versus ~968 / ~285 before refactor. CSS 30.41 / 7.39 kB. Build guard confirms no Galaxy, Three.js, GSAP or Forge in homepage imports. Galaxy scene remains separately deferred (~521 kB raw).
- https://sanam-rai.com.np redirects to https://www.sanam-rai.com.np/ and serves the new content. Observed 3 Galaxy links, zero canvases, valid inert attribute behind the active auth dialog, no horizontal overflow at the available 1363×936 viewport. Auth dialog visually inspected.
- Direct `/galaxy` visit and refresh render the static star fallback with working navigation. Exit returns to the new homepage. No horizontal overflow at 1363×936.

## Limits / risks
- Live backend auth is enabled; the overlay covers the homepage. Did not change shared backend flags or bypass login. Full post-login visual inspection remains pending.
- Cloud browser has WebGL disabled; Galaxy correctly falls back. Console reports expected WebGL initialization failure on Galaxy and browser-extension metadata errors. Interactive 3D rendering is not visually verified here.
- Required 1440×900, 1280×800 and 390×844 checks remain pending; the current browser surface does not advertise viewport resizing. Do not describe responsive acceptance or all browser-console checks as passed.
- Earlier protected preview/local browser access issues are superseded by the successful public production check, not by a completed full visual acceptance.

## Next phase
Complete authenticated desktop/laptop/mobile visual review and check Galaxy on a WebGL-capable browser. Keep G2 out of scope unless requested. No further functional changes are currently pending.

## Branch cleanup
Both `feat/galaxy-g1-foundation` and `refactor/backend-focused-homepage` are ancestors of master and safe cleanup candidates. Retained; deletion requires explicit user authorization.
