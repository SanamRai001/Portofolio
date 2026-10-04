# G2R.15 — Mercury / Skills reference and acceptance

## Source and limits

The existing local `frontend/public/galaxy/photoreal/mercury.jpg` remains the
credited 2K **Solar System Scope / INOVE (CC BY 4.0)** colour atlas, not a
newly downloaded unmodified NASA map. NASA MESSENGER references are used to
guide colour, surface character and terminology, not copied as project assets.

- [NASA Mercury facts](https://science.nasa.gov/mercury/facts/) — visible
  surface is greyish-brown, with bright recent crater rays; Mercury has a
  very thin exosphere rather than an Earth-like atmosphere.
- [NASA Mercury shows its true colors (PIA10398)](https://science.nasa.gov/photojournal/mercury-shows-its-true-colors/) —
  reflectance and enhanced-filter colour distinctions. Do not advertise an
  enhanced multi-filter mosaic as literally human-eye natural colour.
- [NASA MESSENGER Mercury resources](https://science.nasa.gov/solar-system/resources/resource-packages/mercury-resources/) —
  heavily cratered regolith and low-reflectance terrains.

## Implementation

- `scene/MercuryRealism.js`: same local 2K atlas sampled through a narrow
  longitude seam blend, tempered towards natural grey-brown without erasing
  crater ejecta and smoother plains. Sun-at-world-origin lighting sets a sharp
  airless terminator and dark unlit hemisphere. No fake metalness, atmosphere,
  night city lights or glow.
- High-quality: extra *albedo* local-contrast sampling to make existing crater
  rays and texture detail legible. This is **not measured height or normal
  reconstruction**. Do not use the source atlas as a bump/displacement map.
- Mobile/low power: identical palette/lighting, without four extra detail
  lookups. No new geometry, texture package, postprocessing, RAF or camera
  change. The original complete procedural globe remains visible until the
  authorised Mercury JPEG loads; a 404 must not produce a blank body.
- The planet's `skills-surface` rotates on the established axial clock.
  `skills-satellites` is its sibling, **not its child**; ten interactive node
  roots keep independent movement, keyboard/touch hit targets and selection.
  Planet-root revolution remains independent, using the merged PR #13
  overview=100%, hover=82%, focus=65% rates. Reduced motion and Pause stop both.

## Verification and rejection

1. Unit tests check quality-tier shader branches, natural albedo/terminator,
   fallback resource ownership, node hierarchy, focused axial spin and planet
   revolution. Preserve existing Skills selection, camera, Galaxy and portal
   tests.
2. Browser capture desktop/laptop/phone (normal and reduced), with explicit
   200/image/jpeg validation for the actual local Mercury atlas in fresh
   contexts. Inspect focused Skills screenshot immediately and after eight
   seconds; verify all ten skill targets remain usable.
3. Reject shiny chrome-looking Mercury; conspicuous atmosphere; fictional
   emissive cities; crater texture that disappears under grey wash; orbit
   lines becoming unreadable; changing planet position without spinning its
   surface; moving satellites with the planet texture; clipping the Skills
   content or portrait canvas.
4. Full auth/Galaxy/homepage tests, lint, production build, real image captures
   and four black-hole portal scenarios. Review physical laptop/phone FPS and
   touch separately in G2R.16. Do not infer physical-device performance from
   hosted headless Chromium.

The phase is independently reviewable and should not be merged before visual
approval.
