## Running prototype code
git submodule update --init --recursive
npm insatll
node test-new-map-generator.js



## Todo list

1. ✅ Load prefabs, they should have this data
- ✅ matrix
- ✅ feature list
    - ✅ connections
    - ✅ ground features
    - ✅ wall features

1. ✅ Update net area generator to support new prefabs

1. ✅ Add basic TMX export!

1. ✅ Add stair generation logic 

1. ✅ Make a few more prefabs

1. Generate basic tiles for each map, and generate new colors where required

1. Automatically extend height of map when required

1. Refine scraping so that it only returns exactly the elements we want...


## Background Generator
- ✅ Remove scrolling from animation, this is handled clientside.
- ✅ Add some randomized variations with flipping/rotating tiles etc.

## New Map Generator
- ✅ Add third dimension
- ✅ Stair placement
- ✅ Links
- ✅ Images
- ✅ Text
- Generate thumbnails for interacting with images
- Generate new colored tiles when required

## Server
- Create a homepage which links to a list of websites
- Host a server which can respond to requests from the LUA scripts
- Generate a new TMX whenever a user goes through a link, unless it is already cached

## Prefab Processor
- Generate flip variations
- Generate rotate variations
- ✅ Count each feature type and list locations of features (not really needed aye)

## Tile texture generator
- make it a module
- Add generaton of stairs
- Add generation of warps (or use static warps)
- Add generation of screens (or use static warps)
- Add generation of mugshots for screens

## TMX Exporter
- ✅ Export map data
- ✅ Initially, just use static tilesets and textures
- ✅ Export Warps
- ✅ Export Prog Text
- ✅ Export Pictures
- ✅ Export with generated background path
- Use generated tilesets and textures