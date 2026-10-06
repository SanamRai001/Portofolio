# G4D — project-specific social preview cards

## Why this phase exists

G4C made the six canonical project routes crawler-readable, but every project still publishes the same generic `/projects/portfolio-system.png` in `og:image` and `twitter:image`. A StateScout or Reality Archive link therefore has project-specific text metadata but a generic visual preview.

G4D fixes only that share-preview mismatch. It does not change Galaxy WebGL, navigation, camera, project content, orbit simulation or runtime architecture.

## Scope

For each curated `PROJECT_NODES` entry:
- create one local static **1200×630 PNG** social card;
- use the project label, category and a short bounded technical descriptor derived from the existing project data;
- use one coherent Galaxy/portfolio visual system, but give each project enough identity to distinguish six links in a feed;
- keep text large and sparse enough for mobile share previews;
- no logos copied from third parties and no external runtime image URLs.

Target paths:
`/galaxy/social/<project-id>.png`

## Metadata integration

Extend `projectMetadata(project)` so `image` becomes:
`https://sanam-rai.com.np/galaxy/social/<project-id>.png`

The same metadata object must continue to drive:
- raw G4C project HTML;
- runtime `og:image`;
- runtime `twitter:image`.

Do not create a second metadata map just for images.

## Verification

Automated:
1. every `PROJECT_NODES` id has exactly one expected local PNG;
2. PNG signature is valid and dimensions are exactly 1200×630;
3. every `projectMetadata(project).image` is unique and absolute;
4. generated project HTML contains the matching absolute OG/Twitter image before React executes;
5. switching StateScout → Reality Archive in runtime metadata changes both image tags;
6. existing Galaxy tests, lint, build and prerender verifier remain green.

Browser:
- fetch each social image URL and require HTTP 200 / `image/png`;
- direct-load at least two canonical project routes and confirm their raw/runtime image metadata;
- normal desktop/phone Galaxy screenshots remain visually unchanged because G4D adds no scene code.

## Explicit non-goals

- no new 3D project moons/signals;
- no page redesign;
- no SSR/framework migration;
- no social-image generation in the production browser;
- no animated/video share card;
- no deeper case-study prose in this phase;
- no changes to planet spin, revolution, orbit lines or render-loop behavior.

## Exit

G4D is complete only when all six canonical project URLs emit distinct, local, validated social-preview PNG metadata and existing Galaxy behavior is unchanged.
