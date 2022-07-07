const { createTilePNG,createStairPNG} = require('./draw_tile')
const {create_warp_base_png,generate_warp_tile_base_tsx} = require('./generate_warp_tile')
const { RNG, RGBAtoString, iterateOver3dMatrix,fastHash} = require('../helpers.js')
const path = require('path')
const fs = require('fs')
let { writeFile } = require('fs/promises')

let random = new RNG()
let room_tile_depth = 16
let path_tile_depth = 8

function generate_warp_tile(base_color, side_color, color, hostname,depth) {
    let tile_options = {
        width: 64,
        length: 32,
        tile_height: depth,
        line_width: 0,
        base_color,
        side_color,
        color,
        extra_v_offset:-4
    }
    let name = 'link'
    let tile_output_path = path.join('.','onb-server','assets','domain',hostname, name+ '.png')
    let write_tsx_path = path.join('.','onb-server','assets','domain',hostname, name + '.tsx')
    let relative_tsx_path = `../assets/domain/${hostname}/link.tsx`
    tile_options.is_warp = true
    //if (!fs.existsSync(write_tsx_path)) {
        //Only create tile if a matching one does not already exist
        create_warp_base_png(tile_options, tile_output_path)
        generateTSX(write_tsx_path, name, tile_options,"top")
    //}
    return relative_tsx_path
}

function generateFloorTile(base_color, side_color, color, path_generated_tiles,depth) {
    let tile_options = {
        width: 64,
        length: 32,
        tile_height: depth,
        line_width: 0,
        base_color,
        side_color,
        color,
        extra_v_offset:0
    }
    let tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash = fastHash(tile_options_string)
    let tile_output_path = path.join(path_generated_tiles, tile_options_hash)
    let write_tsx_path = path.join(path_generated_tiles, tile_options_hash + '.tsx')
    let relative_tsx_path = `../assets/generated/${tile_options_hash}.tsx`
    if (!fs.existsSync(write_tsx_path)) {
        //Only create tile if a matching one does not already exist
        createTilePNG(tile_options, tile_output_path + '.png')
        generateTSX(write_tsx_path, tile_options_hash, tile_options)
    }
    return relative_tsx_path
}

function generateDownStairTile(base_color, side_color, color, path_generated_tiles,stair_type,depth) {
    let tile_options = {
        width: 64,
        length: 32,
        tile_height: depth,
        line_width: 1,
        base_color,
        side_color,
        color,
        stair_type:stair_type,
        extra_v_offset:0
    }
    let tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash = fastHash(tile_options_string)
    let tile_output_path = path.join(path_generated_tiles, tile_options_hash)
    let write_tsx_path = path.join(path_generated_tiles, tile_options_hash + '.tsx')
    let relative_tsx_path_1 = `../assets/generated/${tile_options_hash}.tsx`
    if (!fs.existsSync(write_tsx_path)) {
        //Only create tile if a matching one does not already exist
        createStairPNG(tile_options, tile_output_path + '.png')
        generateTSX(write_tsx_path, tile_options_hash, tile_options)
    }
    return relative_tsx_path_1
}

function generateStairTile(base_color, side_color, color, path_generated_tiles,stair_type,depth) {
    let tile_options = {
        width: 64,
        length: 48,
        tile_height: depth,
        line_width: 1,
        base_color,
        side_color,
        color,
        stair_type:stair_type,
        extra_v_offset:0
    }
    let tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash = fastHash(tile_options_string)
    let tile_output_path = path.join(path_generated_tiles, tile_options_hash)
    let write_tsx_path = path.join(path_generated_tiles, tile_options_hash + '.tsx')
    let relative_tsx_path_1 = `../assets/generated/${tile_options_hash}.tsx`
    if (!fs.existsSync(write_tsx_path)) {
        //Only create tile if a matching one does not already exist
        createStairPNG(tile_options, tile_output_path + '.png')
        generateTSX(write_tsx_path, tile_options_hash, tile_options)
    }
    tile_options.extra_v_offset += 16
    tile_options_string = JSON.stringify(tile_options)
    let tile_options_hash_new = fastHash(tile_options_string)
    write_tsx_path = path.join(path_generated_tiles, tile_options_hash_new + '.tsx')
    let relative_tsx_path_2 = `../assets/generated/${tile_options_hash_new}.tsx`
    generateTSX(write_tsx_path, tile_options_hash, tile_options)
    return [relative_tsx_path_1,relative_tsx_path_2]
}

