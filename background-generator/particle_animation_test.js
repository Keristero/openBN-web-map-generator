const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas')
const TweenJs = require('@tweenjs/tween.js')
//For preview
const GIFEncoder = require('gifencoder');

function RandomInteger(min, max) {
    var range = max - min + 1
    return Math.floor(range * Math.random()) + min
}

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
        outputString += `frame duration="0.032" x="${x*width}" y="${y*height}" w="${width}" h="${height}" originx="0" originy="0"\n`
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
        encoder.setDelay(32);  // frame delay in ms
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
        //snow animation
        this.particles = {}
        this.particles_linear = {}
        this.uninterpolated_particle_properties = {}
        for(let i = 0; i< 50; i ++){
            let x = RandomInteger(0, this.width)
            let y = RandomInteger(0, this.height)
            let scale = 1+(Math.random()*2)
            this.particles[i]= {x:x,w:1*scale,h:2*scale,r:200,g:200,b:255,a:0.5}
            this.particles_linear[i]= {y:y}
            this.uninterpolated_particle_properties[i] = {scale:scale,horz_dist:RandomInteger(-10,10)*scale,originalx:x}
        }

        this.tweenTargets = []
        this.tweenTargetsLinear = []
        this.animation_stages = 2
        for (let stage = 0; stage < this.animation_stages; stage++) {
            if(stage == 0){
                this.generateTweenStage(this.particles,this.particles_linear,stage)
            }else{
                this.generateTweenStage(this.tweenTargets[this.tweenTargets.length-1],this.tweenTargetsLinear[this.tweenTargetsLinear.length-1],stage)
            }
        }
        this.frames = 32 *this.animation_stages

        let easeStrat = TweenJs.Easing.Sinusoidal.InOut

        let tweens = []
        let tweens_linear = []
        let index = 0
        for (let tween_index in this.tweenTargets) {
            let tweenTarget = this.tweenTargets[tween_index]
            let tweenTargetLinear = this.tweenTargetsLinear[tween_index]
            let tweenDuration = Math.floor(this.frames / this.tweenTargets.length)
            let newTween = new TweenJs.Tween(this.particles).to(tweenTarget, tweenDuration).easing(easeStrat)
            let newTweenLinear = new TweenJs.Tween(this.particles_linear).to(tweenTargetLinear, tweenDuration).easing(TweenJs.Easing.Linear.None)
            if (index > 0) {
                tweens[index - 1].chain(newTween)
                tweens_linear[index - 1].chain(newTweenLinear)
            } else {
                newTween.start(0)
                newTweenLinear.start(0)
            }
            tweens.push(newTween)
            tweens_linear.push(newTweenLinear)
            index++
        }
        //tweens[0].start()
        //tweens_linear[0].start()
    }
    update_particles(particles,particles_linear,stage_index) {
        for (let particle_id in particles) {
            let particle = particles[particle_id]
            let particle_linear = particles_linear[particle_id]
            let particle_info = this.uninterpolated_particle_properties[particle_id]
            particle_linear.y += (this.height/this.animation_stages)*Math.floor(particle_info.scale)
            particle.x += particle_info.horz_dist
            if(stage_index == this.animation_stages-1){
                particle.x = particle_info.originalx
            }
        }
    }
    animateFrame(ctx, frame) {
        TweenJs.update(frame)
        //clear previous frame
        ctx.clearRect(0,0,this.width,this.height)
        //draw the particles
        for (let particle_id in this.particles) {
            let particle = this.particles[particle_id]
            let particle_linear = this.particles_linear[particle_id]
            ctx.fillStyle = `rgba(${particle.r},${particle.g},${particle.b},${particle.a})`
            let centerx = particle.x-(particle.w*0.5)
            let centery = particle_linear.y-(particle.h*0.5)
            let wrappedx = (centerx%this.width)
            let wrappedy = (centery%this.height)
            draw_circle(ctx,wrappedx,wrappedy,particle.w)
            //if the particle will be moving into the top of the frame draw it there too
            //y coord
            draw_circle(ctx,wrappedx,wrappedy-this.height,particle.w)
            draw_circle(ctx,wrappedx,wrappedy+this.height,particle.w)
            //x coord
            draw_circle(ctx,wrappedx-this.width,wrappedy,particle.w)
            draw_circle(ctx,wrappedx+this.width,wrappedy,particle.w)
            //ctx.fillRect(centerx%this.width,centery%this.height,particle.w,particle.h)
            //draw particle
        }
    }
    generateTweenStage(previousStage,previousStageLinear,stage_index) {
        var particles_clone = JSON.parse(JSON.stringify(previousStage))
        var particles_clone_linear = JSON.parse(JSON.stringify(previousStageLinear))
        this.update_particles(particles_clone,particles_clone_linear,stage_index)
        this.tweenTargets.push(particles_clone)
        this.tweenTargetsLinear.push(particles_clone_linear)
    }
}

function draw_circle(ctx,x,y,radius){
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill()
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