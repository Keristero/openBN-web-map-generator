## Running prototype code
git submodule update --init --recursive
npm insatll
node test-new-map-generator.js



## Todo
- ✅ Further refine scraping
- Script basic NPCS
    - ✅ add assets
    - ✅ script NPC generation from objects in tiled

- ✅ Generate the same music for a given hostname every time

- polish warps, add opening of warps and error handling
    - warps are opened instead of automatically warping you when loaded
    - if an error occurs during generation, the warp is blocked
    - back warps take you back to the last warp you used
    - warp player to center of warp and use landing animation

- Use page background color in background generation
- Use colors from favicon for tiles
- Add prefab stitching for generating large rooms
    - prefabs can have more prefabs stitched to them to accomidate more features
    - prefabs can be rotated
    - prefabs can be mirrored
- Generate image screen mugshots
- Add stair tile generation