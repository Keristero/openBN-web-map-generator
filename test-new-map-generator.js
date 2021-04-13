let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator.js')
let TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
let {renderMap} = require('./render-map.js')
let PrefabLoader = require('./prefab-processor/PrefabLoader.js')
let scrape = require('./scrape.js')
let generateBackgroundForWebsite = require('./background-generator/main.js')
let prefabLoader = new PrefabLoader()
let fs = require('fs')




let exampleSiteProperties = {
    "Name":"Exampleland"
}

let testURL = "https://keep.google.com/u/0/"
let scrapedDocumentPath = "./test-output/scrape.json"
let exportMapPath = "./prefab-processor/areas/default.tmx"
let testRenderPath = "./test-output/render.png"

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
    await scrape(testURL,scrapedDocumentPath,false,true)

    console.log(`generating background animation`)
    await generateBackgroundForWebsite(testURL,"background","./test-output/")

    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
    let prefabs = prefabLoader.prefabs

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(scrapedDocumentPath))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs)

    /*
    console.log('drawing map...')
    renderMap(netAreaGenerator,testRenderPath)
    */

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties)
    await mapExporter.ExportTMX(exportMapPath)

    console.log(`saved generated map as ${exportMapPath}`)
}

main()