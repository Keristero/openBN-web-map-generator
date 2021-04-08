const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const {downloadFavicon} = require('./downloadFavicon.js')
const TweenJs = require('@tweenjs/tween.js')

let web_address = `https://cprewritten.net/`
let converted_favicon_path = path.resolve('.',`favicon.png`)
let output_path = path.resolve('.',`background.png`)

//For preview
const GIFEncoder = require('gifencoder');

main()

async function main(){
    await downloadFavicon(web_address,converted_favicon_path)
    await generateAnimation(converted_favicon_path,output_path)
}

async function generateAnimation(converted_favicon_path,output_path,preview=true,previewPath="preview.gif"){
    let favicon = await loadImage(converted_favicon_path)

    let width = 128
    let height = 64
    let frame = 0

    let canvas = createCanvas(width, height)
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true

    if(preview){
        var preview_canvas = createCanvas(width*2, height*2)
        var preview_ctx = preview_canvas.getContext('2d')
        //prepare gif encoder if we want a preview
        var encoder = new GIFEncoder(width*2, height*2);
        encoder.createReadStream().pipe(fs.createWriteStream(previewPath));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(100);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
    }

    let parameters = {
        spacing:16,
    }

    let animation = new FlippingAnimation(canvas,favicon,parameters)

    let out_canvas = createCanvas(width, height*animation.frames)
    let out_ctx = out_canvas.getContext('2d')
    out_ctx.imageSmoothingEnabled = false
    
    //Animate
    while(frame < animation.frames){
        animation.animateFrame(ctx,frame)
        saveOutputFrame(canvas,preview,out_ctx,preview_ctx,encoder,frame)
        ctx.clearRect(0,0,width,height)
        frame++
    }

    if(preview){
        encoder.finish();
    }

    //Save
    out_canvas.createPNGStream().pipe(fs.createWriteStream(output_path))
}

class StaticAnimation{
    constructor(canvas,favicon,{spacing}){
        this.frames = 1
        this.width = canvas.width
        this.height = canvas.height
        this.favicon = favicon

        let faviconScaling = 1
        this.faviconScaledSize = favicon.width*faviconScaling
        this.spacing = spacing + this.faviconScaledSize

        this.xStart = -spacing
        this.yStart = -spacing
        this.xEnd = this.width+spacing
        this.yEnd = this.height+spacing

        //Read middle pixel color to generate a background color
        this.getBackgroundColorFromFavicon()

    }
    getBackgroundColorFromFavicon(){
        //Read middle pixel color to generate a background color
        let fav_canvas = createCanvas(this.favicon.width, this.favicon.height)
        let fav_ctx = fav_canvas.getContext('2d')
        fav_ctx.drawImage(this.favicon,0,0)
        let middlePixel = fav_ctx.getImageData(this.favicon.width/2,this.favicon.height/2,1,1).data
        let middlePixelColor = {r:middlePixel[0],g:middlePixel[1],b:middlePixel[2]}
        let backgroundColorIntensity = 0.3
        function rcolor(val){
            return Math.floor(val*backgroundColorIntensity)
        }
        this.backgroundColor = `rgb(${rcolor(middlePixelColor.r)},${rcolor(middlePixelColor.g)},${rcolor(middlePixelColor.b)})`
    }
    animateFrame(ctx,frame){
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.width,this.height)
        for(let x = this.xStart; x < this.xEnd; x+=this.spacing){
            for(let y = this.yStart; y < this.yEnd; y+=this.spacing){
                ctx.drawImage(this.favicon, x, y,this.faviconScaledSize,this.faviconScaledSize)
            }
        }
    }
}

class FlippingAnimation extends StaticAnimation{
    constructor(canvas,favicon,parameters){
        super(canvas,favicon,parameters)
        this.frames = 24

        this.tweenData = {width:this.faviconScaledSize}
        
        //Generate a darker verison of the favicon for the back side
        let fav_canvas = createCanvas(this.favicon.width, this.favicon.height)
        let fav_ctx = fav_canvas.getContext('2d')
        fav_ctx.drawImage(this.favicon,0,0)
        fav_ctx.globalCompositeOperation = 'source-atop';
        fav_ctx.fillStyle = 'rgba(0,0,0,0.3)'
        fav_ctx.fillRect(0,0,this.favicon.width,this.favicon.height)
        this.darkFavicon = fav_canvas

        let easingTypes = [TweenJs.Easing.Quadratic.InOut,TweenJs.Easing.Circular.InOut,TweenJs.Easing.Exponential.InOut,TweenJs.Easing.Bounce.InOut]

        //Flip icon front facing
        let tA = new TweenJs.Tween(this.tweenData).to({width:-this.faviconScaledSize},this.frames/2).easing(TweenJs.Easing.Bounce.InOut).start(0)
        let tB = new TweenJs.Tween(this.tweenData).to({width:this.faviconScaledSize},this.frames/2).easing(TweenJs.Easing.Bounce.InOut)
        tA.chain(tB)
    }
    animateFrame(ctx,frame){
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.width,this.height)

        TweenJs.update(frame)
        console.log(frame,this.tweenData)

        let width = Math.abs(this.tweenData.width)
        let secondOne = false
        for(let x = this.xStart; x < this.xEnd; x+=this.spacing){
            for(let y = this.yStart; y < this.yEnd; y+=this.spacing){
                if(secondOne){
                    let flip = this.tweenData.width < 0
                    let favicon = this.favicon
                    if(flip){
                        favicon = this.darkFavicon
                    }
                    drawImage(ctx,favicon,x,y,width,this.faviconScaledSize,0,flip,false,true)
                }else{
                    drawImage(ctx,this.favicon,x,y,this.faviconScaledSize,this.faviconScaledSize,0,false,false,true)
                }
                secondOne = !secondOne
            }
        }
    }
}

function saveOutputFrame(canvas,preview,out_ctx,preview_ctx,encoder,frame){
    //Draw outputs
    if(preview){
        //Draw 4 copies of the image to preview how well the gif tiles
        preview_ctx.drawImage(canvas,0,0)
        preview_ctx.drawImage(canvas,canvas.width,0)
        preview_ctx.drawImage(canvas,0,canvas.height)
        preview_ctx.drawImage(canvas,canvas.width,canvas.height)
        encoder.addFrame(preview_ctx);
    }
    out_ctx.drawImage(canvas, 0, canvas.height*frame)
}

function drawImage(ctx, img, x, y, width, height, deg, flip, flop, center) {

    ctx.save();
    
    if(typeof width === "undefined") width = img.width;
    if(typeof height === "undefined") height = img.height;
    if(typeof center === "undefined") center = false;
    
    // Set rotation point to center of image, instead of top/left
    if(center) {
        x -= width/2;
        y -= height/2;
    }
    
    // Set the origin to the center of the image
    ctx.translate(x + width/2, y + height/2);
    
    // Rotate the canvas around the origin
    var rad = 2 * Math.PI - deg * Math.PI / 180;    
    ctx.rotate(rad);
    
    // Flip/flop the canvas
    if(flip) flipScale = -1; else flipScale = 1;
    if(flop) flopScale = -1; else flopScale = 1;
    ctx.scale(flipScale, flopScale);
    
    // Draw the image    
    ctx.drawImage(img, -width/2, -height/2, width, height);
    
    ctx.restore();
    }