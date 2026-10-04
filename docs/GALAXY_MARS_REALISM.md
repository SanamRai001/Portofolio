# G2R.14 — Mars / Projects: photographic terrain lighting

## Grounding and honesty

Existing `frontend/public/galaxy/photoreal/mars.jpg` is an optimized locally
hosted **Solar System Scope / INOVE 2K Mars albedo texture**, CC BY 4.0.
Preserve source credit in `docs/GALAXY_TEXTURE_CREDITS.md` and Galaxy footer.
Mars should be a muted iron-oxide/dusty ochre world with dark volcanic
provinces and subtle atmosphere, not a luminous red fantasy sphere.

Reference hierarchy:
- NASA/JPL/USGS [Viking digital image mosaic / PIA02992](https://science.nasa.gov/photojournal/mars-digital-image-mosaic-globe/) —
  a global image and true-ish colour/albedo reference (NASA explicitly
  documents contrast/stretch); this image is **not** shipped as our atlas.
- NASA GSFC [Mars true-colour rotation with Viking mosaic / MOLA topography](https://svs.gsfc.nasa.gov/0659) —
  shape/lighting reference, not a redistributed asset.
- NASA/JPL/GSFC [MOLA regional topography / PIA01049](https://science.nasa.gov/photojournal/regional-topographic-views-of-mars-from-mola/) —
  distinguishes measured height from albedo; **no MOLA data is claimed or
  inferred from the local colour map**.
- NASA GSFC [Mars overview](https://science.gsfc.nasa.gov/690/Mars.html) —
  dry surface, thin atmosphere, seasonal clouds/dust.

## Implementation scope

`scene/MarsRealism.js` samples the existing Mars photographic colour atlas.
Its seam fix affects only the final 2.5% at either longitude edge. It uses
sun-at-origin directional irradiance and an explicit terminator; the existing
strong red colour enhancement is gently reduced (17% mixing with a neutral
warm luminance model). High quality alone applies small albedo-edge-based
normal microcontrast — cosmetic only, **not terrain height**. Low-power
compiles this extra sampling away.

Before the local JPEG loads, the existing normal-radius procedural
vertex-colour MeshStandardMaterial is shown as a safe offline fallback.
Once loaded, it is replaced with the dedicated photographic shader and
disposed; the installed texture becomes scene-owned. No rock vertex
displacement or pinched polar triangles.

Remove the former `projects-night-side` entirely: those orange city-like dots
were fictional settlement emission and contradicted the intended Mars.
Keep only a substantially more restrained daylight dust limb (scale 1.019,
strength .105), desktop-only. Mobile uses **one globe mesh** and no extra shell,
image, postprocess, particle system, rendering loop or dependency. Projects
semantic navigation/portfolio content and axial spin are unchanged.

## Rejection/verification gates

Reject if: hot neon copper globe, glowing urban-looking nightside, false
topography claims, visible longitude join/polar pinch, dark frame so crushed
surface detail disappears, extra low-power geometry, broken focus/card, missed
Mars JPEG load, phone overflows, or black-hole portal regressions.

Require local `/galaxy/photoreal/mars.jpg` HTTP 200 + `image/jpeg` during
normal/reduced actual browser capture; same-size master/new desktop and phone
focus at start and +8 seconds; original Galaxy/portal/auth/homepage/lint/build
checks; low-power 12k total-triangle contract. The eight-phase optional
~140-second full Mars turn should be used when seam continuity is uncertain.
Hosted Chromium is not a real physical GPU frame-time measurement.
