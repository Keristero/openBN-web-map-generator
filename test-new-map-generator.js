let {generateRoomPrefabs} = require('./new-map-generator/generateRoomPrefabs.js')
let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator')
let TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
let {renderMap} = require('./render-map.js')
let PrefabLoader = require('./prefab-processor/PrefabLoader.js')
let scrape = require('./scrape.js')
let prefabLoader = new PrefabLoader()
let fs = require('fs')



let exampleSiteProperties = {
    "Name":"Exampleland"
}

let testURL = "https://megaman.fandom.com/wiki/ElecMan.EXE?li_source=LI&li_medium=wikia-footer-wiki-rec"
let scrapedDocumentPath = "./test-output/scrape.json"
let exportMapPath = "./test-output/output.tmx"
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
    /*
    console.log(`scraping ${testURL}`)
    await scrape(testURL,scrapedDocumentPath)
    */

    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
    let prefabs = prefabLoader.prefabs

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(scrapedDocumentPath))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs)

    console.log('drawing map...')
    renderMap(netAreaGenerator,testRenderPath)

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties)
    await mapExporter.ExportTMX(exportMapPath)

    console.log(`saved generated map as ${exportMapPath}`)
}

main()