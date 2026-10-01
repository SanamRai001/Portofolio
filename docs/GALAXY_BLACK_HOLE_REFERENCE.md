# Galaxy G2R.7 — Black-hole visual target

## Reference/provenance

This is a fictional cinematic black hole using observation-backed visual cues, **not** a scientifically accurate gravitational ray tracer. No external NASA image, texture, model or third-party shader is copied into the project.

- NASA Goddard, *NASA Visualization Shows a Black Hole's Warped World*:
  https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/
  Reference: dark shadow, asymmetric approach/recede emission, thin localized photon ring, and the far-side accretion disk appearing above the black-hole silhouette.
- NASA Science, *Anatomy of a Black Hole*:
  https://science.nasa.gov/universe/black-holes/anatomy/
  Reference: broad heated accretion disk and view-dependent warped disk shape.
- NASA APOD, *Visualization: A Black Hole Accretion Disk* (May 8, 2024):
  https://science.nasa.gov/image-article/apod-2024-may-8-visualization-a-black-hole-accretion-disk/
  Reference: disk-plane composition and restrained photon-ring hierarchy.
- NASA Scientific Visualization Studio, *Black Hole Visualization Takes Viewers Beyond the Brink*:
  https://svs.gsfc.nasa.gov/14576/
  Future portal-motion reference only; no transition footage used here.

## Scope contract

G2R.7 introduces only a seventh, fixed, selectable `black-hole` target in `SYSTEM_MAP`, at a peripheral location away from Core/Journey and distinct from Lab. It can be reached from the native system map, pointer selection and keyboard/static SVG fallback. Existing camera navigation performs a normal focus/return; **there is no route change, plunge, event-horizon commitment or portal button in G2R.7**. Those belong to G2R.8, with initial destination `/` and a later configurable `/lab` contract.

## Visual implementation

- A truly dark depth-writing horizon sphere occludes the far side of the disk.
- One tilted transparent accretion-disk shader uses radial heat/opacity grading, broad irregular bands and a subtle view-direction-dependent approach/recede asymmetry.
- High quality: denser disk mesh, filtered narrow spiral/ringlet detail, modest far-side inner-disk vertex lift and one localized low-opacity Fresnel photon-halo approximation.
- Low power: smaller horizon mesh, 64-segment single-radial-band disk and no second lens mesh or high-frequency detail.
- Normal motion advances the disk's deterministic shader time inside `createSolarSystem.update`; pause/reduced motion holds it constant. Focus slightly increases visibility without turning the overview signal into a bright icon.
- Body selection, camera travel and return-to-system remain in the existing scene lifecycle and semantic navigation controller.
- There is no global postprocessing, background texture refraction, second camera, second animation loop, external rendering package or added asset-download dependency.

## Visual checks

Inspect overview and focused desktop (1440×900 high quality), laptop (1280×800 high quality), and phone (390×844 low power), normal and reduced motion. Reject an opaque neon donut or a giant dark hole dominating Core. The selected view should clearly show a dark central silhouette, independent hot inner/cooler outer disk, elliptical/warped far-side light and stable lettering. Validate that no other planet and no static fallback regresses, no horizontal overflow appears, and that focusing/return never leaves the route. Record exact CI/artifact results in `docs/PROJECT_STATE.md`.

## Out of scope

The clickable destination and dramatic zoom/blackout are **G2R.8**, not an implicit behavior of this phase. True spacetime lensing of background stars and relativistic ray tracing are also out of scope under the current integrated-GPU quality budget.
