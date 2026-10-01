# Galaxy G2R.5 — Deep-Space Depth

## Goal
Make the existing dark star field feel like deep space during overview and camera travel, without covering planets with nebula/fog or spending extra draw calls on dust.

## Design

The three existing point clouds remain; low/high counts still come from `getPerformanceProfile` and do not increase.

| Layer | Existing spatial range | Camera-follow factor | Appearance |
| --- | --- | ---: | --- |
| Foreground | 85–135 scene units | 0.00 | fewer, slightly larger, lower-brightness stars; world-anchored to show camera movement |
| Middle | 165–215 | 0.44 | smaller, mixed brightness; subtle opposing drift |
| Far | 245–295 | 0.86 | faint/small background sky; a loose, low-density inclined star concentration |

Each set has deterministic seeded positions, brightness, point size and mostly neutral color. A small minority vary slightly toward warm or blue. No new texture, nebula billboard, shader dependency, rAF loop or geometric particle system is introduced.

After `rig.update` in the existing render loop, update each layer position from the current camera position times its follow factor. This is not time-based ambient animation: it stays correct even with reduced motion or when a focus transition occurs while paused. Independently clamped rotational drift runs only if ambient motion is allowed.

## Performance & accessibility

- Exactly three `Points` draw calls and the prior `profile.starCounts` remain.
- Per-frame layer translation and rotation use existing objects; no per-star CPU updates or new array allocations.
- Low power inherits the earlier 120/260/520 star counts and DPR cap.
- Reduced motion freezes drift. Camera-relative depth updates may still snap to the selected view, matching the camera's reduced-motion navigation.
- Stars are never clickable and have depth-write disabled.
- Keep the background nearly black. Stellar variation should not obscure Core or any planet.

## Acceptance

1. `galaxy.test.js` proves deterministic positions, separate depth, exact geometry/counts, bounded colors, camera-follow hierarchy, motion freeze and normal-motion drift.
2. All current auth/runtime/homepage/Galaxy tests, lint and build pass.
3. Compare desktop high-quality overview/Core and desktop/phone focus captures with the earlier G2R.4D baseline, including reduced motion.
4. Review the stars around the Sun and Journey; reject a flat white-speck wallpaper, colored fog, obvious spinning star sphere, overly large point sprites, focus text interference or unexpected mobile crowding.
5. Physical-device GPU/perception checks are a separate release gate.

**Next:** G2R.6 rings. Do not implement black hole or portal as part of the star-field change.
