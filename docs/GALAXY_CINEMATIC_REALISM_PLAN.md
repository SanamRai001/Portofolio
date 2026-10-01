# Galaxy Cinematic Realism Plan

## Purpose

Turn `/galaxy` from a good Three.js solar-system portfolio into a cinematic, believable interactive universe without discarding the working G1-G6 navigation/content foundation.

This is a visual-system upgrade, not G7 content work.

The target feeling is:

- alive rather than static;
- physically believable rather than scientifically exact;
- dark, restrained and cinematic rather than effect-heavy;
- memorable on desktop while still intentional on mobile/low-power hardware;
- smooth enough that navigation remains usable;
- architected so future moons, Lab content and new destinations do not require another rewrite.

## Baseline

Work starts from `feat/galaxy-cinematic-surface-spike`, which is nine commits ahead of `master` and not diverged from it at planning time.

Existing systems to preserve:

- one shared render loop;
- existing orbit simulation and body targeting;
- current camera/navigation controller;
- interaction raycasting and keyboard/pointer fallbacks;
- reduced-motion and low-power profiles;
- semantic content outside the WebGL canvas;
- disposal/resource ownership;
- screenshot capture workflow;
- current Sun and Projects authored-surface fallbacks;
- G1-G6 behavior and tests.

Do not restart the Galaxy scene from scratch.

## What we are borrowing from MaybeBoudha

MaybeBoudha's useful lesson is methodology, not its exact renderer.

Carry over:

1. **Reference-grounded art direction.** Do not guess important silhouettes/material behavior blindly. Collect visual references before changing a hero body.
2. **Hybrid rendering.** Combine geometry, authored textures, procedural shaders, lighting and atmosphere instead of expecting one technique to do everything.
3. **Source honesty/provenance.** Track where externally sourced textures/reference data came from and what transformations were applied.
4. **Visual evidence.** Automated desktop/mobile captures are part of acceptance, not an afterthought.
5. **Selective expensive detail.** Spend GPU budget on hero moments and keep distant/background elements cheap.
6. **Progressive fallbacks.** A failed texture/effect must degrade to a complete procedural or simpler visual instead of breaking the scene.

Do not copy MaybeBoudha's point-cloud/Poisson pipeline into Galaxy. Fictional celestial bodies do not benefit from splat/scan reconstruction as their primary representation.

## Art direction rules

- Space stays mostly black.
- The Sun, atmosphere edges, rings, eclipses and black hole are the main spectacle.
- Avoid rainbow nebula overload, excessive bloom and constant screen distortion.
- Every primary body must have its own visual identity.
- Planet motion should be slow enough to remain clickable/readable.
- Scale may be cinematic rather than astronomically exact, but it must communicate depth.
- No floating technology logos painted onto planets.
- No visual effect may make semantic portfolio content harder to read.

## Rendering architecture

Keep the existing presentation pattern and evolve it rather than introducing a parallel engine.

A celestial presentation should continue to expose a small lifecycle:

```text
create -> update -> setInteraction -> dispose
```

The shared solar-system owner remains responsible for:

- body roots and world transforms;
- orbit simulation;
- hit targets;
- visibility/focus interaction;
- shared lighting;
- update orchestration.

Individual presentations own only their local resources.

### Planet layer model

Each hero planet can compose only the layers it needs:

```text
BodyRoot
├── axialTiltRoot
│   ├── surface
│   ├── night/emissive layer (optional)
│   ├── cloud shell (optional)
│   └── rings / local particles (optional)
├── atmosphere shell
└── focus anchor / interaction target
```

The surface and clouds may rotate at different deterministic rates. Atmosphere is primarily view/light driven, not spun merely to create motion.

### Motion model

There are two distinct motions:

1. **Orbit motion** — existing `createOrbitSimulation`; slow, focus-aware and pausable.
2. **Local rotation** — axial rotation of the body presentation.

Add per-body data rather than hard-coded conditionals:

```js
rotation: {
  axialTilt,
  surfaceSpeed,
  cloudSpeed,
  direction
}
```

Requirements:

