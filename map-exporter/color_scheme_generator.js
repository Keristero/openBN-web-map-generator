const { createCanvas, loadImage } = require('canvas')
const complementaryColors = require('complementary-colors');

function fcol(color_value){
    return Math.min(200,color_value)
}

async function generate_color_scheme_from_image(image_path){
    let image = await loadImage(image_path)
    let img_canvas = createCanvas(image.width, image.height)
    let img_ctx = img_canvas.getContext('2d')
    img_ctx.drawImage(image, 0, 0)
    //Count how many times each color appears in the image
    let color_counts = {}
    for(let x = 0; x < image.width; x++){
        for(let y = 0; y < image.height; y++){
            let pixel_data = img_ctx.getImageData(x, y, 1, 1).data
            let color_string = `rgba(${fcol(pixel_data[0])},${fcol(pixel_data[1])},${fcol(pixel_data[2])},${pixel_data[3]})`
            if(!color_counts[color_string]){
                color_counts[color_string] = 0
            }
            color_counts[color_string]++
        }
    }
    //Sort the colors by the most common to least common
    let color_value_pairs = []
    for(let color in color_counts){
        let count = color_counts[color]
        if(!color.includes('rgba(0,0,0') && count > 4 && !color.includes('rgba(255,255,255')){
            color_value_pairs.push({color:color,count:count})
        }
    }
    color_value_pairs.sort((a,b)=>{
        return b.count-a.count
    })
    let top_colors = color_value_pairs.splice(0,Math.min(5,color_value_pairs.length))
    if(top_colors.length == 0){
        return null
    }
    let final_color_scheme = []
    for(i = 0; i < 9; i++){
        if(top_colors[i]){
            final_color_scheme.push(top_colors[i])
        }else{
            let base_color = new complementaryColors(final_color_scheme[final_color_scheme.length-1].color)
            let next_color = base_color.analogous()[1]
            let color_string = `rgb(${next_color.r},${next_color.g},${next_color.b})`
            final_color_scheme.push({color:color_string,count:0})
        }
    }
    return final_color_scheme
}

module.exports = {generate_color_scheme_from_image}