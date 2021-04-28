const {createTilePNG} = require('./drawTile')
const {RNG,RGBAtoString,iterateOver3dMatrix} = require('../helpers.js')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

let random = new RNG()

function fastHash(data){
    return crypto.createHash('sha1').update(data).digest('hex');
}

function generateFoorTile(baseColor,sideColor,color,path_generated_tiles){
    let tile_options = {width:64,length:32,tile_height:8,line_width:3,baseColor,sideColor,color}
    let tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash = fastHash(tile_options_string)
    let tile_output_path = path.join(path_generated_tiles,tile_options_hash+'.png')
    if(!fs.existsSync(tile_output_path)){
        //Only create tile if a matching one does not already exist
        createTilePNG(tile_options, tile_output_path)
    }
    return tile_output_path
}

async function generateNetAreaAssets(netAreaGenerator,path_generated_tiles){
    //Generate random base and side colors
    let base_color = RGBAtoString(random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1}),10,0.1)
    let side_color = RGBAtoString(random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1}),10,0.1)

    //generate generic tiles
    let newTileID = 2
    let tiles = {}
    for(let i = 0; i < 3; i++){
        let random_color = random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1},10,0.1)
        let random_color_string = RGBAtoString(random_color)
        tiles[newTileID] = generateFoorTile(base_color,side_color,random_color_string,path_generated_tiles)
        newTileID++
    }

    //generate room tiles, and replace existing tiles for each room with thier unique ones
    for(let room of netAreaGenerator.arr_rooms){
        if(!room.color){
            continue
        }
        //Generate tile
        tiles[newTileID] = generateFoorTile(base_color,side_color,room.color,path_generated_tiles)
        //Replace tiles on map, leave room itself unmodified
        let roomMatrixIterator = iterateOver3dMatrix(room.prefab.matrix)
        let tilesToReplace = [netAreaGenerator.id_floor_1,netAreaGenerator.id_floor_2,netAreaGenerator.id_floor_3]
        for(let {x,y,z,tileID} of roomMatrixIterator){
            if(tilesToReplace.includes(tileID)){
                const globalX = room.x + x
                const globalY = room.y + y
                const globalZ = room.z + z
                netAreaGenerator.matrix[globalZ][globalY][globalX] = tileID;
            }
        }
        newTileID++
    }
    console.log('generated tiles',tiles)

}

module.exports = {generateNetAreaAssets}