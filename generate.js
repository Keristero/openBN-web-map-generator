const path = require('path')
const sanitize = require("sanitize-filename");
const fs = require('fs')

const {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator.js')
const TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
const {generateNetAreaAssets} = require('./map-exporter/generateAssets.js')
const PrefabLoader = require('./prefab-processor/PrefabLoader.js')
const scrape = require('./scrape.js')
const {replaceBackslashes,RNG} = require('./helpers.js')
const generateBackgroundForWebsite = require('./background-generator/main.js')
const crypto = require('crypto')
const url = require('url')
const songs = ["boundless-network.ogg","digital-strider.ogg","global-network.ogg","internet-world.ogg","life-in-the-network.ogg","network-is-spreading.ogg","network-space.ogg"]
let prefabLoader = new PrefabLoader()

async function load(){
    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
}

load()

async function generate(site_url,isHomePage = false){
    //URL of website to scrape
    let hashed_url = crypto.createHash('sha256').update(site_url, 'utf8').digest('hex');
    let web_address = url.parse(site_url)
    let hostname = web_address.hostname
    let hashed_hostname = crypto.createHash('sha256').update(hostname, 'utf8').digest('hex');

    if(isHomePage){
        hashed_url = "default"
        hostname = "Net_Square"
    }

    //Paths for temporary files
    let path_output = path.join(".","output")
    let path_temp_output = path.join(path_output,"temp")
    let path_scraped_document = path.join(path_temp_output,"scrape.json")


    //Relative paths for server
    let path_domain_assets = path.join("assets","domain",hostname)

    //Paths for final outputs
    let path_onb_server = path.join(".","onb-server")
    let path_generated_map = path.join(path_onb_server,"areas",`${hashed_url}.tmx`)
    let path_generated_tiles = path.join(path_onb_server,"assets","generated")
    let path_music = path.join("assets","shared","music")
    let path_background_output = path.join(path_onb_server,path_domain_assets)
    let relative_server_music_path = path_music.substring(path_music.indexOf('/') + 1);
    let relative_server_map_path = replaceBackslashes(path_generated_map)
    relative_server_map_path = relative_server_map_path.substring(relative_server_map_path.indexOf('/') + 1);
    fs.mkdirSync(path_background_output, { recursive: true })

    //Check if map already exists
    let map_already_exists = fs.existsSync(path_generated_map)
    if(map_already_exists){
        let result = {
            area_path:relative_server_map_path,
            area_id:hashed_url,
            fresh:false
        }
        return result
    }

    //Properties which will be included in the map.tmx
    let server_domain_asset_path = replaceBackslashes(path_domain_assets)
    let site_properties = {
        "Name":hostname,
        "URL":site_url,
        "Background Animation":`/server/${server_domain_asset_path}/background.animation`,
        "Background Texture":`/server/${server_domain_asset_path}/background.png`,
    }

    let random = new RNG(parseInt(hashed_hostname, 16))
    site_properties["Song"] = `/server/${replaceBackslashes(path.join(relative_server_music_path,songs[random.Integer(0,songs.length-1)]))}`

    let netAreaGenerator = new NetAreaGenerator()
    
    console.log(`scraping ${site_url}`)
    await scrape(site_url,path_scraped_document,false,true)

    if(!isHomePage){
        console.log(`generating background animation`)
        await generateBackgroundForWebsite(site_url,"background",path_background_output)
    }else{
        site_properties["Background"] = "misc"
    }

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(path_scraped_document))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabLoader.prefabs,isHomePage)

    console.log(`generating assets for map and remapping tiles`)
    let generated_tiles = await generateNetAreaAssets(netAreaGenerator,path_generated_tiles)

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,site_properties,generated_tiles)
    let tilesets = await mapExporter.ExportTMX(path_generated_map)

    console.log(`saved generated map as ${path_generated_map}`)


    let result = {
        area_path:relative_server_map_path,
        area_id:hashed_url,
        assets:tilesets,
        fresh:true
    }
    return result
}

function LetChildrenKnowAboutTheirParents(node){
    let children = node?.features?.children
    if(children){
        for(let child of node?.features?.children){
            child.parent = node
            LetChildrenKnowAboutTheirParents(child)
        }
    }
}

module.exports = generate