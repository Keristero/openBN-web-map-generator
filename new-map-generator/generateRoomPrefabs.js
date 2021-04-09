let {PrefabGenerator} = require('./PrefabGenerator.js')

function generateRoomPrefabs(maxConnectors=1000,maxLinks=1000){
    let prefabGenerator = new PrefabGenerator()
    for(let connectors = 0; connectors < maxConnectors; connectors*=2){
        for(let links = 0; links < maxLinks; links*=2){
            let newPrefab = prefabGenerator.newPrefab({connectors:connectors,links:links})
            roomPrefabs.push(newPrefab)
            if(links == 0){
                links = 0.5
            }
        }
        if(connectors == 0){
            connectors = 0.5
        }
    }
    console.log(roomPrefabs)
    
    roomPrefabs.sort((a,b)=>{
        let sumA = (a.total.connectors || 0) + (a.total.links || 0)
        let sumB = (b.total.connectors || 0) + (b.total.links || 0)
        if(sumA < sumB){
            return -1
        }
        if(sumA > sumB){
            return 1
        }
        return 0
    })
}

module.exports = {generateRoomPrefabs}