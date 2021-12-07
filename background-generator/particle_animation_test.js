const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const { downloadFavicon } = require('./downloadFavicon.js')
const { RNG } = require('../helpers.js')
const TweenJs = require('@tweenjs/tween.js')
const Random = new RNG()
//For preview
const GIFEncoder = require('gifencoder');

async function generate_particle_animation(outputName,outputPath){
    let output_filename = `${outputName}.png`
    let output_path = path.resolve(outputPath,output_filename)
    let output_animation_filename = `${outputName}.animation`
    let output_animation_path = path.resolve(outputPath,output_animation_filename)

    let animation = await generateAnimationPNG(output_path)
    generateAnimationFile(output_filename,output_animation_path,animation.width,animation.height,animation.frames)
}

async function generateAnimationFile(PNGname,outputPath,width,height,frames){
    let outputString = `imagePath="${PNGname}"\nanimation state="BG"\n`

    let frames_per_row = Math.round(Math.sqrt(frames))+1
    for(let i = 0; i < frames; i++){
        let x = i % frames_per_row
        let y = Math.floor(i / frames_per_row)
        outputString += `frame duration="0.041" x="${x*width}" y="${y*height}" w="${width}" h="${height}" originx="0" originy="0"\n`
    }
    fs.writeFileSync(outputPath,outputString)
}

async function generateAnimationPNG(output_path, preview = true, previewPath = "./preview.gif") {
    let width = 256
    let height = 256
    let frame = 0

    let canvas = createCanvas(width, height)
    let ctx = canvas.getContext('2d')
    
    this.alpha_fade_speed = 0.2
    ctx.imageSmoothingEnabled = false


    if (preview) {
        var preview_canvas = createCanvas(width * 2, height * 2)
        var preview_ctx = preview_canvas.getContext('2d')
        //prepare gif encoder if we want a preview
        var encoder = new GIFEncoder(width * 2, height * 2);
        encoder.createReadStream().pipe(fs.createWriteStream(previewPath));
        encoder.start();
        encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
        encoder.setDelay(16);  // frame delay in ms
        encoder.setQuality(10); // image quality. 10 is default.
    }

    let animation = new ParticleAnimation(canvas,width,height)

    let out_sheet_row_length = Math.round(Math.sqrt(animation.frames))+1
    let out_canvas = createCanvas(out_sheet_row_length*width, out_sheet_row_length*height)
    let out_ctx = out_canvas.getContext('2d')
    out_ctx.imageSmoothingEnabled = false

    //Animate
    while (frame < animation.frames) {
        animation.animateFrame(ctx, frame)
        saveOutputFrame(canvas, preview, out_ctx, out_sheet_row_length, preview_ctx, encoder, frame)
        frame++
    }

    if (preview) {
        encoder.finish();
    }

    //Save
    out_canvas.createPNGStream().pipe(fs.createWriteStream(output_path))
    return animation
}

class ParticleAnimation {
    constructor(canvas, width,height) {
        this.width = width
        this.height = height
        //rain animation
        this.particles = {}
        this.uninterpolated_particle_properties = {}
        for(let i = 0; i< 30; i ++){
            let x = Random.Integer(0, this.width)
            let y = Random.Integer(0, this.height)
            let scale = Random.Integer(0,2)
            this.particles[i]= {x:x,y:y,w:1*scale,h:2*scale,r:200,g:200,b:255,a:0.5}
            this.uninterpolated_particle_properties[i] = {scale:scale}
        }

        this.tweenTargets = []
        let animationStages = 1
        for (let stage = 0; stage < animationStages; stage++) {
            this.generateTweenStage(this.particles)
        }
        this.frames = 64 *animationStages

        let easeStrat = TweenJs.Easing.Linear.None
        console.log('frames', this.frames)
        console.log('stages', animationStages)

        let tweens = []
        let index = 0
        for (let tweenTarget of this.tweenTargets) {
            let tweenDuration = Math.floor(this.frames / this.tweenTargets.length)
            let newTween = new TweenJs.Tween(this.particles).to(tweenTarget, tweenDuration).easing(easeStrat)
            if (index > 0) {
                tweens[index - 1].chain(newTween)
            } else {
                newTween.start(0)
            }
            tweens.push(newTween)
            index++
        }
        tweens[0].start()
    }
    update_particles(particles) {
        for (let particle_id in particles) {
            let particle = particles[particle_id]
            let particle_extra_info = this.uninterpolated_particle_properties[particle_id]
            particle.y += this.height*particle_extra_info.scale
        }
    }
    animateFrame(ctx, frame) {
        console.log('animating frame',frame)
        TweenJs.update(frame)
        //clear previous frame
        ctx.clearRect(0,0,this.width,this.height)
        //draw the particles
        for (let particle_id in this.particles) {
            let particle = this.particles[particle_id]
            ctx.fillStyle = `rgba(${particle.r},${particle.g},${particle.b},${particle.a})`
            let centerx = particle.x-(particle.w*0.5)
            let centery = particle.y-(particle.h*0.5)
            let wrappedx = (centerx%this.width)
            let wrappedy = (centery%this.height)
            ctx.fillRect(wrappedx,wrappedy,particle.w,particle.h)
            //if the particle will be moving into the top of the frame draw it there too
            //y coord
            ctx.fillRect(wrappedx,wrappedy-this.height,particle.w,particle.h)
            ctx.fillRect(wrappedx,wrappedy+this.height,particle.w,particle.h)
            //x coord
            ctx.fillRect(wrappedx-this.width,wrappedy,particle.w,particle.h)
            ctx.fillRect(wrappedx+this.width,wrappedy,particle.w,particle.h)
            //ctx.fillRect(centerx%this.width,centery%this.height,particle.w,particle.h)
            //draw particle
        }
    }
    generateTweenStage(previousStage) {
        var particles_clone = JSON.parse(JSON.stringify(previousStage))
        this.update_particles(particles_clone)
        this.tweenTargets.push(particles_clone)
    }
}

function saveOutputFrame(canvas, preview, out_ctx, out_sheet_row_length, preview_ctx, encoder, frame_index) {
    //Draw outputs
    if (preview) {
        //Draw 4 copies of the image to preview how well the gif tiles
        preview_ctx.drawImage(canvas, 0, 0)
        preview_ctx.drawImage(canvas, canvas.width, 0)
        preview_ctx.drawImage(canvas, 0, canvas.height)
        preview_ctx.drawImage(canvas, canvas.width, canvas.height)
        encoder.addFrame(preview_ctx);
        preview_ctx.clearRect(0,0,canvas.width*2,canvas.height*2)
    }
    let tile_widths = out_sheet_row_length
    let tile_heights = out_sheet_row_length
    let x = frame_index % tile_widths
    let y = Math.floor(frame_index / tile_heights)
    out_ctx.drawImage(canvas, x*canvas.width, y*canvas.height)
}

generate_particle_animation("test","./")