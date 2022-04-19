const {createTilePNG,createStairPNG} = require('./drawTile.js')

let tile_options = {
    width: 64,
    length: 32,
    tile_height: 8,
    line_width: 1,
    base_color:'rgb(50,50,255)',
    side_color:'rgb(50,255,50)',
    color:'rgb(200,50,50)',
    stair_type:"Down Left"
}
createStairPNG(tile_options,"./test.png")