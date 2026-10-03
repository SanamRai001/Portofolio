# G2R.14 — Mars / Projects albedo and thin-atmosphere realism

## Source hierarchy

The locally vendored `frontend/public/galaxy/photoreal/mars.jpg` is the attributed
Solar System Scope / INOVE CC BY 4.0 2K equirectangular Mars atlas, already
registered by `GALAXY_TEXTURES.projects`. It remains the authoritative colour
source, including dark basaltic terrains, bright iron-rich dust areas and
polar terrain. Retain the route-footer credit in `GalaxyPage.jsx`.

Reference-only NASA resources:

- NASA/JPL, *Mars Digital Image Mosaic Globe*, PIA02992,
  https://www.jpl.nasa.gov/images/pia02992-mars-digital-image-mosaic-globe/
  (Mars Viking imagery with photometric and mosaic processing; contrast may be
  enhanced and some darker regions less red than the brighter zones).
- NASA/JPL, *Mars Topography*, PIA02820,
  https://science.nasa.gov/photojournal/mars-topography/
- NASA/JPL, *MOLA Global Roughness Map*, PIA02808,
  https://science.nasa.gov/photojournal/mola-global-roughness-map-of-mars/
  (observational terrain-character references ONLY; topography's false-colour
  elevation is not substitute photoreal albedo).
- NASA, *The Atmosphere of Mars*,
  https://science.nasa.gov/mars/facts/

**Attribution honesty:** The upgraded renderer does NOT import a new NASA raster,
claim that colour variations measure elevation, or introduce a physically
calibrated atmospheric model. The existing CC BY atlas remains unchanged.

## Before

`ProjectsPlanet.js` reused a MeshStandardMaterial with the colour atlas as
`bumpMap` and overlaid bright speculative `createNightSideLayer` "settlement
lights." This resembled an inhabited lava planet, not Mars. The shallow
`createLightAwareAtmosphere` shell was also too saturated.

## G2R.14 implementation

- Preserve existing smooth, no-vertex-displacement Mars sphere. Its procedural
  vertex-colour MeshStandardMaterial is a valid no-network visual fallback.
- Once local `mars.jpg` successfully loads, switch to the Mars-specific
  `MarsRealism.js` ShaderMaterial. Samples the original map without false
  additional colour, blends just 2% at the source atlas longitude join, and
  adds very subtle high-quality micro-weathering (not geographic elevation).
- Shade from the same true world-space Core-at-origin direction as the rest of
  the planets; far night side remains close to black. Remove the wholly
  fictional emitted city/settlement mesh in both desktop and phone tiers.
- Narrow the existing desktop-only day-aware atmospheric dust shell to
  radius ×1.022, warm stone colour and alpha .115. No haze or extra geometry on
  low power. Preserve original orbital/angular update, reduced-motion
  freeze and all navigation, no extra `requestAnimationFrame`, no new package.
- Loaded atlas stays owned by `disposeScene` via a shader sampler uniform;
  the pre-load fallback material is disposed on replacement. The authored
  controller owns unsuccessful/late-load texture disposal. If the actual JPEG
  fails, the procedural fallback still draws.

## Visual acceptance

Reject if: Mars appears as uniform orange lava, the night side has city lights,
the pole pinches from false geometry displacement, the atlas has a vertical
longitude seam, the atmospheric rim forms a thick neon halo, detail disappears
on phone, project copy/navigation overlaps the planet, or any render/portal
scenario errors. Must verify actual local Mars JPEG HTTP 200 in fresh desktop
and phone browser captures (rather than passing a procedural fallback silently).

Require paired focused Projects desktop/laptop/phone screenshots, normal and
reduced motion, baseline comparison, frontend auth/Galaxy/homepage/lint/build,
and portal test. Hosted software Chromium does not prove device GPU/FPS.

## Captured acceptance evidence (2026-10-03)

- Rendering code SHA: `85c9a153fde39e09931802df802bdfe29db731f2`.
- [Frontend CI run 37140714341](https://github.com/SanamRai001/Portofolio/actions/runs/37140714341) passed auth, Galaxy, homepage DOM, lint and production build.
- [Galaxy Visual Capture 37140710428](https://github.com/SanamRai001/Portofolio/actions/runs/37140710428) passed, artifact `11280800545`; six normal/reduced capture contexts show no page/console errors or horizontal overflow; four portal scenarios passed. Mars JPEG returned HTTP 200 and image/jpeg in each desktop/laptop/phone reduced context and both desktop/phone normal contexts. The other Earth/Saturn JPEG/PNG checks retained their success.
- Inspected focused Projects normal-motion +8 seconds on desktop and phone plus reduced captures. Compared with original merged-master screenshots at equivalent focus and viewport. Mars now has an unlit dark side rather than artificial orange night-side points; albedo terrain remains visible; Projects title and navigation are clear.
- Side-by-side output `galaxy-mars-g2r14-before-after.png` is supplied in the conversation; this is a screenshot review, not an astronomical colour-calibration or a physical-device frame-rate benchmark.
- Temporary feature-branch visual CI trigger restored before proposing merge. Owner visual approval required.
