const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const path = require('path')
const {iterateOver3dMatrix} = require('./new-map-generator/helpers.js')


const tileSize = 2 //pixels


function renderMap(netAreaGenerator, file_path,tileInfo) {
    if (!tileInfo) {
        let stairTile = {
            name: "stairs",
            draw: true,
            rgba:{r:0,g:128,b:0,a:1}
        }
        tileInfo = {
            0:{
                name: "air",
                draw: false
            },
            1:{
                name: "Wall",
                draw: true,
                rgba:{r:50,g:50,b:50,a:1}
            },
            2:{
                name: "Ground Tile 1",
                draw: true,
                rgba:{r:128,g:128,b:128,a:1}
            },
            3:{
                name: "Ground Tile 2",
                draw: true,
                rgba:{r:128,g:200,b:128,a:1}
            },
            4:{
                name: "Ground Tile 3",
                draw: true,
                rgba:{r:128,g:128,b:200,a:1}
            },
            5:{
                name: "Path",
                draw: true,
                rgba:{r:200,g:200,b:0,a:1}
            },
            6:{
                name: "Important Path",
                draw: true,
                rgba:{r:250,g:250,b:0,a:1}
            },
            7:stairTile,
            8:stairTile,
            9:stairTile,
            10:stairTile,
            11:stairTile,
            12:stairTile,
            13:stairTile,
            14:stairTile,
            15:stairTile,
            16:stairTile,
        }
    }

    let canvas = createCanvas(netAreaGenerator.width * tileSize, netAreaGenerator.length * tileSize)
    let ctx = canvas.getContext('2d')

    console.log(`drawing ${netAreaGenerator.width}x${netAreaGenerator.length}x${netAreaGenerator.height} map`)

    //Draw paths
    for (let map_path of netAreaGenerator.arr_paths) {
        let tInfo = tileInfo[map_path.tileID]
        for (let loc of map_path.locations) {
            ctx.fillStyle = rgbaToColor(tInfo.rgba)
            ctx.fillRect(loc.x * tileSize, loc.y * tileSize, tileSize, tileSize)
        }
    }
    //Draw rooms
    for (let room of netAreaGenerator.arr_rooms) {
        renderRoom(ctx, room,tileInfo)
    }
    //Draw links
    for (let featureKey in netAreaGenerator.features){
        let feature = netAreaGenerator.features[featureKey]
    }

    saveImageOfCanvas(canvas, path.join(".", file_path))
}

function rgbaToColor(rgba){
    return `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`
}

function renderRoom(ctx, room,tileInfo){
    let matrix = room.prefab.matrix

    const iterator = iterateOver3dMatrix(matrix);
    for (const gridPos of iterator) {
        if(gridPos.tileID !== 0){
            let tInfo = tileInfo[gridPos.tileID]
            let worldX = room.x + gridPos.x
            let worldY = room.y + gridPos.y
            let worldZ = room.z + gridPos.z
            if (tInfo.draw) {
                let rgba = tInfo.rgba
                rgba.a = 1
                ctx.fillStyle = rgbaToColor(rgba)
                if (room.color != false) {
                    ctx.fillStyle = room.color
                }
                ctx.fillRect(worldX * tileSize, worldY * tileSize, tileSize, tileSize)
            }
        }
    }
}

function saveImageOfCanvas(canvas, path) {
    canvas.createPNGStream().pipe(fs.createWriteStream(path))
}

module.exports = { renderMap }