# Galaxy Hero Sun Reference

## Purpose

Ground G2R.2 Sun art direction in real solar structure without turning the portfolio into a scientific visualization or importing observational imagery as the visible texture.

The existing Sun surface images in `frontend/public/galaxy/` remain generated/original project assets. The NASA sources below are **visual/scientific references only**.

## Reference hierarchy

### Photosphere / granulation

NASA describes the photosphere as the visible surface of the Sun. Convective motion becomes visible there as granules and supergranules.

Reference:

- NASA Science — Layers of the Sun:
  https://science.nasa.gov/blogs/the-sun-spot/2023/09/26/layers-of-the-sun/
- NASA/Marshall Solar Physics — Granules:
  https://solarscience.msfc.nasa.gov/feature1.shtml

Useful visual rule for this project:

- surface structure should read as many relatively small convection features;
- darker lanes should break up brighter cells;
- the authored texture must not dominate so strongly that the star reads like a painted marble;
- the edge should become dimmer/warmer rather than uniformly bright.

This is qualitative art direction, not a claim that the shader resolves physical 1,000 km granules at scene scale.

### Prominences / corona

NASA describes solar prominences as bright plasma structures anchored to the photosphere and extending outward into the corona.

References:

- NASA — What is a solar prominence?
  https://www.nasa.gov/image-article/what-solar-prominence/
- NASA Science / SDO — Streaming Prominence:
  https://science.nasa.gov/photojournal/streaming-prominence/

Useful visual rule for this project:

- prominences should be sparse;
- they should read as looped structures attached to the limb/surface rather than a generic particle halo;
- they should not surround the whole star;
- the corona should remain narrow/subtle enough that the photosphere stays readable.

## Implementation constraints

- No new external texture is introduced in G2R.2.
- NASA/SDO imagery is not copied into the visible project asset.
- No global bloom/postprocessing dependency is added.
- Prominence geometry exists only on the high-quality/non-low-power path.
- Reduced motion freezes Sun surface evolution/pulsing.
- The single Galaxy render loop remains authoritative.
- The existing authored photosphere remains a load/failure-safe enhancement over the procedural shader.

## Acceptance

Reject if:

- the Sun becomes a uniformly glowing orange sphere;
- the authored map still overwhelms all finer detail;
- the corona becomes a thick fuzzy outline;
- prominence loops look like a decorative crown around the entire star;
- mobile/low-power receives the same high-cost prominence geometry;
- focus content becomes harder to read.

Accept only after desktop and phone normal/reduced captures are inspected.
