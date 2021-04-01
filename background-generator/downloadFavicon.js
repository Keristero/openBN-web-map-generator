const url = require('url');
const fs = require("fs");
const path = require('path');
const axios = require("axios").default;

function parseDomain(linkToWebsite){
    let addr = url.parse(linkToWebsite)
    return addr.host
}

async function downloadFavicon(linkToWebsite,output_path){
    let favicon_address = parseDomain(linkToWebsite)
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

module.exports = {downloadFavicon,parseDomain: parseDomain}