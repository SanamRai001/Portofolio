# G2R.12 — visible-light Sun realism reference and limits

## Why a different material

G2R.2/G2R.10's orange photographic map blend, exaggerated convection and three large geometric arches resembled a fictional lava body. The previous Earth pass established the standard: observational reference first, then a coherent material with explicit visual acceptance.

NASA/SDO's Helioseismic and Magnetic Imager (HMI) records continuum intensity near the Fe I 6173 Å line. Visible-light full-disk views look relatively smooth at overview scale, with localized darker sunspot groups; dramatic highly structured extreme-ultraviolet disk images have a different spectral/temperature meaning and should not be pasted onto the photosphere.

- NASA SDO HMI channels: https://sdo.gsfc.nasa.gov/data/channels.php
- NASA SVS visible/UV comparison, *February 2013: The Busy Sun*: https://svs.gsfc.nasa.gov/4133
- NASA HMI continuum source-data description: https://data.nasa.gov/dataset/sdo-hmi-continuum-720-second-data
- NASA/JPL and NASA eclipse corona: https://www.nasa.gov/image-article/suns-corona-seen-during-2017-solar-eclipse/
- NASA solar prominence explanation: https://www.nasa.gov/image-article/an-eruptive-solar-prominence/

**Technical honesty:** A spacecraft HMI disk photograph is a single camera projection of one visible hemisphere, NOT a 360° equirectangular UV map. Do not stretch it across a rotating sphere or claim the new shader uses unaltered HMI photography. Instead the new `scene/SunRealism.js` approximates the reference with a seam-free three-dimensional directional noise field, warm-white continuum palette, sunspots (with penumbrae and umbrae), facular edge hints and restrained limb darkening. The already vendored Solar System Scope sun texture contributes *faint luminance variation only*, no orange source colour; its original CC BY 4.0 attribution remains. No NASA observational image has been redistributed in this phase.

## Implementation scope

- New reference-driven Sun-only `SunRealism.js` material, a narrow two-shell corona with weak azimuthal structure, and two short tapered prominence **ribbons** in place of three constant-width 3D tubes.
- Mobile/low-power compiles a cheaper surface shader and excludes the outer corona and both ribbon filaments. It still gets a complete Sun.
- Motion is slow/local; existing `createSun.update(delta, animate)` is the sole animation authority. Reduced motion freezes both convection and filaments.
- No new `requestAnimationFrame`, package, postprocessing/bloom pass or change to planetary sunlight intensity. The existing Core focus and original navigation remain unchanged.

## Visual acceptance

Reject: brightly uniform orange lava surface; false-color UV imagery mislabelled natural photosphere; identical round thick corona; outsized decorative arches; unreadable Core copy; blank or broken mobile fallback; broken Galaxy portal or reduced motion.

Require actual high-quality desktop and low-power mobile screenshots of focused Core (normal and reduced) and desktop overview, compared with prior master at matched viewport. Run original frontend auth/Galaxy/homepage/lint/build and portal visual gate. A hosted Chromium screenshot is not a physical-device GPU/FPS measurement; verify those before production release. This remains a fictional real-time approximation of observed photospheric appearance, not spectrally calibrated solar physics.
