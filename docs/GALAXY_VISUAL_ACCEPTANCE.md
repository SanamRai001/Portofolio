# Galaxy Visual Acceptance

This document defines how cinematic Galaxy work is judged. A green test/build is necessary but cannot prove that the scene looks convincing.

## Capture matrix

For every art-direction phase, capture at least:

| Viewport | Motion |
| --- | --- |
| 1440 × 900 | normal |
| 1280 × 800 | normal |
| 390 × 844 | normal |
| 1440 × 900 | reduced |
| 390 × 844 | reduced |

Low-power-specific visual work also requires a low-power capture.

## Required scene states

As the relevant phases exist, capture:

1. overview;
2. Core/Sun focus;
3. Identity focus;
4. Skills focus;
5. Projects focus;
6. Journey focus;
7. black hole at overview distance;
8. black hole focused;
9. portal approach before commitment;
10. blackout/route-commit frame.

Do not claim a state is visually accepted if it was not inspected.

## Realism/art-direction questions

### Overall

- Does the first frame read as a large space environment rather than spheres arranged on a canvas?
- Is there enough darkness/negative space?
- Is one clear visual anchor dominant?
- Are body sizes and spacing cinematic without feeling like toys?
- Does motion make the scene feel alive without making targets hard to use?

### Sun

Reject if:

- it reads as a flat yellow/orange ball;
- bloom hides the photosphere;
- corona is a thick fuzzy halo;
- procedural noise looks like obvious repeating blobs;
- authored texture seams/polar compression dominate.

Accept when surface scale, limb behavior and corona read as one star from overview and focus distances.

### Planets

Reject if:

- all planets share the same material language;
- surfaces look painted onto perfect plastic spheres;
- atmosphere is a uniform glowing outline;
- cloud motion is synchronized with the surface;
- rotation is fast enough to distract from content;
- texture joins/pole pinching are visible.

A focused world should reveal more material depth than the overview without changing into a different art style.

### Journey rings

Reject if the final high-quality rings read as two flat transparent discs.

Close views should reveal structure/particles/banding; distant views should merge into a coherent ring silhouette.

### Deep space

Reject if:

- stars look like a single flat wallpaper;
- the screen is filled with colorful fog;
- parallax is strong enough to cause motion sickness;
- background effects compete with portfolio content.

### Black hole

Reject if it reads as a black sphere with a neon ring.

At overview distance it should be mysterious but not dominate the system.
At focus distance it should show a convincing accretion/lensing language.
Distortion must remain localized until the portal transition begins.

### Portal transition

The transition succeeds when:

- click/tap/fallback action has one clear outcome;
- camera acquisition feels intentional;
- HUD leaves before the plunge becomes visually chaotic;
- no ordinary page/route flash is visible;
- route commit happens only under full blackout/event-horizon coverage;
- the destination reveal feels continuous;
- reduced-motion users get a short, clean equivalent rather than the full plunge.

## Interaction checks

At each normal-motion viewport:

- each visible target remains clickable/tappable;
- keyboard/fallback navigation still reaches the same destination;
- hover scale does not fight local rotation;
- focused body does not get crossed by unrelated bodies often enough to ruin the composition;
- user can return/cancel where the state machine says cancellation is allowed;
- no horizontal overflow;
- no unreadable HUD/body-label overlap.

## Technical visual failures

Any of these blocks completion:

- page or console error;
- WebGL fallback unexpectedly active;
- obvious asset loading pop that never settles;
- black texture/material after context/resource failure;
- longitude seam;
- pole pinch;
- z-fighting;
- uncontrolled overexposure;
- persistent postprocessing ghosting;
- disposed scene updating from a late asset callback;
- significant layout shift after WebGL ready.

## Evidence record

For each completed phase, add to `docs/PROJECT_STATE.md`:

- branch/head SHA;
- tests/lint/build run;
- capture workflow/run or local artifact location;
- viewports inspected;
- normal/reduced/low-power states inspected;
- observed visual limits;
- physical-device checks, if any;
- exact next phase.

"Looks good" without evidence is not a completion criterion.
