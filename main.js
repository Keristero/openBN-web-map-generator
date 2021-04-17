let path = require('path')
let sanitize = require("sanitize-filename");
let fs = require('fs')

let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator.js')
let TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
let PrefabLoader = require('./prefab-processor/PrefabLoader.js')
let scrape = require('./scrape.js')
let {parseDomainName, replaceBackslashes} = require('./helpers.js')
let generateBackgroundForWebsite = require('./background-generator/main.js')
let prefabLoader = new PrefabLoader()

//URL of website to scrape
let testURL = "https://www.capcom.com/"
let santizedURL = sanitize(testURL)
let domainName = parseDomainName(testURL)

//Paths for temporary files
let path_output = path.join(".","output")
let path_temp_output = path.join(path_output,"temp")
let path_scraped_document = path.join(path_temp_output,"scrape.json")


//Relative paths for server
let path_domain_assets = path.join("assets","domain",santizedURL)

//Paths for final outputs
let path_onb_server = path.join(".","onb-server")
let path_generated_map = path.join(path_onb_server,"areas","default.tmx")
let path_background_output = path.join(path_onb_server,path_domain_assets)
fs.mkdirSync(path_background_output, { recursive: true })

//Properties which will be included in the map.tmx
let server_domain_asset_path = replaceBackslashes(path_domain_assets)
let exampleSiteProperties = {
    "Name":domainName,
    "Background Animation":`/server/${server_domain_asset_path}/background.animation`,
    "Background Texture":`/server/${server_domain_asset_path}/background.png`,
}

let netAreaGenerator = new NetAreaGenerator()

function LetChildrenKnowAboutTheirParents(node){
    let children = node?.features?.children
    if(children){
        for(let child of node?.features?.children){
            child.parent = node
            LetChildrenKnowAboutTheirParents(child)
        }
    }
}

async function main(){
    console.log(`scraping ${testURL}`)
    await scrape(testURL,path_scraped_document,false,true)

    console.log(`generating background animation`)
    await generateBackgroundForWebsite(testURL,"background",path_background_output)

    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
    let prefabs = prefabLoader.prefabs

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(path_scraped_document))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs)

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties)
    await mapExporter.ExportTMX(path_generated_map)

    console.log(`saved generated map as ${path_generated_map}`)
}

main()