const { createCanvas, loadImage } = require("canvas");
const axios = require("axios").default;
const { downloadFile } = require("../helpers");

async function generate_image_board(image_url, asset_path) {
    let input_image_path = `${asset_path}.png`;
    let board_tsx = `${asset_path}.tsx`;
    await downloadFile(image_url, input_image_path);
    let input_image = await loadImage(input_image_path);
    let canvas_board = createCanvas(128, 64);
    let ctx_board = canvas_board.getContext("2d");
    ctx_board.drawImage(input_image, 0, 0, 128, 64);
}

//Test
let textURL = `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/AnthonyRoll-1_Great_Harry.jpg/159px-AnthonyRoll-1_Great_Harry.jpg`;
generate_image_board(textURL, "./test-board");
