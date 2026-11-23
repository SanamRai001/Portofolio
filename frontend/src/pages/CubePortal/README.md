# Cube Portal React preview

This is an **isolated review route**, not the published homepage. The prototype's GLB model and fallback image are reused from `prototypes/unfolding-cube-portal/assets/` through Vite `?url` imports; no assets are duplicated.

## Preview

From `frontend/` run:

```powershell
npm.cmd install --no-audit --no-fund
npm.cmd run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/cube-preview`, select Work, return via Escape/Back/Return, toggle the theme, then compare desktop and mobile. Verify in Firefox on Windows (WebGL2-enabled), not just the fallback.

Static checks: `node --test tests/cube-preview.test.mjs`. Production build: `npm.cmd run build`.

## Boundaries

- `/` remains the original React homepage, including Backend Lab's configuration/auth behavior.
- `/galaxy` remains its separately lazy-loaded React/WebGL experience.
- `/about` remains the static canonical biography page.
- `/cube-preview` is `noindex` at runtime and uses fragment history for `#work`. It does not add an indexed canonical page.
- Lab, Galaxy, and About links intentionally take visitors to their already deployed experiences; only Work unfolds within the preview.
- No deployment or automatic switch of `/` to this preview is part of this phase.

## WebGL acceptance (unverified until tested on owner hardware)

Open Firefox Developer Tools Console and verify no WebGL, GLB loading, CSP, or 404 errors. Check that the actual cube faces move while Work opens and that the overlay emerges from the cube's center; confirm the seam's lighting is convincing in both themes. Test at 390px width and with Windows **Settings → Accessibility → Visual effects → Animation effects off** (or browser `prefers-reduced-motion: reduce`). Test Back/Forward and pressing Escape during the transition. Device performance/thermals remain unverified until measured.

## Implementation

- `CubePortal.jsx` — route shell, theme, accessible Work chapter, URL and focus restoration.
- `cubePortalNavigation.js` — pure route and motion rules.
- `CubeScene.jsx` — lazy 3D renderer lifetime and static fallback.
- `createCubeScene.js` — Three.js GLTFLoader, independent face transforms, bounded DPR, on-demand rendering, cleanup on unmount.
- `CubePortal.css` — isolated light/dark visual system and mobile/reduced-motion adaptations.

The cube is not yet a production-ready replacement for the homepage. This route is the integration and visual acceptance gate.