- deterministic;
- delta-clamped;
- stops under reduced motion / explicit pause;
- selected/hovered behavior must not change navigation state;
- no independent requestAnimationFrame loops;
- no motion based on wall-clock time in tests.

### Hero Sun

Evolve the current Sun instead of replacing it blindly.

Target layers:

- authored/reference-inspired photosphere detail;
- procedural fine convection/turbulence;
- limb darkening / edge behavior;
- narrow corona;
- optional sparse prominence sprites/meshes on high quality;
- Sun-driven point light;
- slow surface motion.

Reject a result if the Sun reads as a glowing orange ball with blur.

### Planet realism system

Create reusable helpers for:

- albedo/detail texture handling;
- normal/bump response where useful;
- physically plausible roughness/metalness defaults;
- atmosphere shell;
- cloud shell with independent rotation;
- optional night-side emissive mask;
- ring presentation.

Do not force every planet to use every layer.

World identity direction:

- **Identity:** terrestrial/oceanic, calm atmosphere/cloud motion.
- **Skills:** engineered/metallic world with restrained artificial structures/energy language.
- **Projects:** rocky/civilized world; authored terrain remains a useful baseline and may gain night-side settlement detail later.
- **Journey:** ringed/weathered world; rings should become a major scale cue.
- **Lab:** remains separate from normal planets and should feel anomalous.

### Deep-space environment

Replace the feeling of a flat star backdrop with cheap depth layers:

- distant static stars;
- nearer sparse parallax stars;
- extremely restrained dust;
- optional distant nebula/galaxy billboards only where they improve composition.

Avoid moving every star. Background motion should support camera travel, not look like a screensaver.

## Black-hole portal

The black hole is a navigation object and a signature transition, not another planet skin.

### Visual composition

High-quality path may include:

- event-horizon core;
- emissive accretion disk;
- warped/lensed star appearance around the silhouette;
- sparse orbiting particles;
- subtle local bloom;
- distance-dependent audio later.

Low-power path may use a simpler shader/ring distortion without scene-wide postprocessing.

Do not ship a black sphere plus flat glowing ring as the final high-quality result.

### Portal interaction

The black hole is selectable through the same navigation principles as other bodies.

First click/tap:

- target and smoothly approach it;
- preserve cancel/back semantics until the portal commitment point.

Portal activation then runs a dedicated transition state machine:

```text
IDLE
  -> ACQUIRE
  -> APPROACH
  -> PLUNGE
  -> BLACKOUT
  -> ROUTE_COMMIT
  -> REVEAL
```

Default destination for the first implementation: `/`.

Destination must be data/config driven so a future `/lab` route can use the same portal without rewriting the transition.

Critical route rule:

**Do not commit the React route until the event horizon/blackout fully covers the viewport.**

This prevents a normal route flash from breaking the illusion.

Reduced-motion behavior:

- no rapid zoom, star streak or heavy distortion;
- short opacity transition;
- route still changes through the same semantic action.

Keyboard/fallback UI must expose an equivalent "Enter portal / Return to portfolio" action.

### Transition progress

Drive the cinematic effects from one normalized progress value rather than unrelated timers.

Example mapping:

```text
progress
  -> camera approach
  -> black-hole distortion
  -> accretion intensity
  -> star streak amount
  -> HUD opacity
  -> audio intensity (later)
  -> blackout
```

Navigation state owns whether the transition is active; render code owns only presentation.

## Quality tiers

Extend the existing profile rather than building a second settings system.

Conceptual tiers:

- **HIGH:** full atmosphere/cloud layers, denser rings/particles, black-hole lensing, higher texture tier.
- **MEDIUM:** same composition with reduced samples/segments/particles.
- **LOW:** simplified atmosphere, smaller textures, sparse particles, cheaper black hole.
- **REDUCED MOTION:** stable scene with transitions converted to short fades and ambient/orbital/local motion frozen.

AUTO should choose a sensible profile using the existing low-power/DPR/FPS approach.

Any quality feature must have a cheaper fallback before it is merged.

## Performance rules

Targets are acceptance goals, not claims until measured:

