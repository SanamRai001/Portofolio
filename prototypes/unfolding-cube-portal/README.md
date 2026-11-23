# Sanam Rai — Cube Portal (Work-only prototype)

An isolated prototype implementing the approved **cube opens → Work page is revealed through the opening → page fills the viewport** interaction. This directory is intentionally separate from the published portfolio; no Git repository, Backend Lab, or Galaxy was changed.

## How to run (Windows / PowerShell)

1. Extract the ZIP and open PowerShell in the `unfolding-cube-portal` folder.
2. Run `node .\server.mjs`.
3. Visit `http://localhost:8765/`.
4. Select **Work**; use **Return to cube**, **Escape**, or browser Back to reverse the animation. Toggle light/dark using the header icon.
5. Stop the server with Ctrl+C.

Node.js only; no `npm install`. Keep the `assets` folder beside `index.html`.

## Changes from prototype V3

- No sideways movement or shrink to the corner when Work is selected.
- Real GLB stone panels (on WebGL2 browsers) still separate outward; the Work page expands from the cube's center through an animated circular mask. The text fades in after the stone opens.
- WebGL-disabled browsers use a lightweight three-piece textured fallback that parts at the opening. The preview GIF was captured using this fallback, **not** the real WebGL renderer.
- Work becomes normal accessible HTML with a real URL hash (`#work`), logical focus, and an obvious return action.
- Browser Back and Escape reverse the mask; the cube closes into its original position.
- Responsive layout and reduced-motion instant navigation remain supported.
- Lab, Galaxy and About are unchanged outbound links for this Work-only proof, not integrated portal destinations.

## Files

- `assets/stone-cube.glb`: original reusable glTF 2.0 stone model (six stone panels, six backing panels, dark core, gold heart). Unchanged.
- `assets/stone-cube-fallback.webp`: fallback texture used as separated masked faces.
- `index.html`: layout, portal transition, navigation and theme logic.
- `cube-viewer.js`: WebGL2 3D renderer, now keyed to opening/closing phase.
- `source/`: reproducible model-generation source from prior prototype.
- `cube-portal-motion.gif`, `portal-*-home.png`, `portal-*-opening.png`, `portal-*-work.png`, `portal-*-dark.png`: CSS fallback browser previews.
- `tests/check_portal.py`, `tests/portal-results.json`: browser acceptance checks; browser test uses inlined local assets because local web navigation is blocked in the testing environment.

## Verification

**Passed** in the restricted Chromium test environment (CSS fallback): desktop 1440×900, mobile 390×844, theme change, Work reveal, close/Back, no horizontal overflow, no page JS exceptions, focus on Work heading, reduced-motion instant transition, and interrupting the animation with Back. The intermediate snapshot confirms there is **no cube translate/scale** and that the reveal mask expands from the cube.

**Not verified:** actual WebGL2 rendering, the visible motion of GLB faces on the user's GPU, FPS/thermal behavior, Firefox rendering, and production React integration. Those require testing the local server in a browser with WebGL2 enabled.

## Acceptance to test locally

Look for (1) a genuine 3D opening rather than a sideways shift, (2) the Work page emerging from inside the cube, (3) no overlap/glitch at mid-animation, (4) smooth return and Back behavior, (5) legible mobile Work content, and (6) identical content in light/dark modes.
