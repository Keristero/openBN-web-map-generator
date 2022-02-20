const { createCanvas, loadImage } = require('canvas')
const axios = require('axios').default
const fs = require('fs')
const crypto = require('crypto')

class RNG {
    constructor(startingSeed) {
        this.seed = startingSeed || Math.random()
    }
    Bool() {
        return Math.random() < 0.501
    }
    Float() {
        var x = Math.sin(this.seed++) * 10000
        return x - Math.floor(x)
    }
    Integer(min, max) {
        var range = max - min + 1
        return Math.floor(range * this.Float()) + min
    }
    UnevenInteger(min, max) {
        var range = max - min + 1
        return Math.floor((Math.floor(range * this.Float()) + min) / 2) * 2 + 1
    }
    RandomPositionOnCircumference(radius) {
        var angle = this.Float() * Math.PI * 2
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
        }
    }
    RGBA(mincolor, maxcolor) {
        let r = this.Integer(mincolor.r, maxcolor.r)
        let g = this.Integer(mincolor.g, maxcolor.g)
        let b = this.Integer(mincolor.b, maxcolor.b)
        let a = this.Integer(mincolor.a, maxcolor.a)
        return { r, g, b, a }
    }
    RGBARounded(mincolor, maxcolor, rounding, alphaRounding) {
        //Note, the output can fall outside the min and max due to nearest rounding
        let r = roundToNearest(this.Integer(mincolor.r, maxcolor.r), rounding)
        let g = roundToNearest(this.Integer(mincolor.g, maxcolor.g), rounding)
        let b = roundToNearest(this.Integer(mincolor.b, maxcolor.b), rounding)
        let a = roundToNearest(this.Float(mincolor.a, maxcolor.a), alphaRounding)
        return { r, g, b, a }
    }
}

function asyncSleep(time_ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, time_ms)
    })
}

function roundToNearest(value, nearestX) {
    return Math.round(value / nearestX) * nearestX
}

function RGBAtoString(color) {
    return `rgba(${color.r},${color.b},${color.g},${color.a})`
}

function distance(a, b) {
    return Math.abs(a - b)
}

function unstackLayersIntoArray(grid) {
    let array = []
    const iterator = iterateOverGrid(grid)
    for (const gridPos of iterator) {
        array.push(gridPos.tileID)
    }
    return array
}

/**
 *
 * @param {[number]} array
 * @param {number} width
 * @param {number} height
 * @returns {[[number]]}
 */
function stackArrayIntoLayers(array, width, height) {
    let grid = generateGrid(width, height)
    let index = 0
    for (let value of array) {
        let x = Math.floor(index % width)
        let y = Math.floor(index / width)
        grid[y][x] = value
        index++
    }
    return grid
}

/**
 *
 * @param {number} width
 * @param {number} length
 * @param {number} defaultValue
 * @returns {[[number]]}
 */
function generateGrid(width, length, defaultValue = 0) {
    let grid = []
    for (var y = 0; y < length; y++) {
        grid.push([])
        for (var x = 0; x < width; x++) {
            grid[y].push(defaultValue)
        }
    }
    return grid
}

/**
 *
 * @param {number} width
 * @param {number} length
 * @param {number} height
 * @param {[[[number]]]} defaultValue
 * @returns
 */
function generate3dMatrix(width, length, height, defaultValue = 0) {
    let matrix = []
    for (var z = 0; z < height; z++) {
        matrix.push([])
        for (var y = 0; y < length; y++) {
            matrix[z].push([])
            for (var x = 0; x < width; x++) {
                matrix[z][y].push(defaultValue)
            }
        }
    }
    return matrix
}

function* iterateOverGrid(grid, startX = 0, startY = 0, lastX, lastY) {
    let index = 0
    let endY = lastY || grid.length
    for (let y = startY; y < endY; y++) {
        let endX = lastX || grid[y].length
        for (let x = startX; x < endX; x++) {
            let tileID = grid[y][x]
            yield { tileID, x, y, index }
            index++
        }
    }
}

function* iterateOver3dMatrix(matrix, startX = 0, startY = 0, startZ = 0, lastX, lastY, lastZ) {
    let index = 0
    let endZ = lastZ || matrix.length
    for (let z = startZ; z < endZ; z++) {
        let endY = lastY || matrix[z].length
        for (let y = startY; y < endY; y++) {
            let endX = lastX || matrix[z][y].length
            for (let x = startX; x < endX; x++) {
                let tileID = matrix[z][y][x]
                yield { tileID, x, y, z, index }
                index++
            }
        }
    }
}

