# Galaxy Earth imagery and attribution

Earth rendering is an Earth-only realism experiment; other bodies retain their Solar System Scope CC BY 4.0 textures (see [GALAXY_TEXTURE_CREDITS.md](./GALAXY_TEXTURE_CREDITS.md)). The textures in this folder are local, not hotlinked. No NASA logo or endorsement is implied.

| Local path under frontend/public/galaxy/photoreal/earth | Source / transformation | Credit |
| --- | --- | --- |
| day-4k.jpg, day-2k.jpg | `MaxwellLee/physics-lab/assets/textures/earth_{4096,2048}.jpg`, downsampled from NASA Blue Marble Next Generation July cloud-free base image: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x5400x2700.jpg | NASA Earth Observatory; Reto Stöckli, NASA/GSFC |
| night-2k.jpg | `Depal-Jakub/orbital-bloom/public/assets/earth-night-2048.jpg`, grayscale resized from NASA Black Marble 2016: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144897/BlackMarble_2016_01deg_gray.jpg | NASA Earth Observatory; Joshua Stevens, VIIRS (Miguel Román, NASA GSFC) |
| clouds-2k.jpg | `Depal-Jakub/orbital-bloom/public/assets/earth-clouds-2048.jpg`, NASA Blue Marble clouds composite: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg | NASA Earth Observatory; Reto Stöckli and Robert Simmon |
| water-mask.png, topology.png | `vasturiano/three-globe/example/img/{earth-water,earth-topology}.png`, derived from NASA/Natural Earth topography / coast data as documented by the renderer examples. White on the water mask means ocean; black means land. | NASA-derived Earth data / three-globe example asset distribution (MIT code; NASA underlying media) |

The 2048 x 1024 day/night/cloud Atlases use compatible global equirectangular layouts. `earth-water.png` is a 1600×800 ocean mask and the misleadingly named `earth-topology.png` is an actual grayscale terrain-height/depth atlas (2048×1024), not a vector-border drawing. The height gradient is sampled with 2048×1024 texel offsets and limited to non-ocean terrain; they are not colour photography; these are sampled only in the desktop shader to keep mobile overhead bounded. The NASA cloud composite is a historical static cloud atlas, not a live forecast.

NASA media guidance: https://www.nasa.gov/nasa-brand-center/images-and-media/. Always inspect imagery attribution before repurposing another asset. Assets must remain locally vendored. The old single Solar System Scope `earth.jpg` is retained for the earlier PR's baseline and rollback rather than deleted while this branch is under review.

## Operational bounds

- Desktop: 4K day / 2K night+cloud / water and elevation masks; mobile: 2K day / night+cloud only.
- Loading is atomic for surface day/night and optional mask set; cloud can install separately. Failed requests retain their complete procedural fallback. Installed textures are scene-owned and disposed by normal scene cleanup.
- The optical polish pass deliberately softens an unnaturally bright ocean glint and reduces night/day cloud-shell opacity so the photographic ground detail stays legible. The phone-only Identity frame fraction increases from 0.46 to 0.54 without changing the Galaxy UI or desktop camera.
- Earth is still a simplified real-time lighting approximation, not a physical volumetric radiative transfer or accurate real-time weather simulation.
