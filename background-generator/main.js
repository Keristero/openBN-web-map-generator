const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const {downloadFavicon} = require('./downloadFavicon.js')
const TweenJs = require('@tweenjs/tween.js')
const hash = require('object-hash');
const hashOptions = {
    excludeKeys:(key)=>{
        if(key === "x" || key === "y"){
            return true
        }
        return false
    }
}
const RNG = require("./RNG.js")
const Random = new RNG(123)

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
    ctx.imageSmoothingEnabled = true

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
        spacing:Random.Integer(0,1)*16,
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
        this.rows = (this.width/this.faviconScaledSize)+20
        this.columns = (this.height/this.faviconScaledSize)+20

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
        for(let row = -10; row < this.rows; row++){
            let x = this.xStart + row*(this.spacing)
            for(let column = -10; column < this.columns; column++){
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
                let iconHash = hash(newIcon,hashOptions)
                this.icons[iconHash] = newIcon
            }
        }
        this.initialIcons = JSON.parse(JSON.stringify(this.icons))

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
        let animationStages = 2
        for(let stage = 0; stage < animationStages; stage++){
            if(stage == 0){
                this.generateTweenStage(this.icons)
            }else{
                this.generateTweenStage(this.tweenTargets[this.tweenTargets.length-1])
            }
        }
        this.generateResetTween(this.tweenTargets[this.tweenTargets.length-1])

        let easingTypes = [TweenJs.Easing.Quadratic.InOut,TweenJs.Easing.Linear.None]
        let easingType = easingTypes[Random.Integer(0,easingTypes.length-1)]

        let tweens = []
        let index = 0
        for(let tweenTarget of this.tweenTargets){
            let tweenDuration = this.frames/this.tweenTargets.length
            let newTween = new TweenJs.Tween(this.icons).to(tweenTarget,tweenDuration).easing(easingType)
            if(index > 0){
                tweens[index-1].chain(newTween)
            }else{
                newTween.start(0)
            }
            tweens.push(newTween)
            index++
        }
        tweens[0].start()
    }
    generateTweenStage(previousStage){
        let horizontalDirection = Random.Integer(-1,1)
        let verticalDirection = Random.Integer(-1,1)

        let everySecondColumn = Random.Bool()
        let everySecondRow = Random.Bool()
        let invertSelection = Random.Bool()

        let flipDirection = Random.Integer(-1,1)
        let flopDirection = Random.Integer(-1,1)

        let rotationDirection = Random.Integer(-1,1)
        let halfRotations = Random.Integer(1,2)
        var tweenIcons = JSON.parse(JSON.stringify(previousStage))
        for(let iconHash in tweenIcons){
            let icon = tweenIcons[iconHash]
            let translationMulti = 2
            let skip = false
            if(everySecondColumn && icon.column % 2 == 0){
                skip = true
            }
            if(everySecondRow && icon.row % 2 == 0){
                skip = true
            }
            if(invertSelection){
                skip = !skip
            }
            if(skip){
                continue
            }
            let transforms = 0
            let maxTransforms = 3
            if(horizontalDirection != 0 && transforms < maxTransforms){
                let places = translationMulti*horizontalDirection
                icon.x += this.spacing*places
                icon.row += places
                transforms++
            }
            if(verticalDirection != 0 && transforms < maxTransforms){
                let places = translationMulti*verticalDirection
                icon.y += this.spacing*places
                icon.col += places
                transforms++
            }
            if(flipDirection != 0 && transforms < maxTransforms){
                icon.xScale = flipDirection
                transforms++
            }
            if(flopDirection != 0 && transforms < maxTransforms){
                icon.yScale = flopDirection
                transforms++

            }
            if(rotationDirection != 0 && transforms < maxTransforms){
                let angleDelta = halfRotations*rotationDirection*180
                icon.rotation += angleDelta
                transforms++
            }
            tweenIcons[iconHash] = icon
        }
        this.tweenTargets.push(tweenIcons)
    }
    generateResetTween(previousStage){
        let resetStage = JSON.parse(JSON.stringify(previousStage))
        for(let iconHash in this.icons){
            let icon = this.icons[iconHash]
            let latestCopy = previousStage[iconHash]
            let finalCopy = resetStage[iconHash]
            if(icon.rotation % 360 != latestCopy.rotation % 360){
                finalCopy.rotation = icon.rotation
            }
            if(icon.xScale != latestCopy.xScale){
                finalCopy.xScale = icon.xScale
            }
            if(icon.yScale != latestCopy.yScale){
                finalCopy.yScale = icon.yScale
            }
        }
        this.tweenTargets.push(resetStage)
        console.log('reset tween')
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