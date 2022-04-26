const { loadImage } = require('canvas')
const {create_warp_base_png,create_warp_active_png} = require('./generate_warp_tile.js')

let test_favicon_path = '../onb-server/assets/domain/twitter.com/favicon.png'

async function main(){
    let tile_options = {
        width: 64,
        length: 32,
        tile_height: 8,
        line_width: 1,
        base_color:'rgba(50,50,50,1)',
        side_color:'rgba(100,100,100,0.9)',
        color:'rgba(200,50,50)',
        stair_type:"Down Left",
    }
    create_warp_base_png(tile_options,"./test.png")
}

async function draw_warp_active(){
    let favicon = await loadImage(test_favicon_path)
    let tile_options = {
        width: 64,
        length: 32,
        glow_color:'rgba(255,255,255,1)',
        favicon:favicon
    }
    create_warp_active_png(tile_options,"./test.png")
}

draw_warp_active()