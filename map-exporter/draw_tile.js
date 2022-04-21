const { createCanvas, loadImage } = require('canvas')
const fs = require('fs')
const { RNG, RGBAtoString } = require('../helpers.js')

function createTilePNG(tile_options, out_path) {
    let canvas = drawTileOnCanvas(tile_options)
    let out = fs.createWriteStream(out_path)
    let stream = canvas.createPNGStream()
    stream.pipe(out)
}

function createStairPNG(tile_options, out_path) {
    let canvas = drawStairsOnCanvas(tile_options)
    let out = fs.createWriteStream(out_path)
    let stream = canvas.createPNGStream()
    stream.pipe(out)
}

function drawTileOnCanvas({ width, length, tile_height, line_width, base_color, side_color, color }) {
    let canvasWidth = width
    let canvasHeight = length + tile_height
    let canvas = createCanvas(canvasWidth, canvasHeight)
    let ctx = canvas.getContext('2d')
    drawTile(ctx, 0, 0, width, length, tile_height, line_width, base_color, side_color, color)
    return canvas
}

function drawStairsOnCanvas({ width, length, tile_height, line_width, base_color, side_color, color ,stair_type}) {
    /*
    stair types:
    1 = Up Left
    2 = Up Right
    3 = Down Left
    4 = Down Right
    */
    let canvasWidth = width
    let canvasHeight = length+tile_height
    let canvas = createCanvas(canvasWidth, canvasHeight)
    let ctx = canvas.getContext('2d')
    if(stair_type == "Up Left"){
        drawStairs(ctx, 0, 0, width, length, tile_height, line_width, base_color, side_color, color)
    }else{
        drawDownStairs(ctx, 0, 0, width, length, tile_height, line_width, base_color, side_color, color)
    }
    return canvas
}

function drawDownStairs(ctx, px, py, xSize, ySize, depth, lineWidth, base_color, side_color, color) {
    let x = Math.floor(px + xSize / 2 + lineWidth / 2)
    let y = Math.floor(py)
    let drawAndFillPath = function (points,shift_x=0,shift_y=0) {
        ctx.beginPath()
        points.forEach((point, index) => {
            if (index == 0) {
                ctx.moveTo(point.x+shift_x, point.y+shift_y)
            } else {
                ctx.lineTo(point.x+shift_x, point.y+shift_y)
            }
        })
        //Draw a nice thick line along path
        ctx.lineWidth = 1 //except right now it aint thick
        ctx.strokeStyle = 'rgb(0,0,0)'
        ctx.stroke()
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = base_color
        ctx.stroke()
    }
    let hw = Math.floor(xSize / 2)
    let hh = Math.floor(ySize / 2)
    let third_h = Math.floor(ySize / 3)
    let two_third_h = third_h*2
    let ly = y + depth
    let top_back = { x: x, y: y }
    let bottom_back = { x: x, y: ly }
    let top_right = { x: x + hw, y: y + hh }
    let bottom_right = { x: x + hw, y: ly + hh }
    let top_front = { x: x, y: y + hh }
    let bottom_front = { x: x, y: ly + hh }
    let top_left = { x: x - hw, y: y }
    let bottom_left = { x: x - hw, y: ly }

    ctx.fillStyle = base_color
    let bottomPoints = [bottom_back, bottom_right, bottom_front, bottom_left, bottom_back]
    drawAndFillPath(bottomPoints)
    ctx.fillStyle = side_color
    let rightSidePoints = [bottom_back, top_back, top_right, bottom_right, bottom_back]
    drawAndFillPath(rightSidePoints)
    let leftSidePoints = [bottom_back, top_back, top_left, bottom_left, bottom_back]
    drawAndFillPath(leftSidePoints)
    let frontRightPoints = [bottom_front, top_front, top_right, bottom_right, bottom_front]
    drawAndFillPath(frontRightPoints)
    let frontLeftPoints = [bottom_front, top_front, top_left, bottom_left, bottom_front]
    drawAndFillPath(frontLeftPoints)
    ctx.fillStyle = color
    let topPoints = [top_back, top_right, top_front, top_left, top_back]
    drawAndFillPath(topPoints)

    drawReflection(ctx,5,x,y,ySize,xSize,hh,depth)
    draw_shadow(ctx,xSize,ySize,depth)
}

