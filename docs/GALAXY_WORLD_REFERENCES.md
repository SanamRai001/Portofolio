# Galaxy World References

These references guide visual behavior and composition. They are not copied directly into the rendered fictional worlds unless a later asset-register entry explicitly says otherwise.

## Identity — terrestrial world

### Reference observations

NASA describes Earth's atmosphere from orbit as a thin luminous limb that gradually fades into black space:

- NASA Science — The Atmosphere: Earth's Security Blanket
  https://science.nasa.gov/earth/earth-atmosphere/the-atmosphere-earths-security-blanket/

NASA Earth-at-night imagery also shows a useful layering order from orbit: dark surface, broken cloud cover, thin atmospheric glow and—where appropriate—localized night illumination:

- NASA Earth Observatory — Earth Awash in Lights of the Night
  https://science.nasa.gov/earth/earth-observatory/earth-awash-in-lights-of-the-night-92912/
- NASA Science — Cities at Night: The View from Space
  https://science.nasa.gov/earth/earth-observatory/cities-at-night-the-view-from-space/

### Identity art direction

Identity is a fictional terrestrial/oceanic world, not Earth.

For this pass:

- keep the surface dark enough that sunlight/terminator shape remains visible;
- use a thin cyan-blue light-aware atmospheric rim;
- add broken high cloud cover on a separate shell;
- rotate clouds independently and slightly faster than the surface;
- preserve large calm oceans and muted land;
- avoid fake city lights until emissive placement can be constrained to land;
- avoid a uniformly glowing atmosphere around the night side;
- avoid white cloud opacity that hides the underlying world.

### Quality behavior

High quality:

- denser surface and layer geometry;
- two-octave procedural cloud field;
- full atmosphere strength.

Low power/mobile:

- reduced sphere segments;
- one-octave cloud field;
- lower cloud opacity;
- same overall composition and semantic meaning.

Reduced motion:

- surface and cloud rotation freeze;
- the atmosphere remains a static light-aware layer.

## Skills — metal-rich / engineered world

### Reference observations

NASA's Psyche material is useful here as a physical reference, not a visual asset:

- NASA Science — Asteroid Psyche:
  https://science.nasa.gov/solar-system/asteroids/16-psyche/
- NASA Science — Psyche Mission Overview:
  https://science.nasa.gov/mission/psyche/mission-overview/

NASA describes Psyche as likely a mixture of rock and metal rather than a polished solid-metal body, with estimates placing metal at roughly 30–60% of its volume and observations suggesting meaningful variation in surface metal content/color. Its exact close-up appearance remains unknown until the spacecraft arrives.

### Skills art direction

Skills is fictional and deliberately more engineered than Psyche.

For this pass:

- replace the current radial/wavy procedural pattern;
- use a dark silicate/graphite base with irregular iron/steel regions;
- keep metallic response localized instead of turning the whole world into chrome;
- add restrained warm oxidation/mineral variation so the surface does not become monochrome;
- use fine material roughness and bump variation rather than large geometric spikes;
- keep the existing satellite toolkit as the clearly artificial layer;
- do not paint technology names, logos or circuit-board graphics onto the planet;
- do not add an atmosphere just to create a glow.

High quality uses denser generated material maps; low power uses the same composition at half resolution. The procedural vertex-colored body remains the complete non-browser/failure fallback.

## Projects / Journey

Reference passes will be added immediately before each world's G2R.4 art pass. Do not infer their final visual language from the Identity or Skills references.
