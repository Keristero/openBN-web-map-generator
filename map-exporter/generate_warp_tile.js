const { createCanvas } = require('canvas')
const fs = require('fs')
let {writeFile } = require('fs/promises')

const pad_depth = 2
const pad_slope = 9
const half_slope = Math.floor(pad_slope/2)
const pad_gap = 4
const half_gap = Math.floor(pad_gap/2)

//Warp Tile

function create_warp_base_png(tile_options, out_path) {
    let canvas = draw_warp_tile_on_canvas(tile_options)
    let out = fs.createWriteStream(out_path)
    let stream = canvas.createPNGStream()
    stream.pipe(out)
}

function draw_warp_tile_on_canvas({ width, length, line_width, base_color, side_color, color}) {
    let canvasWidth = width
    let canvasHeight = length+pad_depth+1
    let canvas = createCanvas(canvasWidth, canvasHeight)
    let ctx = canvas.getContext('2d')
    draw_warp_tile(ctx, 0, 0, width, length, line_width, base_color, side_color, color)
    return canvas
}

function draw_warp_tile(ctx, px, py, xSize, ySize, lineWidth, base_color, side_color, color) {
    ctx.imageSmoothingEnabled = false
    let x = Math.floor(px + xSize / 2 )
    let y = Math.floor(py)
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
        ctx.strokeStyle = 'rgb(0,0,0)'
        ctx.stroke()
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = base_color
        ctx.stroke()
    }
    let hw = Math.floor(xSize / 2)
    let hh = Math.floor(ySize / 2)
    let ly = y + pad_depth
    let top_back = { x: x, y: y+half_slope }
    let bottom_back = { x: x, y: ly }
    let top_right = { x: x + hw-pad_slope, y: y + hh }
    let bottom_right = { x: x + hw, y: ly + hh }
    let top_front = { x: x, y: y-half_slope + ySize }
    let bottom_front = { x: x, y: ly + ySize }
    let top_left = { x: x - hw+pad_slope, y: y + hh }
    let bottom_left = { x: x - hw, y: ly + hh }
    let pad_left = {x:top_left.x+pad_gap,y:top_left.y+1}
    let pad_right = {x:top_right.x-pad_gap,y:top_right.y+1}
    let pad_back = {x:top_back.x,y:top_back.y+half_gap+1}
    let pad_front = {x:top_front.x,y:top_front.y-half_gap+1}

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
    ctx.fillStyle = base_color
    let topPoints = [top_back, top_right, top_front, top_left, top_back]
    drawAndFillPath(topPoints)

    drawReflection(ctx,5,x,y,ySize,xSize,hh)

    ctx.globalCompositeOperation = "source-over"
    ctx.fillStyle = `rgba(0,0,0,0.8)`
    let padPoints = [pad_back, pad_right, pad_front, pad_left, pad_back]
    drawAndFillPath(padPoints)
}

//Warp Active

function create_warp_active_png(tile_options, out_path) {
    console.log(`creating warp active png`,tile_options)
    let canvas = draw_warp_active_on_canvas(tile_options)
    let out = fs.createWriteStream(out_path)
    let stream = canvas.createPNGStream()
    stream.pipe(out)
}

function draw_warp_active_on_canvas({ width, length, glow_color, favicon}) {
    let canvasWidth = width
    let canvasHeight = length + pad_depth+1
    let canvas = createCanvas(canvasWidth, canvasHeight)
    let ctx = canvas.getContext('2d')
    draw_warp_active(ctx, 0, 0, width, length, glow_color,favicon)
    return canvas
}

async function draw_warp_active(ctx, px, py, xSize, ySize, glow_color,favicon_img) {
    ctx.imageSmoothingEnabled= true
    let x = Math.floor(px + xSize / 2 )
    let y = Math.floor(py)
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
        ctx.fill()
    }
    let hw = Math.floor(xSize / 2)
    let hh = Math.floor(ySize / 2)
    let ly = y + pad_depth
    let top_back = { x: x, y: y+half_slope }
    let top_right = { x: x + hw-pad_slope, y: y + hh }
    let top_front = { x: x, y: y-half_slope + ySize }
    let top_left = { x: x - hw+pad_slope, y: y + hh }
    let pad_left = {x:top_left.x+pad_gap,y:top_left.y+1}
    let pad_right = {x:top_right.x-pad_gap,y:top_right.y+1}
    let pad_back = {x:top_back.x,y:top_back.y+half_gap+1}
    let pad_front = {x:top_front.x,y:top_front.y-half_gap+1}

    //Draw the background
    ctx.fillStyle = glow_color
    let padPoints = [pad_back, pad_right, pad_front, pad_left, pad_back]
    drawAndFillPath(padPoints)

    //now draw the left side, we can just flip for the other side
    ctx_to_isometric_transform(ctx)
    ctx.drawImage(favicon_img,pad_back.x-pad_back.y-(pad_depth*1),-pad_back.y-(pad_depth*1),16+4,16+4)

    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 0.1;
    draw_glow(ctx,10,hw,0,hh+4)
    ctx.globalAlpha = 1;

    reset_ctx_transform(ctx)
}

function ctx_to_isometric_transform(ctx){
    var xAxis = {
        x : 1,
        y : 0.5,
    }
    var yAxis = {
        x : -1,
        y : 0.5,
    }
    var origin = {
        x : 0,
        y : 0,
    }
    ctx.setTransform(xAxis.x, xAxis.y, yAxis.x, yAxis.y, origin.x, origin.y);
}

function reset_ctx_transform(ctx){
    ctx.setTransform(1, 1, 1, 1, 0, 0);
}

function draw_glow(ctx,layers,x,y,max_radius){
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.arc(x, y, max_radius*(i/layers), 0, 2 * Math.PI);
        ctx.fill()
    }
}

function drawReflection(ctx,layers,x,y,ySize,xSize,hh) {
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillStyle = `rgba(0,0,0,0.05)`
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x - ySize, y + hh, ySize / (2 + i / 4), ySize * 2, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x + ySize, y + hh, ySize / (2 + i / 4), ySize * 2, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.fillStyle = `rgba(255,255,255,0.03)`
    for (let i = 0; i < layers; i++) {
        ctx.beginPath()
        ctx.ellipse(x, y + hh, ySize / (2 + i / 2), xSize / (4 + i / 2), 0, 0, Math.PI * 2)
        ctx.fill()
    }
}

module.exports = {create_warp_base_png,create_warp_active_png}
