const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const { RNG, RGBAtoString } = require("../helpers.js");

function createTilePNG(tile_options, out_path) {
    let canvas = drawTileOnCanvas(tile_options);
    let out = fs.createWriteStream(out_path);
    let stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on("finish", () => console.log("The PNG file was created."));
}

function drawRandomTileOnCanvas() {
    let rng = new RNG();
    let minColor = { r: 0, g: 0, b: 0, a: 0.2 };
    let maxColor = { r: 255, g: 255, b: 255, a: 1 };
    let base_color = RGBAtoString(rng.RGBA(minColor, maxColor));
    let side_color = RGBAtoString(rng.RGBA(minColor, maxColor));
    let color = RGBAtoString(rng.RGBA(minColor, maxColor));
    let tile_options = {
        width: 64,
        length: 32,
        tile_height: 8,
        line_width: 3,
        base_color,
        side_color,
        color,
    }
    return drawTileOnCanvas(tile_options)
}

function drawTileOnCanvas({ width, length, tile_height, line_width, base_color, side_color, color }) {
    let canvasWidth = width + line_width
    let canvasHeight = length + tile_height + line_width
    let canvas = createCanvas(canvasWidth, canvasHeight)
    let ctx = canvas.getContext('2d')
    drawTile(ctx, 0, 0, width, length, tile_height, line_width, base_color, side_color, color)
    return canvas
}

function drawTile(ctx, px, py, xSize, ySize, depth, lineWidth, base_color, side_color, color) {
    console.log('drawing tile', base_color, side_color, color)
    let x = px + xSize / 2 + lineWidth / 2
    let y = py + lineWidth / 2
    let drawAndFillPath = function (points) {
        ctx.beginPath()
        points.forEach((point, index) => {
            if (index == 0) {
                ctx.moveTo(point.x, point.y)
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        //Draw a nice thick line along path
        ctx.lineWidth = 1 //except right now it aint thick
        ctx.strokeStyle = 'rgb(50,50,50)'
        ctx.stroke()
        ctx.fill()
        ctx.lineWidth = 1
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
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

    ctx.fillStyle = base_color;
    let bottomPoints = [bottom_back, bottom_right, bottom_front, bottom_left, bottom_back];
    drawAndFillPath(bottomPoints);
    ctx.fillStyle = side_color;
    let rightSidePoints = [bottom_back, top_back, top_right, bottom_right, bottom_back];
    drawAndFillPath(rightSidePoints);
    let leftSidePoints = [bottom_back, top_back, top_left, bottom_left, bottom_back];
    drawAndFillPath(leftSidePoints);
    let frontRightPoints = [bottom_front, top_front, top_right, bottom_right, bottom_front];
    drawAndFillPath(frontRightPoints);
    let frontLeftPoints = [bottom_front, top_front, top_left, bottom_left, bottom_front];
    drawAndFillPath(frontLeftPoints);
    ctx.fillStyle = color;
    let topPoints = [top_back, top_right, top_front, top_left, top_back];
    drawAndFillPath(topPoints);

    let drawReflection = function (layers) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.fillStyle = `rgba(0,0,0,0.1)`
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
        ctx.fillStyle = `rgba(255,255,255,0.05)`;
        for (let i = 0; i < layers; i++) {
            ctx.beginPath()
            ctx.ellipse(x, y + hh, ySize / (2 + i / 2), xSize / (4 + i / 2), 0, 0, Math.PI * 2)
            ctx.fill()
        }
    };
    drawReflection(5);
}

module.exports = { createTilePNG }
