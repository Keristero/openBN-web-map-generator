const {createTilePNG,createStairPNG} = require('./drawTile.js')

let tile_options = {
    width: 64,
    length: 48,
    tile_height: 4,
    line_width: 3,
    base_color:'rgb(50,50,50)',
    side_color:'rgb(50,50,50)',
    color:'rgb(200,50,50)',
    stair_type:"Up Left"
}
createStairPNG(tile_options,"./test.png")