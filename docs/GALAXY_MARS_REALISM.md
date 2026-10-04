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

## Integration after orbital-motion release

The capture evidence below belongs to the original standalone Mars draft PR #11, which was based on the earlier Saturn merge. G2R.14's authoritative integration branch is now `feat/galaxy-mars-after-motion` from production `cdc0eda0`, incorporating PR #13's moving selected planets, brighter orbit lines and before/+8-second desktop/phone revolution screenshots. All old PR #11 results are prior design evidence, **not** final proof of the integrated renderer. Rerun all checks on the new branch and do not merge either old Mars PR independently.

## Integrated on the merged-motion baseline — browser verification

- Integration branch `feat/galaxy-mars-after-motion` from production `master` `cdc0eda0`; authoritative Mars design ported from prior PR #11 without replacing the new rotation/revolution tests and matched overview captures.
- Visual code head `43c81c3e91cd0e57990de00110ea17a8ddc85ace`: [frontend CI 37214674812](https://github.com/SanamRai001/Portofolio/actions/runs/37214674812) **success**, [Galaxy Visual Capture 37214671548](https://github.com/SanamRai001/Portofolio/actions/runs/37214671548) **success**, artifact `11307344998`.
- All six Galaxy cases reported no errors, all four portal scenarios passed; Mars JPEG returned HTTP 200/image/jpeg on desktop/laptop/phone reduced and desktop/phone normal. The existing Earth/Saturn image checks, motion-fix regression suite and +8-second orbit screenshot gate still passed.
- Inspected Mars at desktop/phone focused after 8s versus **motion-fixed master** using equal crop bounds: no orange night-city speckles; original dark/light albedo remains visible, desktop thin dust limb and phone composition are coherent. Review image: `galaxy-mars-before-after-motion-master.png` from this conversation.
- No fake MOLA claims, new asset, extra render loop or mobile shell. Full 140-second seam sweep and physical GPU/phone performance were not proved by this run. Restore temporary capture workflow before merging; owner visual signoff remains pending.

## Historical PR #11 browser acceptance (2026-10-04)

- Real visual code head: `4e2c78421895dc4071031196058ad48b6fea129e`.
- Full frontend CI passed twice: [37172437450](https://github.com/SanamRai001/Portofolio/actions/runs/37172437450), [37172435088](https://github.com/SanamRai001/Portofolio/actions/runs/37172435088).
- [Galaxy capture 37172435077](https://github.com/SanamRai001/Portofolio/actions/runs/37172435077), artifact `11292460185`, passed six Galaxy cases and four black-hole portal scenarios with empty error arrays. Desktop, laptop and phone normal/reduced response checks returned HTTP 200 `image/jpeg` for the actual local Mars map. Mobile low-power geometry remains within the original Galaxy under-12k-triangles test.
- Inspected final desktop and phone normal-motion Projects at +8s alongside the exact same screenshot crop from prior `master` (merged Saturn `18fa02b7`), plus reduced views. The previous vivid copper light and false city-light dots are absent, while large albedo regions remain readable. Screenshot sheet: `galaxy-mars-g2r14-before-after.png`, linked in conversation.
- The optional expensive 140-second full-turn seam capture was not run; short browser capture and shader/source assertions cover the meridian joining at the camera's presented angle. Requires owner visual approval before production merge.
