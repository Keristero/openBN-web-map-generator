const fs = require("fs");
const path = require('path');
const axios = require("axios").default;
const url =require('url')

async function downloadFavicon(linkToWebsite,output_path){
    
    let web_address = url.parse(linkToWebsite)
    let favicon_address = web_address.hostname
    let faviconToPNGApiAddr = `https://www.google.com/s2/favicons?domain=${favicon_address}`
    let response = await axios.get(faviconToPNGApiAddr,{responseType:'stream'})
    let writer = fs.createWriteStream(output_path)
    response.data.pipe(writer)
    console.log(`downloading ${faviconToPNGApiAddr}`)
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

module.exports = {downloadFavicon}