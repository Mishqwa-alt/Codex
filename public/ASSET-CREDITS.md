# Visual assets / ORBITA

## NASA 3D Resources

17 original GLB model files and six planetary texture maps are bundled from
https://github.com/nasa/NASA-3D-Resources (exact revision and per-file SHA-256 hashes
are listed in assets-manifest.json). Both Voyagers use the same Voyager model;
OSIRIS–APEX uses the OSIRIS–REx bus configuration. Other missions without an exact
NASA asset use an explicitly labelled simplified reconstruction.

Credit: NASA and the contributing authors of NASA 3D Resources, including
NASA/JPL-Caltech, NASA Ames and NASA Goddard. The repository README describes
these resources as free and without copyright; usage guidelines still apply:
https://www.nasa.gov/nasa-brand-center/images-and-media/

No NASA endorsement is implied. Models are visualization assets, not engineering
models or real-time attitude telemetry. Original geometry, materials and textures
are retained; runtime centering and scale are changed for inspection.

Earth, Mars, Venus, Jupiter, Saturn and Neptune maps are NASA visualization maps,
not live imagery. Earth uses NASA Blue Marble with baked cloud imagery (Reto Stöckli), retrieved from Wikimedia Commons File:Land_ocean_ice_cloud_hires.jpg; resized to 2048×1024. This is a historical composite, not live weather;
Venus is a radar-derived surface visualization, not its visible cloud cover.

Mercury and Uranus maps, solar granulation and microrelief are original procedural
illustrations. Microrelief is not a measured digital elevation model. Geographic
orientation, weather, lighting exposure and relative object sizes are illustrative.

## Draco and Three.js

The offline Draco decoder was copied from the glTF build shipped with Three.js
0.180.0. Draco is Copyright Google, Apache-2.0: see draco/DRACO-LICENSE.txt.
Three.js is MIT: see draco/THREE-LICENSE.txt.

No model, texture, font or decoder needs an external CDN at runtime. Only the
optional ephemeris API needs network access.

Mission badges and spacecraft pictures: see /badge-credits.json and /photo-credits.json for per-file sources, authors and licenses.
