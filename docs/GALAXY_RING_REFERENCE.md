# Galaxy — Journey ring reference and design (G2R.6)

## Provenance: reference-only source imagery

The existing Journey body is an original fictional gas giant, not a NASA/Saturn replica. No external image, astronomical texture, or third-party model is copied into the runtime in G2R.6.

1. NASA/JPL/Space Science Institute — **Translucent Rings** (Cassini, 2014): https://www.nasa.gov/image-article/translucent-rings/ . Saturn's rings can be optically translucent, so avoid opaque full-width slabs.
2. NASA Science — **A Full Sweep of Saturn's Rings (with labels)**: https://science.nasa.gov/resource/a-full-sweep-of-saturns-rings-with-labels/ . Reference for visually distinct B/A bands, central Cassini division and natural radial brightness changes.
3. NASA Science — **Rings and More Rings**: https://science.nasa.gov/photojournal/rings-and-more-rings/ . Faint ringlets can exist within gaps; pure uniform black annulus is not the only possible appearance.
4. NASA JPL — **Cassini's Inside-Out Rings Movie**: https://www.jpl.nasa.gov/images/pia21886-cassinis-inside-out-rings-movie/ . At grazing angles, ring material is visibly foreshortened and appears substantially thinner.

All are reference-only. The fictional ring pattern and shader are written for the site and have no external runtime asset or new image-license dependency.

## Implemented appearance and technique

- Retain original Journey radius and total ring envelope `body.ring = [1.45, 2.15]`. A single `RingGeometry` mesh, named `journey-ring-bands`, replaces both legacy uniform-color discs only for Journey; Lab's original ring helper remains untouched.
- Two broad radial material zones with a narrow Cassini-like low-density division and faint central ringlet. Band transitions and edge fade are transparent, not painted black on an opaque disc.
- High quality: 192 azimuthal segments, five radial geometry subdivisions, derivative-filtered higher-frequency ringlets and subtle angular density variation at close distances.
- Low power: 96 azimuthal segments, one radial subdivision, no expensive detail branch; same broad visual identity and lower geometry cost than the former two meshes.
- Sun-incidence lighting and an approximate planet-cast shadow reduce the old flat uniform fill, without a second light source or particle animation loop.
- The ring group remains fixed relative to the planet presentation while Journey's cloud-top surface rotates independently.
- The existing scene lifecycle disposes both material and geometry. Keep the surface map, haze policy, routing, selection and camera implementation unchanged.

## Visual acceptance

Inspect desktop high-quality and mobile low-power at both overview and Journey focus, normal and reduced motion. Confirm that close-up radial bands are legible without repeating alias/moiré, the whole disc reads as an inclined ellipse instead of two face-on hoops, the central division is genuinely translucent, and the planet correctly occludes the far ring material. Avoid strong colored glow or a grainy rotating vinyl-record appearance. Real-device GPU checks remain a separate release gate.
