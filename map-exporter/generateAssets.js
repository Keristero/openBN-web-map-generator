const {createTilePNG} = require('./drawTile')
const {RNG,RGBAtoString,iterateOver3dMatrix} = require('../helpers.js')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
let { writeFile } = require('fs/promises')

let random = new RNG()

function fastHash(data){
    return crypto.createHash('sha1').update(data).digest('hex');
}

function generateFloorTile(base_color,side_color,color,path_generated_tiles){
    let tile_options = {width:62,length:30,tile_height:8,line_width:3,base_color,side_color,color}
    let tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash = fastHash(tile_options_string)
    let tile_output_path = path.join(path_generated_tiles,tile_options_hash)
    let write_tsx_path = path.join(path_generated_tiles,tile_options_hash+".tsx")
    let relative_tsx_path = `../assets/generated/${tile_options_hash}.tsx`
    if(!fs.existsSync(write_tsx_path)){
        //Only create tile if a matching one does not already exist
        createTilePNG(tile_options, tile_output_path+'.png')
        generateTSX(write_tsx_path,tile_options_hash)
    }
    return relative_tsx_path
}

async function generateTSX(tsx_path,tileHash){
    let doc = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.5.0" name="${tileHash}" tilewidth="65" tileheight="41" tilecount="1" columns="1" objectalignment="bottom">
    <tileoffset x="0" y="8"/>
    <image source="./${tileHash}.png" width="65" height="41"/>
</tileset>
`
    await writeFile(tsx_path,doc)
}

async function generateNetAreaAssets(netAreaGenerator,path_generated_tiles){
    //Generate random base and side colors
    let base_color = RGBAtoString(random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1},10,0.1))
    let side_color = RGBAtoString(random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1},10,0.1))

    //generate generic tiles
    let newTileID = 2
    let tiles = {}
    for(let i = 0; i < 5; i++){
        let color = RGBAtoString(random.RGBARounded({r:50,g:50,b:50,a:0.2},{r:250,g:250,b:250,a:1},10,0.1))
        tiles[newTileID] = generateFloorTile(base_color,side_color,color,path_generated_tiles)
        newTileID++
    }

    //Add 100 to tile id so we dont overwrite any of the generic tiles
    newTileID = 100

    //generate room tiles, and replace existing tiles for each room with thier unique ones
    for(let room of netAreaGenerator.arr_rooms){
        if(!room.color){
            continue
        }
        //Generate tile
        tiles[newTileID] = generateFloorTile(base_color,side_color,room.color,path_generated_tiles)
        //Replace tiles on map, leave room itself unmodified
        let roomMatrixIterator = iterateOver3dMatrix(room.prefab.matrix)
        let tilesToReplace = [netAreaGenerator.id_floor_1,netAreaGenerator.id_floor_2,netAreaGenerator.id_floor_3]
        for(let {x,y,z,tileID} of roomMatrixIterator){
            if(tilesToReplace.includes(tileID)){
                const globalX = room.x + x
                const globalY = room.y + y
                const globalZ = room.z + z
                netAreaGenerator.matrix[globalZ][globalY][globalX] = newTileID;
            }
        }
        newTileID++
    }

    //Overwrite net area tiles with generated ones
    for(let tid in tiles){
        let tileInfo = tiles[tid]
        netAreaGenerator.tile_types[tid] = {tileCount:1,sourcePath:tileInfo}
    }

    console.log('generated tiles',tiles)

}

module.exports = {generateNetAreaAssets}