function replaceBackslashes(string) {
    return string.replace(/\\/gm, '/')
}

function returnObjectFromArrayWithKeyValue(array, key, value) {
    for (let obj of array) {
        if (obj.hasOwnProperty(key)) {
            if (obj[key] === value) {
                return obj
            }
        }
    }
    return null
}

function crop3dMatrix(matrix, x, y, z, width, length, height) {
    return matrix.slice(z, z + height).map((layer) => {
        return layer.slice(y, y + length).map((row) => {
            return row.slice(x, x + width)
        })
    })
}

function findBoundsOfMatrix(matrix, ignoreID = 0) {
    let iterator = iterateOver3dMatrix(matrix)
    let r = {
        min: {
            x: Infinity,
            y: Infinity,
            z: Infinity,
        },
        max: {
            x: -Infinity,
            y: -Infinity,
            z: -Infinity,
        },
    }
    for (let gridPos of iterator) {
        if (gridPos.tileID == ignoreID) {
            //Consider this tile outside the bounds of the matrix
            continue
        }
        if (gridPos.x < r.min.x) {
            r.min.x = gridPos.x
        }
        if (gridPos.x > r.max.x) {
            r.max.x = gridPos.x
        }
        if (gridPos.y < r.min.y) {
            r.min.y = gridPos.y
        }
        if (gridPos.y > r.max.y) {
            r.max.y = gridPos.y
        }
        if (gridPos.z < r.min.z) {
            r.min.z = gridPos.z
        }
        if (gridPos.z > r.max.z) {
            r.max.z = gridPos.z
        }
    }
    return r
}

function trim3dMatrix(matrix, ignoreID = 0) {
    let bounds = findBoundsOfMatrix(matrix, ignoreID)
    let x = bounds.min.x
    let y = bounds.min.y
    let z = bounds.min.z
    let width = 1 + (bounds.max.x - x)
    let length = 1 + (bounds.max.y - y)
    let height = 1 + (bounds.max.z - z)
    let result = {
        x,
        y,
        z,
        width,
        length,
        height,
        matrix: crop3dMatrix(matrix, x, y, z, width, length, height),
    }
    return result
}

async function downloadFile(link_to_file, output_path) {
    let response = await axios.get(link_to_file, { responseType: 'stream' })
    let writer = fs.createWriteStream(output_path)
    response.data.pipe(writer)
    console.log(`downloading ${link_to_file}`)
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

function parse_tiled_tid_info(tid) {
    /* Tiled map editor encodes the flipping of tiles in a number using binary
    https://doc.mapeditor.org/en/stable/reference/tmx-map-format/
    */
    let binary = tid.toString(2).padStart(32, "0")
    let xFlipped = binary[0] === "1"
    let yFlipped = binary[1] === "1"
    let diagonallyFlipped = binary[2] === "1"
    let id = parseInt(binary.substr(3, binary.length), 2)
    let tiledTileInfo = {
        id,
        xFlipped,
        yFlipped,
        diagonallyFlipped
    }
    return tiledTileInfo
}

function replaceAtIndex(str,index,value) {
    if(index > str.length-1) 
    {
        return string
    }
    else{
    return str.substring(0,index) + value + str.substring(index+1)
    }
}

function get_tiled_tid(tid,xFlipped,yFlipped,diagonallyFlipped){
    let binary = tid.toString(2).padStart(32, "0")
    if(xFlipped){
        binary = replaceAtIndex(binary,0,"1")
    }
    if(yFlipped){
        binary = replaceAtIndex(binary,1,"1")
    }
    if(diagonallyFlipped){
        binary = replaceAtIndex(binary,2,"1")
    }
    return parseInt(binary, 2)
}

function fastHash(data) {
    return crypto.createHash('sha1').update(data).digest('hex')
}

module.exports = {
    generateGrid,
    distance,
    RNG,
    iterateOverGrid,
    generate3dMatrix,
    iterateOver3dMatrix,
    stackArrayIntoLayers,
    unstackLayersIntoArray,
    RGBAtoString,
    replaceBackslashes,
    returnObjectFromArrayWithKeyValue,
    trim3dMatrix,
    asyncSleep,
    downloadFile,
    get_tiled_tid,
    fastHash
}