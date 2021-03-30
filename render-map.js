const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const path = require('path')


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
                color: "green"//is overridden by room color
            },
            {
                name: "wallTile",
                draw: false,
                color: "red"
            },
            {
                name: "pathTile",
                draw: true,
                color: "yellow"
            },
            {
                name: "importantPathTile",
                draw: true,
                color: "orange"
            }
        ]
    }

    let canvas = createCanvas(netAreaGenerator.width * tileSize, netAreaGenerator.height * tileSize)
    let ctx = canvas.getContext('2d')

    console.log(`drawing ${netAreaGenerator.width}x${netAreaGenerator.height} map`)

    //Draw paths
    for (let path of netAreaGenerator.arr_paths) {
        let tInfo = tileInfo[path.tileID]
        for (let loc of path.locations) {
            ctx.fillStyle = tInfo.color
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

function renderLink(ctx,link){
    console.log(link)
}

function renderRoom(ctx, room,tileInfo){
    let grid = room.prefab.grid
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[0].length; x++) {
            let tileID = grid[y][x]
            let tInfo = tileInfo[tileID]
            let worldX = room.x + x
            let worldY = room.y + y
            if (tInfo.draw) {
                ctx.fillStyle = tInfo.color
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