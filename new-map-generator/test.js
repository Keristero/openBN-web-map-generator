let {generateRoomPrefabs} = require('./prefabs.js')
let {NetAreaGenerator} = require('./NetAreaGenerator')
let fs = require('fs')


function InitializeMapNodes(node){
    for(let child of node.children){
        child.parent = node
        InitializeMapNodes(child)
    }
}

let exampleSiteData = JSON.parse(fs.readFileSync('./oldFormat.json'))
InitializeMapNodes(exampleSiteData.rootElement)
let netAreaGenerator = new NetAreaGenerator()

async function main(){
    await netAreaGenerator.generateNetArea(exampleSiteData.rootElement)
    console.log('done')
}

main()