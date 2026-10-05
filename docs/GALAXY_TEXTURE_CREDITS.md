# Galaxy planetary texture attribution

The current Galaxy uses **two image-source groups**:

1. **Earth / Identity** uses the locally vendored NASA-derived image set under `frontend/public/galaxy/photoreal/earth/`. Full per-file source, transformation and credit details are maintained in [GALAXY_EARTH_IMAGERY.md](./GALAXY_EARTH_IMAGERY.md).
2. **Mercury, Mars, Saturn, Sun and Moon** use locally vendored Solar System Scope / INOVE textures from [Solar Textures](https://edu.solarsystemscope.com/textures/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), imported through attributed public mirrors listed below.

The route is an artistic portfolio mapping. Apparent size, cinematic rotation/orbit rates, Moon placement, lighting and shader treatments are not claims of astronomical scale or physical simulation. No source organization endorses this project.

## Current Earth imagery

| Local asset | Current use | Credit |
| --- | --- | --- |
| `earth/day-4k.jpg`, `earth/day-2k.jpg` | Identity daylight albedo | NASA Earth Observatory / Blue Marble Next Generation; Reto Stöckli, NASA/GSFC |
| `earth/night-2k.jpg` | Night-side city-light emission | NASA Earth Observatory / Black Marble 2016; Joshua Stevens, VIIRS / NASA GSFC |
| `earth/clouds-2k.jpg` | Static cloud atlas | NASA Earth Observatory; Reto Stöckli and Robert Simmon |
| `earth/water-mask.png`, `earth/topology.png` | Desktop ocean mask and terrain-height response | NASA-derived Earth data distributed via the three-globe example assets; details in `GALAXY_EARTH_IMAGERY.md` |

The old root-level `earth.jpg` is retained as an earlier baseline/rollback asset; the current Identity renderer does **not** use it as its visible day surface.

## Solar System Scope / INOVE assets

| Local image | Imported from attributed public mirror | Current use |
| --- | --- | --- |
| `earth.jpg` | [COSMOS](https://github.com/sudoaanish/COSMOS/tree/master/assets/textures), `earth-2k.jpg` | Legacy baseline / rollback only |
| `mercury.jpg` | COSMOS, `mercury-2k.jpg` | Skills / Mercury photographic albedo |
| `mars.jpg` | COSMOS, `mars-2k.jpg` | Projects / Mars photographic albedo |
| `saturn.jpg` | COSMOS, `saturn-2k.jpg` | Journey / Saturn cloud-top colour |
| `sun.jpg` | [homer-jay/solar-system-textures](https://github.com/homer-jay/solar-system-textures), `sun.jpg` | Faint luminance variation inside the custom Core photosphere shader |
| `moon.jpg` | homer-jay/solar-system-textures, `moon.jpg` | Non-interactive desktop companion of Identity |

The browser serves local files rather than third-party image URLs. Our Three.js shaders alter lighting, terminators, atmosphere/corona response, rings, seams and portfolio-world presentation; they do not convert these images into calibrated scientific datasets. In particular, Mars/Mercury colour maps are not presented as measured topography, and the Saturn ring system is shader-generated rather than copied observational imagery.

The visible Galaxy footer credits **NASA Earth Observatory** for Earth and **Solar System Scope** for the other worlds. Preserve those visible credits and the source documentation when reusing or republishing the assets.
