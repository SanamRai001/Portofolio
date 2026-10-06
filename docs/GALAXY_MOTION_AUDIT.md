# Galaxy motion and orbit visibility audit (G2R.M1)

Date: 2026-10-04. Baseline: Saturn-merged master 18fa02b. Motion branch: fix/galaxy-motion-orbit-readability.

## Why motion looked broken

The Three.js animation loop is already present in createGalaxyScene.js. SolarSystem.js advances two separate mechanisms: each surface mesh's axial rotation and each planet root's orbital position. The planet root and its static orbital LineLoop are built from the SAME orbitPosition function. The Moon and Earth's clouds have independent local rotations; Saturn's rings intentionally remain independent of its spinning gas.

The actual focus bug: NavigationController.orbitRateTarget returned ZERO for the selected planet. Focus therefore completely stopped revolution, while surface rotation continued. During focus the camera also tracks the selected root, so judging revolution solely by a close-up is misleading. The four static orbital tracks had muted color #68717d with opacity 0.23, making them difficult to see against dark space. A track should not itself revolve: it is the fixed locus followed by the planet.

## Motion policy after this correction

- Overview: 100% of each body's authored orbital speed.
- Hovered: 82%; selected: 65%, both continuously greater than zero, eased by the existing orbit simulation. The focus camera follows the moving anchor.
- The visible Pause control was removed in G3B.1. OS reduced-motion, page hidden/offscreen lifecycle control, and static fallback still stop ambient revolution/spin intentionally. No additional requestAnimationFrame and no second clock were introduced.
- Rotation is surface.rotation.y with fixed axial tilt; revolution is root.position from orbitPosition. Do not animate a decorative texture instead of the actual globe root.
- Identity / Earth additionally reduced its local surface rotation to just 18% on focus. Increase that interaction-only scalar to 82% (hover 92%) so Earth’s real 2K/4K atlas can visibly rotate over an eight-second close-up; base rotation/orbit data and independent cloud movement remain unchanged.

| Portfolio world | Surface rate (rad/s) | Orbital rate (rad/s) | One overview revolution, approximately |
| --- | ---: | ---: | --- |
| Identity / Earth | 0.022 | 0.035 | 3 minutes |
| Skills / Mercury | 0.014 | 0.024 | 4 minutes 22 seconds |
| Projects / Mars | 0.045 | 0.017 | 6 minutes 10 seconds |
| Journey / Saturn | 0.009, retrograde | 0.011 | 9 minutes 31 seconds |

These are cinematic scene speeds, NOT actual astronomical orbital periods. Saturn's ring plane should remain aligned with its axial tilt even while the gas rotates. The Sun remains at the center.

## Orbit visibility correction

Keep the same four LineLoop tracks, each with 128 sample points, using orbitPosition for both geometry and simulation. No additional geometry/draw calls. Overview remains cool-grey #9cacbf at opacity 0.48 so all four real loci are readable. G2R.16 separates that system-map purpose from focused content: desktop focus fades selected/other WORLD tracks to .18/.055; portrait focus uses .06/.012. Skills-local satellite rings remain .20 and are unaffected. Keep depthTest true and depthWrite false, so opaque bodies correctly occlude a path.

This is presentation only. It does **not** change the simulation target rates (overview 1.0, hover .82, selected .65), orbit geometry, focus camera tracking, or reduced/hidden/offscreen lifecycle behavior. Browser run 37328241293 / artifact 11353685738 verified that phone Skills copy is no longer visually competed with by global tracks while overview paths remain visible.

## Proof required

1. Automated test each rendered track's sampled coordinates against orbitPosition at multiple phases. Assert correct orbital radius and independently changing root position/surface yaw over simulated eight seconds, including a focused body.
2. Test reduced-motion and hidden/offscreen lifecycle states freeze ambient motion, and that the camera target continues following a moving selected body without a new navigation transition.
3. Capture desktop and phone matched normal-motion overview before and after eight seconds. Also capture the existing focused surface start/+8s and reduced-motion overview. Compare the real image pairs, not just passing test/build statuses.
4. Require no new package or RAF, no clipping/horizontal overflow, no broken black-hole portal, green frontend tests/lint/build and visual signoff before merge. Headless SwiftShader is not a physical hardware FPS test.

## Troubleshooting

- No rotation/revolution anywhere: check the reduced-motion media query, document visibility, IntersectionObserver in-view state, WebGL fallback/context loss, and the render-loop continuous flag.
- Focused body stays screen-centered: expected camera tracking. Observe orbital root coordinates or return to overview to judge revolution.
- Surface appears still but root travels: check real atlas load, yaw rate and daylight shading (some imagery is low-contrast). A slow 8s rotation may be subtle.
- Planet strays from drawn path: ensure orbital geometry and simulation both call orbitPosition and the track remains static in world space.
- Saturn rings fail to spin with gas: expected, because they are a separate tilted ring system.
