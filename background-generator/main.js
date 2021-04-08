const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const {downloadFavicon} = require('./downloadFavicon.js')
const TweenJs = require('@tweenjs/tween.js')
const hash = require('object-hash');

let web_address = `https://www.atari.com/`
let converted_favicon_path = path.resolve('.',`favicon.png`)
let output_path = path.resolve('.',`background.png`)

//For preview
const GIFEncoder = require('gifencoder');

main()

async function main(){
    //await downloadFavicon(web_address,converted_favicon_path)
    await generateAnimation(converted_favicon_path,output_path)
}

async function generateAnimation(converted_favicon_path,output_path,preview=true,previewPath="preview.gif"){
    let favicon = await loadImage(converted_favicon_path)

    let width = 64
    let height = 64
    let frame = 0

    let canvas = createCanvas(width, height)
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    if(preview){
        var preview_canvas = createCanvas(width*2, height*2)
        var preview_ctx = preview_canvas.getContext('2d')
        //prepare gif encoder if we want a preview
        var encoder = new GIFEncoder(width*2, height*2);
        encoder.createReadStream().pipe(fs.createWriteStream(previewPath));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(32);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
    }

    let parameters = {
        spacing:0,
        faviconScaling:1
    }

    let animation = new TweenedAnimation(canvas,favicon,parameters)

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
    constructor(canvas,favicon,{spacing,faviconScaling}){
        this.frames = 1
        this.width = canvas.width
        this.height = canvas.height
        this.favicon = favicon

        this.faviconScaledSize = favicon.width*faviconScaling
        this.spacing = spacing + this.faviconScaledSize
        this.rows = (this.width/this.faviconScaledSize)+4
        this.columns = (this.height/this.faviconScaledSize)+4

        this.xStart = -spacing
        this.yStart = -spacing
        this.xEnd = this.width+spacing
        this.yEnd = this.height+spacing

        //Generate a darker verison of the favicon for the back side
        let fav_canvas = createCanvas(this.favicon.width, this.favicon.height)
        let fav_ctx = fav_canvas.getContext('2d')
        fav_ctx.drawImage(this.favicon,0,0)
        fav_ctx.globalCompositeOperation = 'source-atop';
        fav_ctx.fillStyle = 'rgba(0,0,0,0.3)'
        fav_ctx.fillRect(0,0,this.favicon.width,this.favicon.height)
        this.favicon_backside = fav_canvas

        //Generate icons
        //This data can be tweened for animations!
        this.icons = {}
        for(let row = -2; row < this.rows; row++){
            let x = this.xStart + row*(this.spacing)
            for(let column = -2; column < this.columns; column++){
                let y = this.yStart + column*(this.spacing)
                let newIcon = {
                    x:x,
                    y:y,
                    xScale:1,
                    yScale:1,
                    rotation:0,
                    row:row,
                    column:column
                }
                let iconHash = hash(newIcon)
                this.icons[iconHash] = newIcon
            }
        }

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
        TweenJs.update(frame)
        ctx.fillStyle = this.backgroundColor
        ctx.fillRect(0,0,this.width,this.height)
        for(let iconHash in this.icons){
            let icon = this.icons[iconHash]
            let width = this.faviconScaledSize*icon.xScale
            let height = this.faviconScaledSize*icon.yScale
            let flip = false
            let flop = false
            let image = this.favicon
            if(width < 0){
                flip = true
                width = Math.abs(this.faviconScaledSize*icon.xScale)
            }
            if(height < 0){
                flop = true
                height = Math.abs(this.faviconScaledSize*icon.yScale)
            }
            if(( flip && !flop ) || ( !flip && flop )){
                //If the favicon is both flipped and flopped, it would be frontside not back
                //If it is either flipped or flopped, it shows the front
                image = this.favicon_backside
            }
            drawImage(ctx,image,icon.x,icon.y,width,height,icon.rotation,flip,flop,true)
        }
    }
}

class TweenedAnimation extends StaticAnimation{
    constructor(canvas,favicon,parameters){
        super(canvas,favicon,parameters)
        this.frames = 64

        this.tweenTargets = []
        let animationStages = 20

        for(let stage = 0; stage < animationStages; stage++){
            this.generateTweenStage()
        }
        let lastStageHash = hash(this.tweenTargets[this.tweenTargets.length-1])
        let firstStageHash = hash(this.icons)
        if(lastStageHash != firstStageHash){
            //If the last stage does not match the first, generate a final stage matching the first
            this.tweenTargets.push(JSON.parse(JSON.stringify(this.icons)))
        }

        let easingTypes = [TweenJs.Easing.Quadratic.InOut,TweenJs.Easing.Circular.InOut,TweenJs.Easing.Exponential.InOut,TweenJs.Easing.Bounce.InOut]

        let tweens = []
        let index = 0
        for(let tweenTarget of this.tweenTargets){
            let tweenDuration = this.frames/this.tweenTargets.length
            let newTween = new TweenJs.Tween(this.icons).to(tweenTarget,tweenDuration).easing(TweenJs.Easing.Linear.None)
            if(index > 0){
                tweens[index-1].chain(newTween)
            }else{
                newTween.start(0)
            }
            tweens.push(newTween)
            index++
        }
        tweens[0].start()
        /*
        let tA = new TweenJs.Tween(this.icons).to(tweenTarget1,this.frames/2).easing(TweenJs.Easing.Quadratic.InOut).start(0)
        let tB = new TweenJs.Tween(this.icons).to(tweenTarget2,this.frames/2).easing(TweenJs.Easing.Quadratic.InOut)
        tA.chain(tB)
        */
    }
    generateTweenStage(){
        let horizontalAnimation = randomBool()
        let everySecondColumn = randomBool()
        let verticalAnimation = randomBool()
        let everySecondRow = randomBool()
        var tweenTargets = {}
        for(let iconHash in this.icons){
            let icon = this.icons[iconHash]
            let iconCopy = JSON.parse(JSON.stringify(icon))
            if(everySecondColumn && icon.column % 2 == 0){
                continue
            }
            if(everySecondRow && icon.row % 2 == 0){
                continue
            }
            if(horizontalAnimation){
                let multi = 1
                if(everySecondRow){
                    multi = 2
                }
                iconCopy.x += this.spacing*multi
            }
            if(verticalAnimation){
                let multi = 1
                if(everySecondColumn){
                    multi = 2
                }
                iconCopy.y += this.spacing*multi
            }
            tweenTargets[iconHash] = iconCopy
        }
        console.log(tweenTargets)
        this.tweenTargets.push(tweenTargets)
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

function randomBool(){
    return Math.random() > 0.5
}