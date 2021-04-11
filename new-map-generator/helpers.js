class RNG {
    constructor(startingSeed) {
        this.seed = startingSeed
    }
    Float() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    Integer(min, max) {
        var range = max - min + 1;
        return Math.floor(range * this.Float()) + min;
    }
    UnevenInteger(min, max) {
        var range = max - min + 1;
        return (Math.floor((Math.floor(range * this.Float()) + min) / 2) * 2) + 1;
    }
    RandomPositionOnCircumference(radius) {
        var angle = this.Float() * Math.PI * 2;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        }
    }
}

function distance(a, b) {
    return Math.abs(a - b);
}

function unstackLayersIntoArray(grid) {
    let array = []
    const iterator = iterateOverGrid(grid);
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
    let grid = [];
    for (var y = 0; y < length; y++) {
        grid.push([])
        for (var x = 0; x < width; x++) {
            grid[y].push(defaultValue)
        }
    }
    return grid;
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
    let matrix = [];
    for (var z = 0; z < height; z++) {
        matrix.push([])
        for (var y = 0; y < length; y++) {
            matrix[z].push([])
            for (var x = 0; x < width; x++) {
                matrix[z][y].push(defaultValue)
            }
        }
    }
    return matrix;
}

function* iterateOverGrid(grid, startX = 0, startY = 0, lastX, lastY) {
    let index = 0
    let endY = lastY || grid.length
    for (let y = startY; y < endY; y++) {
        let endX = lastX || grid[y].length
        for (let x = startX; x < endX; x++) {
            let tileID = grid[y][x]
            yield ({ tileID, x, y, index })
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
                yield ({ tileID, x, y, z, index })
                index++
            }
        }
    }
}

module.exports = {
    generateGrid,
    distance,
    RNG,
    iterateOverGrid,
    generate3dMatrix,
    iterateOver3dMatrix,
    stackArrayIntoLayers,
    unstackLayersIntoArray
}