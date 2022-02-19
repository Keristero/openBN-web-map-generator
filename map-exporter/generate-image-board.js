const { createCanvas, loadImage } = require('canvas')
const axios = require('axios').default
const { downloadFile,fastHash} = require('../helpers')
let { writeFile } = require('fs/promises')
const fs = require('fs')
const path = require('path')

async function generate_image_board_image(image_url) {
    let input_image_path = `temp_board_image.png`
    await downloadFile(image_url, input_image_path)
    let input_image = await loadImage(input_image_path)

    let canvas_board = createCanvas(64, 64)
    let ctx_board = canvas_board.getContext('2d')

    let canvas_small_image = createCanvas(32, 32)
    let ctx_small_image = canvas_small_image.getContext('2d')

    //First draw a small version of the input image to the small image canvas
    ctx_small_image.drawImage(input_image, 0, 0, 32, 32)

    //now draw the left side, we can just flip for the other side
    let dest_y = 16
    let dest_x = 0
    let y_offset = 0
    let every_second_pixel_flag = true
    for(let x_offset = 0; x_offset < 32; x_offset++){
        if(every_second_pixel_flag){
            y_offset = y_offset-1
        }
        every_second_pixel_flag = !every_second_pixel_flag

        let x = dest_x+x_offset
        let y = dest_y+y_offset
        let source_x = x_offset
        let source_y = 0
        ctx_board.drawImage(canvas_small_image, source_x, source_y, 1, 32, x, y, 1, 32);
    }
    return canvas_board
}

async function generateTSX(tsx_path, tileHash) {
    let doc = `<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.5" tiledversion="1.5.0" name="${tileHash}" tilewidth="64" tileheight="64" tilecount="1" columns="1" objectalignment="top">
    <tileoffset x="0" y="0"/>
    <image source="./${tileHash}.png" width="64" height="64"/>
    <tile id="0">
        <objectgroup draworder="index" id="2">
            <object id="2" x="-3.25193" y="41.1807" width="35.7708" height="6.88694" rotation="334.505"/>
        </objectgroup>
    </tile>
</tileset>
`
    await writeFile(tsx_path, doc)
}

function generate_image_board(image_url){
    return new Promise(async(resolve,reject)=>{
        try{
            let path_generated_assets = path.join('.', 'onb-server','assets', 'generated')
            let file_name = fastHash(image_url)
            let relative_tsx_path = `../assets/generated/${file_name}.tsx`
            let canvas = await generate_image_board_image(image_url)
            await generateTSX(path.join(path_generated_assets,`${file_name}.tsx`),file_name)
            let out = fs.createWriteStream(path.join(path_generated_assets,`${file_name}.png`))
            let stream = canvas.createPNGStream(`${file_name}.png`)
            stream.pipe(out)
            out.on('finish', () =>{
                console.log('generated image board tsx')
                resolve(relative_tsx_path)
            })
        }catch(e){
            reject(e)
        }
    })
}

//Test
//let textURL = `https://preview.redd.it/5670r2x5bgm71.jpg?width=640&height=715&crop=smart&auto=webp&s=418b1e86e6522d5467fffc10abb7e1491808362e`
//generate_image_board(textURL, './test-board','./test-board-output.png')

module.exports = {generate_image_board}