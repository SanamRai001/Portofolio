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

## Projects — inhabited rocky world

### Reference observations

The existing Identity references to NASA Earth-at-night imagery are reused here only for the behavior of artificial light viewed from orbit: illumination is localized, strongest on the night side, and should not wash out the planetary terminator.

Projects is not Earth and the existing authored rocky albedo remains the primary material.

### Projects art direction

For this pass:

- preserve the current authored rocky/copper surface and its seam/bump treatment;
- add sparse warm settlement light only on the Sun-opposed hemisphere;
- keep the emissive layer locked to the same axial rotation as the terrain so lights never slide over the surface;
- use clustered procedural density rather than a uniform grid or circuit pattern;
- keep the day side effectively dark for the emissive layer;
- avoid a new atmosphere/cloud layer; Projects should stay dry and rocky;
- make low-power use fewer shader octaves and lower emissive strength while preserving the same idea.

The lights communicate an inhabited/project-building world, not literal real cities or project locations.

## Journey — ringed gas giant

### Reference observations

NASA Saturn imagery and documentation are used only as atmospheric behavior/material references:

- NASA Science — Saturn from Far and Near:
  https://science.nasa.gov/photojournal/saturn-from-far-and-near/
- NASA Science — Saturn Facts:
  https://science.nasa.gov/saturn/facts/
- NASA/Hubble — Saturn 2020:
  https://science.nasa.gov/asset/hubble/saturn-2020/

Useful reference behavior:

- cloud/haze layers form restrained bands broadly parallel to the equator;
- visible colors can stay muted across yellow, brown, gray and slight warm haze;
- small storms/variation should break perfect stripes;
- the body has no literal solid rocky surface at the visible cloud tops.

### Journey art direction

Journey becomes a fictional old ringed gas giant.

For the G2R.4D body pass:

- replace the current generic weathered vertex stripes with authored/generated atmospheric band detail;
- use broad muted bands with multi-scale turbulence so it does not read as a striped ball;
- add occasional low-contrast storm structures;
- keep material non-metallic and visually soft at cloud-top scale;
- add only a restrained Sun-aware haze/limb layer;
- preserve the existing slow retrograde axial motion;
- do not redesign the rings in this pass.

The current flat rings are an explicit temporary layer and remain scheduled for G2R.6, where close/far structure and the high/low quality paths will be handled separately.
