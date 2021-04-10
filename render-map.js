const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const path = require('path')
const {iterateOver3dMatrix} = require('./new-map-generator/helpers.js')


const tileSize = 2 //pixels


async function renderMap(netAreaGenerator, tileInfo) {
    if (!tileInfo) {
        tileInfo = [
            {
                name: "air",
                draw: false
            },
            {
                name: "roomTile",
                draw: true,
                rgba:{r:0,g:255,b:0,a:1}
            },
            {
                name: "wallTile",
                draw: false,
                rgba:{r:255,g:255,b:0,a:1}
            },
            {
                name: "pathTile",
                draw: true,
                rgba:{r:0,g:255,b:255,a:1}
            },
            {
                name: "importantPathTile",
                draw: true,
                rgba:{r:255,g:255,b:255,a:1}
            }
        ]
    }

    let canvas = createCanvas(netAreaGenerator.width * tileSize, netAreaGenerator.length * tileSize)
    let ctx = canvas.getContext('2d')

    console.log(`drawing ${netAreaGenerator.width}x${netAreaGenerator.length}x${netAreaGenerator.height} map`)

    //Draw paths
    for (let path of netAreaGenerator.arr_paths) {
        let tInfo = tileInfo[path.tileID]
        for (let loc of path.locations) {
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
        console.log(feature)
    }

    saveImageOfCanvas(canvas, path.join(".", "preview.png"))
}

function rgbaToColor(rgba){
    return `rgba(${rgba.r},${rgba.g},${rgba.b},${rgba.a})`
}

function renderLink(ctx,link){
    console.log(link)
}

function renderRoom(ctx, room,tileInfo){
    let grid = room.prefab.grid

    const iterator = iterateOver3dMatrix(grid);
    for (const gridPos of iterator) {
        if(gridPos.tileID !== 0){
            let tInfo = tileInfo[gridPos.tileID]
            let worldX = room.x + gridPos.x
            let worldY = room.y + gridPos.y
            let worldZ = room.z + gridPos.z
            if (tInfo.draw) {
                let rgba = tInfo.rgba
                rgba.a = 0.2
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