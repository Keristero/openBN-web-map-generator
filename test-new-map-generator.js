let {generateRoomPrefabs} = require('./new-map-generator/prefabs.js')
let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator')
let {renderMap} = require('./render-map.js')
let fs = require('fs')



let exampleSiteData = JSON.parse(fs.readFileSync('./new-map-generator/document.json'))
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
    console.log('generating map...')
    await netAreaGenerator.generateNetArea(exampleSiteData)
    console.log('drawing map...')
    renderMap(netAreaGenerator)
}

main()