function drawStairs(ctx, px, py, xSize, ySize, depth, lineWidth, base_color, side_color, color) {
    let x = Math.floor(px + xSize / 2 + lineWidth / 2)
    let y = Math.floor(py)
    let drawAndFillPath = function (points,shift_x=0,shift_y=0) {
        ctx.beginPath()
        points.forEach((point, index) => {
            if (index == 0) {
                ctx.moveTo(point.x+shift_x, point.y+shift_y)
            } else {
                ctx.lineTo(point.x+shift_x, point.y+shift_y)
            }
        })
        //Draw a nice thick line along path
        ctx.lineWidth = 1 //except right now it aint thick
        ctx.strokeStyle = 'rgb(0,0,0)'
        ctx.stroke()
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = base_color
        ctx.stroke()
    }
    let hw = Math.floor(xSize / 2)
    let hh = Math.floor(ySize / 2)
    let third_h = Math.floor(ySize / 3)
    let two_third_h = third_h*2
    let ly = y + depth
    let top_back = { x: x, y: y }
    let bottom_back = { x: x, y: ly }
    let top_right = { x: x + hw, y: y + two_third_h }
    let bottom_right = { x: x + hw, y: ly + two_third_h }
    let top_front = { x: x, y: y + ySize }
    let bottom_front = { x: x, y: ly + ySize }
    let top_left = { x: x - hw, y: y + third_h }
    let bottom_left = { x: x - hw, y: ly + third_h }

    ctx.fillStyle = base_color
    let bottomPoints = [bottom_back, bottom_right, bottom_front, bottom_left, bottom_back]
    drawAndFillPath(bottomPoints)
    ctx.fillStyle = side_color
    let rightSidePoints = [bottom_back, top_back, top_right, bottom_right, bottom_back]
    drawAndFillPath(rightSidePoints)
    let leftSidePoints = [bottom_back, top_back, top_left, bottom_left, bottom_back]
    drawAndFillPath(leftSidePoints)
    let frontLeftPoints = [bottom_front, top_front, top_left, bottom_left, bottom_front]
    drawAndFillPath(frontLeftPoints)
    ctx.fillStyle = color
    let topPoints = [top_back, top_right, top_front, top_left, top_back]
    drawAndFillPath(topPoints)
    //Now clear the bottom connection facing side of the stairs
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'white'
    let frontRightPoints = [bottom_front, top_front, top_right, bottom_right, bottom_front]
    drawAndFillPath(frontRightPoints,1,1)

    drawReflection(ctx,5,x,y,ySize,xSize,hh,depth)
    draw_shadow(ctx,xSize,ySize,depth)
}

function drawTile(ctx, px, py, xSize, ySize, depth, lineWidth, base_color, side_color, color) {
    let x = Math.round(px + xSize / 2 + lineWidth / 2)
    let y = Math.floor(py + lineWidth / 2)
    let drawAndFillPath = function (points) {
        ctx.beginPath()
        points.forEach((point, index) => {
            if (index == 0) {
                ctx.moveTo(point.x, point.y)
            } else {
                ctx.lineTo(point.x, point.y)
            }
        })
        //Draw a nice thick line along path
        ctx.lineWidth = 1 //except right now it aint thick
        ctx.strokeStyle = 'rgb(50,50,50)'
        ctx.stroke()
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = base_color
        ctx.stroke()
    }
    let hw = xSize / 2
    let hh = ySize / 2
    let ly = y + depth
    let top_back = { x: x, y: y }
    let bottom_back = { x: x, y: ly }
    let top_right = { x: x + hw, y: y + hh }
    let bottom_right = { x: x + hw, y: ly + hh }
    let top_front = { x: x, y: y + ySize }
    let bottom_front = { x: x, y: ly + ySize }
    let top_left = { x: x - hw, y: y + hh }
    let bottom_left = { x: x - hw, y: ly + hh }

    ctx.fillStyle = base_color
    let bottomPoints = [bottom_back, bottom_right, bottom_front, bottom_left, bottom_back]
    drawAndFillPath(bottomPoints)
    ctx.fillStyle = side_color
    let rightSidePoints = [bottom_back, top_back, top_right, bottom_right, bottom_back]
    drawAndFillPath(rightSidePoints)
    let leftSidePoints = [bottom_back, top_back, top_left, bottom_left, bottom_back]
    drawAndFillPath(leftSidePoints)
    let frontRightPoints = [bottom_front, top_front, top_right, bottom_right, bottom_front]
    drawAndFillPath(frontRightPoints)
    let frontLeftPoints = [bottom_front, top_front, top_left, bottom_left, bottom_front]
    drawAndFillPath(frontLeftPoints)
    ctx.fillStyle = color
    let topPoints = [top_back, top_right, top_front, top_left, top_back]
    drawAndFillPath(topPoints)

    drawReflection(ctx,5,x,y,ySize,xSize,hh,depth)
    draw_shadow(ctx,xSize,ySize,depth)
}

function drawReflection(ctx,layers,x,y,ySize,xSize,hh,depth) {
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = `rgba(0,0,0,0.05)`
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x - ySize, y + hh, ySize / (2 + i / 4), depth * 2, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x + ySize, y + hh, ySize / (2 + i / 4), depth * 2, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.fillStyle = `rgba(255,255,255,0.03)`
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x, y + hh, ySize / (2 + i / 2), xSize / (4 + i / 2), 0, 0, Math.PI * 2)
        ctx.fill()
    }
}

function draw_shadow(ctx,xSize,ySize,depth) {
    ctx.globalCompositeOperation = 'source-atop'
    // Create gradient
    var grd = ctx.createLinearGradient(0, ySize, 0, ySize+depth);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.7)");

    // Fill with gradient
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, xSize*2, ySize+depth);
}

module.exports = { createTilePNG ,createStairPNG}
