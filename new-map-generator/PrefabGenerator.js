let {RNG, generateGrid} = require("./helpers.js")

class PrefabGenerator{
    constructor(){
        this.RNG = new RNG(60902583)
    }
    /**
     * 
     * @param {object} requirements 
     * @param {number} requirements.connectors
     */
    newPrefab(requirements){
        requirements.connectors = requirements.connectors + 1
        requirements.links = requirements.links || 0
        let minArea = 25
        let minWidth = 5
        let minHeight = 5
        let perimeter = 20
        for(let itemName in requirements){
            let itemAmount = requirements[itemName]
            if(itemName == "links"){
                if(itemAmount > 0){
                    let linkArea = itemAmount*5
                    minArea = Math.max(minArea,20 + linkArea + Math.floor(Math.sqrt(linkArea))*2)
                    minWidth = Math.max(minWidth,5)
                    minHeight = Math.max(minHeight,5)

                }
            }
            if(itemName == "connectors"){
                if(itemAmount > 0){
                    perimeter = Math.max(perimeter,5 + Math.ceil(itemAmount/2) * 4)
                }
            }
        }
        perimeter = Math.max(Math.floor(Math.sqrt(minArea))*4,perimeter)
        let squareSideLength = Math.floor(perimeter/4)
        let idealWidth = (Math.floor(squareSideLength/2)*2)+1
        let lowerRangeWidth = Math.ceil(idealWidth*0.7)
        let higherRangeWidth = Math.ceil(idealWidth*1.3)
        let width = this.RNG.UnevenInteger(lowerRangeWidth,higherRangeWidth)
        let maxHeight = (Math.ceil(((perimeter*0.55)-width)/2)*2)+1
        let height = Math.max(minHeight,maxHeight)
        let featureLocations = this.generateListOfValidFeatureLocations(width,height)
        let connectorLocations = this.generateListOfValidConnectorLocations(width,height)
        let prefab = this.generatePrefab(width,height,connectorLocations,featureLocations)
        //console.log(prefab)
        return prefab;
    }
    generatePrefab(width,height,connectorLocations,featureLocations){
        let prefab = {
            total:{connectors:connectorLocations.length,links:featureLocations.length},
            width:width,
            height:height,
            connectors:connectorLocations,
            links:featureLocations
        }
        prefab.grid = generateGrid(width,height,1)
        
        for(let y = 0; y < height; y++){
            for(let x = 0; x < width; x++){
                if(x == 0 || x == width-1 || y == 0 || y == height-1){
                    //if the tile is on the edge, set it to a wall (2)
                    prefab.grid[y][x] = 2
                    for(let location of connectorLocations){
                        if(location.x == x && location.y == y){
                            //If the tile has a connector location, set it back to air
                            prefab.grid[y][x] = 0
                        }
                    }
                }
            }
        }
        return prefab
    }
    generateListOfValidFeatureLocations(width,height){
        let locations = []
        let xRange = Math.floor((width-5)/2)
        let yRange = Math.floor((height-5)/2)
        for(let x = 0; x <= xRange; x++){
            for(let y = 0; y <= yRange; y++){
                locations.push({x:(x*2)+2,y:(y*2)+2})
            }
        }
        return locations
    }
    generateListOfValidConnectorLocations(width,height){
        let locations = []
        let xRange = Math.max(0,Math.ceil((width-5)/2))
        let yRange = Math.max(0,Math.ceil((height-5)/2))
        //top edge
        for(let x = 0; x <= xRange; x++){
            let y = 0
            locations.push({x:(x*2)+2,y:y})
        }
        //bottom edge
        for(let x = 0; x <= xRange; x++){
            let y = height-1
            locations.push({x:(x*2)+2,y:y})
        }
        //left edge
        for(let y = 0; y <= yRange; y++){
            let x = 0
            locations.push({x:x,y:(y*2)+2})
        }
        //right edge
        for(let y = 0; y <= yRange; y++){
            let x = width-1
            locations.push({x:x,y:(y*2)+2})
        }
        return locations
    }
}

//Testing
let testInstance = new PrefabGenerator()
for(var i = 0; i < 20; i++){
    let links = i
    let connectors = 0
    let testPrefab = testInstance.newPrefab({connectors:connectors,links:links})
    if(testPrefab.connectors.length < connectors){
        //console.log(`${testPrefab.connectors.length} / ${connectors} connectors`)
        console.warn("Not enough connectors generated in prefab")
        console.log(`${testPrefab.connectors.length} / ${connectors} connectors`)
    }
    if(testPrefab.links.length < links){
        //console.log(`${testPrefab.connectors.length} / ${connectors} connectors`)
        console.warn("Not enough links generated in prefab")
        console.log(`${testPrefab.links.length} / ${links} links`)
        console.log('width',testPrefab.width,'height',testPrefab.height)
        console.log(testPrefab.grid)
    }
}

module.exports = {PrefabGenerator}