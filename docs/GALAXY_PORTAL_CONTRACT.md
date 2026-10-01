# Galaxy G2R.8 — Black-hole portal contract

## Product behavior

Black Hole is currently a seventh selectable Galaxy target. The first click/tap/map-button selection only focuses it, like the other worlds. Once the camera has arrived, an explicit **Enter the horizon** action will be offered. The portal defaults to the personal homepage `/`; a future `/lab` destination must be configurable, not baked into the effect. Escape/Back cancels entry until commitment.

Do not rewrite the homepage, reinterpret the Lab world, or start G7 portfolio content.

## Phase plan

### G2R.8A — State-machine foundation (implemented)

`navigation/PortalController.js` owns the deterministic stage graph:
`idle → approach → plunge → blackout → committed`. It begins only when the navigation controller reports `black-hole` + `body_focused`.

- Normal phases: approach 0.9 s; plunge 1.3 s (delta clamped to 50 ms).
- Reduced motion: jump directly to a short opaque fade; no camera plunge.
- `cancel()`: permitted anytime before commitment, invalidates old transition tokens.
- `confirmBlackout(id, true)`: sole route-commit gate. Calling it early, with a stale token, or when overlay opacity is not confirmed fully opaque must do nothing.
- `destination`: application-local pathname; initial `/`, future `/lab`. Reject external/protocol-relative destinations.
- No React, DOM, window.location, timer, Three.js or extra rAF loop inside this controller.

`portal.test.js` covers phase sequencing, route safety, cancellation/retry, token invalidation, reduced motion and bad deltas.

### G2R.8B — Visible UI and camera

Wire the pure controller into `GalaxyPage` and the existing navigation component. Show a clear Enter button only after Black Hole focus has completed. Other body/map actions and Still View should not conflict with an active portal. Escape/Back cancels before full blackout.

In `createGalaxyScene`, read `portal.getMotion()` from the **existing single render loop**; acquire the current black-hole anchor, ease the existing camera closer during approach, enlarge/accelerate the disk perceptually through perspective during plunge, and cover the scene with an overlay. Do not create another Three.js camera or animation loop. If the scene is unavailable/static, provide a reduced-motion equivalent through the same button.

Use a `position: fixed; inset: 0` pure-black overlay above the entire app. It starts intercepting interaction when entry begins. A rendered/fully opaque coverage acknowledgement must occur **after** the blackout is visibly complete; only then call `confirmBlackout` and the route adapter `window.location.assign(destination)`.

### G2R.8C — Browser acceptance

- Verify normal desktop and phone approach, near-horizon, full blackout, and destination handoff, plus interrupted/rapid Escape/back.
- Verify reduced-motion, paused ambient motion and WebGL/static fallback enter without the full plunge.
- Ensure no flash of unrelated page, leaked HUD, double route assignment, route commit during mere focus/hover, or stuck body after cancellation.
- Capture the precommit blackout frame and route destination explicitly; snapshots of only the first focused black-hole frame are insufficient.
- Maintain current low-power triangle budget, one scene loop, focus framing, pointer/keyboard parity, safe resource disposal and route-isolation gate.

## Current checkpoint

As of 2026-10-01, **only G2R.8A is implemented**. G2R.7 remains selectable but its UI explicitly states `Portal inactive`. The page must not claim the portal is live until G2R.8B/8C are implemented and browser-verified.