- avoid extra animation loops;
- lazy-load non-overview hero assets;
- cap DPR through the existing profile;
- share geometry/material resources when ownership is clear;
- do not keep full-detail clouds/particles active for distant bodies unnecessarily;
- use distance/focus-based detail changes before adding more global effects;
- measure bundle size after every rendering dependency/import change;
- physical-device GPU performance remains a separate verification gate.

## Asset and provenance rule

For every externally sourced astronomical texture/reference dataset later added, record:

- asset name;
- source URL/provider;
- license/usage permission;
- whether it is direct texture data or only visual reference;
- transformations/compression performed;
- final project path.

Generated fictional textures must be labeled as generated/original rather than NASA/observational data.

Create/update a dedicated asset register when the first new external asset enters this phase.

## Test and verification strategy

Preserve existing unit/DOM/navigation tests, then add focused tests for new deterministic behavior.

Testable contracts include:

- axial rotation advances only when animation is enabled;
- cloud and surface rates may differ;
- pause/reduced-motion freezes local rotation;
- body selection does not create a second loop;
- portal state transitions are deterministic;
- route commit cannot occur before blackout;
- portal destination is configurable;
- cancel/back behavior works before commitment;
- low-power path avoids high-cost presentation;
- all resources are disposed.

Visual verification remains mandatory because unit tests cannot prove realism.

See `docs/GALAXY_VISUAL_ACCEPTANCE.md`.

## Delivery phases

### G2R.0 — Planning and guardrails

- this plan;
- visual acceptance matrix;
- project-state checkpoint.

**Exit:** later work has a single agreed architecture and visual gate.

### G2R.1 — Rendering/motion foundation

- introduce reusable local-rotation/axial-tilt data;
- add deterministic surface rotation to remaining planets;
- keep orbit behavior unchanged;
- prepare quality-aware layer helpers;
- renderer/tone/exposure changes only if supported by comparison captures.

**Exit:** system feels alive without changing navigation/content.

### G2R.2 — Hero Sun

- reference pass;
- refine photosphere, corona and high-quality optional prominence detail;
- capture desktop/mobile/high-low comparisons.

### G2R.3 — Planet realism primitives

- atmosphere helper;
- cloud helper;
- authored texture/material pipeline;
- night/emissive option;
- per-layer update/disposal contracts.

### G2R.4 — World identities

Apply the primitives intentionally to Identity, Skills, Projects and Journey one at a time.

No batch "make all planets realistic" commit.

### G2R.5 — Deep-space depth

- star depth/parallax;
- restrained dust/nebula composition;
- preserve readability and navigation.

### G2R.6 — Journey rings and orbital scale

- high-quality ring system;
- low-power fallback;
- close/far visual behavior.

### G2R.7 — Black-hole visual object

- black-hole presentation;
- accretion disk;
- quality-tier lensing/distortion approximation;
- selectable target.

No route transition yet.

### G2R.8 — Cinematic navigation/portal

- portal state machine;
- black-hole approach/plunge/blackout;
- route commit to `/`;
- reduced-motion/fallback equivalent;
- reusable destination contract.

### G2R.9 — Audio and microinteraction

Only after visuals/navigation are stable.

- optional ambient bed;
- restrained proximity/portal response;
- mute persisted through existing app preferences if available.

### G2R.10 — Performance/mobile/accessibility hardening

- quality-tier tuning;
- physical-device checks;
- touch acceptance;
- reduced-motion acceptance;
- bundle/resource audit.

### G2R.11 — Final cinematic composition

- system spacing;
- camera framing;
- eclipse/flyby opportunities;
- final screenshot/video evidence;
- no new feature scope.

## Non-goals for this sequence

- G7 content implementation;
- project moons/content;
- full Journey content;
- full Lab content;
- VR/WebXR;
- physically accurate N-body simulation;
- photorealism claims;
- switching the whole app to another 3D framework;
- rewriting the homepage;
- adding a separate game engine.

## Resume rule

Before every phase:

1. read `docs/PROJECT_STATE.md` and this plan;
2. inspect the actual branch/repository state;
3. run the existing relevant verification baseline;
4. make one visual-system change at a time;
5. capture evidence before calling an art-direction phase complete;
6. update `docs/PROJECT_STATE.md` with what changed, verification, risks and the exact next phase.

Repository state wins if documentation is stale.
