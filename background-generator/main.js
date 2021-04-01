const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const {downloadFavicon} = require('./downloadFavicon.js')

let web_address = `https://minecraft.fandom.com/wiki/Screenshot#:~:text=minecraft%5Cscreenshots%20into%20the%20File,where%20the%20screenshot%20was%20saved.`
let converted_favicon_path = path.resolve('.',`favicon.png`)
let output_path = path.resolve('.',`background.png`)

//For preview
const GIFEncoder = require('gifencoder');
const encoder = new GIFEncoder(854, 480);

main()

async function main(){
    await downloadFavicon(web_address,converted_favicon_path)
    await generateAnimation(converted_favicon_path,output_path)
}

async function generateAnimation(converted_favicon_path,output_path,preview=true,previewPath="preview.gif"){
    let favicon = await loadImage(converted_favicon_path)
    let fav_canvas = createCanvas(favicon.width, favicon.height)
    let fav_ctx = fav_canvas.getContext('2d')
    fav_ctx.drawImage(favicon,0,0)
    let middlePixel = fav_ctx.getImageData(favicon.width/2,favicon.height/2,1,1).data
    let middlePixelColor = {r:middlePixel[0],g:middlePixel[1],b:middlePixel[2]}
    console.log(middlePixelColor)

    let width = 128
    let height = 64
    let framesTotal = 32
    let frame = 0

    let canvas = createCanvas(width, height)
    let ctx = canvas.getContext('2d')
    let out_canvas = createCanvas(width, height*framesTotal)
    let out_ctx = out_canvas.getContext('2d')

    ctx.imageSmoothingEnabled = false
    out_ctx.imageSmoothingEnabled = false

    if(preview){
        var encoder = new GIFEncoder(width, height);
        encoder.createReadStream().pipe(fs.createWriteStream(previewPath));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(100);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
    }

    let parameters = {
        spacing:16,

    }

    function rcolor(val){

    }

    let backgroundColorIntensity = 0.3
    function rcolor(val){
        return Math.floor(val*backgroundColorIntensity)
    }
    let backgroundColor = `rgb(${rcolor(middlePixelColor.r)},${rcolor(middlePixelColor.g)},${rcolor(middlePixelColor.b)})`
    console.log(backgroundColor)

    let faviconScaling = 1
    let faviconScaledSize = favicon.width*faviconScaling
    let spacing = parameters.spacing + faviconScaledSize
    let movementMultiplier = spacing/framesTotal
    let offset = 0
    //Draw outside the border to make seamless
    let xStart = -spacing
    let yStart = -spacing
    let xEnd = width+spacing
    let yEnd = height+spacing

    //Animate
    while(frame < framesTotal){
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0,0,width,height)
        offset = frame*movementMultiplier
        for(let x = xStart; x < xEnd; x+=spacing){
            for(let y = yStart; y < yEnd; y+=spacing){
                ctx.drawImage(favicon, offset+x, offset+y,faviconScaledSize,faviconScaledSize)
            }
        }
        encoder.addFrame(ctx);
        out_ctx.drawImage(canvas, 0, height*frame)
        ctx.clearRect(0,0,width,height)
        frame++
    }

    encoder.finish();

    //Save
    out_canvas.createPNGStream().pipe(fs.createWriteStream(output_path))

}