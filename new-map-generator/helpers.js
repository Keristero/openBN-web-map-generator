class RNG{
    constructor(startingSeed){
        this.seed = startingSeed
    }
    Float() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    Integer(min,max){
        var range = max - min + 1;
        return Math.floor(range * this.Float()) + min;
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

function generateGrid(width, height) {
    let grid = [];
    for (var y = 0; y < height; y++) {
        grid.push([])
        for (var x = 0; x < width; x++) {
            grid[y].push(0)
        }
    }
    return grid;
}

module.exports = {generateGrid,distance,RNG}