async function generateTSX(tsx_path, tile_name, tile_options,align="bottom") {
    let doc = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.5.0" name="${tile_name}" tilewidth="${tile_options.width}" tileheight="${tile_options.length+tile_options.tile_height}" tilecount="1" columns="1" objectalignment="${align}">\n`
    if(tile_options.stair_type){
        doc += `<tile id="0" type="Stairs">
            <properties>
                <property name="Direction" value="${tile_options.stair_type}"/>
            </properties>
        </tile>`
    }
    if(tile_options.is_warp){
        doc+=`<tile id="0">
        <objectgroup draworder="index" id="2">
         <object id="1" x="32" y="8.5">
          <polygon points="0,0 -16,8.5 0,17 16,8.5"/>
         </object>
        </objectgroup>
       </tile>`
    }
    doc +=`<tileoffset x="0" y="${tile_options.tile_height+tile_options.extra_v_offset}"/>
    <image source="./${tile_name}.png" width="64" height="48"/>
</tileset>
`
    await writeFile(tsx_path, doc)
}

async function generateNetAreaAssets(netAreaGenerator, path_generated_tiles,hostname,color_scheme) {
    //Generate random base and side colors
    let base_color = color_scheme[0].color
    let side_color = color_scheme[1].color
    let path_depth = random.Integer(1,2)*8
    let room_tile_depth = random.Integer(1,4)*8

    //generate generic tiles
    let newTileID = 2
    let tiles = {}
    for (let i = 2; i < 4; i++) {
        let color = color_scheme[i].color
        tiles[newTileID] = generateFloorTile(base_color, side_color, color, path_generated_tiles,room_tile_depth)
        newTileID++
    }
    //generate generic path
    for (let i = 4; i < 8; i++) {
        let color = color_scheme[i].color
        tiles[newTileID] = generateFloorTile(base_color, side_color, color, path_generated_tiles,path_depth)
        newTileID++
    }

    //generate generic stairs
    newTileID = 7
    let color = color_scheme[8].color
    //up direction stairs
    let stair_tsx_paths = generateStairTile(base_color, side_color, color, path_generated_tiles,"Up Left",path_depth)
    tiles[newTileID] = stair_tsx_paths[0]
    newTileID++
    tiles[newTileID] = stair_tsx_paths[1]
    newTileID++
    //down direction stairs
    tiles[newTileID] = generateDownStairTile(base_color, side_color, color, path_generated_tiles,"Down Left",path_depth)
    newTileID++

    //generate warp tile base
    await generate_warp_tile(base_color,side_color,color,hostname,2)

    //Add 100 to tile id so we dont overwrite any of the generic tiles
    newTileID = 100

    //generate room tiles, and replace existing tiles for each room with thier unique ones
    for (let room of netAreaGenerator.arr_rooms) {
        if (!room.color) {
            continue
        }
        //Generate tile
        let random_depth = random.Integer(1,8)*8
        tiles[newTileID] = generateFloorTile(base_color, side_color, room.color, path_generated_tiles,random_depth)
        //Replace tiles on map, leave room itself unmodified
        let roomMatrixIterator = iterateOver3dMatrix(room.prefab.matrix)
        let tilesToReplace = [netAreaGenerator.id_floor_1, netAreaGenerator.id_floor_2, netAreaGenerator.id_floor_3]
        for (let { x, y, z, tileID } of roomMatrixIterator) {
            if (tilesToReplace.includes(tileID)) {
                const globalX = room.x + x
                const globalY = room.y + y
                const globalZ = room.z + z
                netAreaGenerator.matrix[globalZ][globalY][globalX] = newTileID
            }
        }
        newTileID++
    }

    //Overwrite net area tiles with generated ones
    for (let tid in tiles) {
        let tileInfo = tiles[tid]
        netAreaGenerator.tile_types[tid] = {
            tileCount: 1,
            sourcePath: tileInfo,
        }
    }

    //console.log('generated tiles', tiles)
}

module.exports = { generateNetAreaAssets }
