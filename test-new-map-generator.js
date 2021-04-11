let {generateRoomPrefabs} = require('./new-map-generator/generateRoomPrefabs.js')
let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator')
let TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
let {renderMap} = require('./render-map.js')
let PrefabLoader = require('./prefab-processor/PrefabLoader.js')
let prefabLoader = new PrefabLoader()
let fs = require('fs')



let exampleSiteData = JSON.parse(fs.readFileSync('./new-map-generator/document.json'))
let exampleSiteProperties = {
    "Name":"Exampleland"
}
let exportMapPath = "./output.tmx"

LetChildrenKnowAboutTheirParents(exampleSiteData)
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
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')

    console.log('generating map...')
    let prefabs = prefabLoader.prefabs
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs)
    console.log('drawing map...')
    renderMap(netAreaGenerator)
    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties)
    await mapExporter.ExportTMX(exportMapPath)
    console.log(`exported tmx as ${exportMapPath}`)
}

main()