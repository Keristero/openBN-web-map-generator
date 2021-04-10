let {RNG, generateGrid, generate3dMatrix} = require("./helpers.js")

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
        let minLength = 5
        let perimeter = 20
        for(let itemName in requirements){
            let itemAmount = requirements[itemName]
            if(itemName == "links"){
                if(itemAmount > 0){
                    let linkArea = itemAmount*5
                    minArea = Math.max(minArea,20 + linkArea + Math.floor(Math.sqrt(linkArea))*2)
                    minWidth = Math.max(minWidth,5)
                    minLength = Math.max(minLength,5)

                }
            }
            if(itemName == "connectors"){
                if(itemAmount > 0){
                    perimeter = Math.max(perimeter,5 + Math.ceil(itemAmount/2) * 4)
                }
            }
        }
        let height = 3

        perimeter = Math.max(Math.floor(Math.sqrt(minArea))*4,perimeter)
        let squareSideLength = Math.floor(perimeter/4)
        let idealWidth = (Math.floor(squareSideLength/2)*2)+1
        let lowerRangeWidth = Math.ceil(idealWidth*0.7)
        let higherRangeWidth = Math.ceil(idealWidth*1.3)
        let width = this.RNG.UnevenInteger(lowerRangeWidth,higherRangeWidth)
        let maxLength = (Math.ceil(((perimeter*0.55)-width)/2)*2)+1
        let length = Math.max(minLength,maxLength)
        let featureLocations = this.generateListOfValidFeatureLocations(width,length)
        let connectorLocations = this.generateListOfValidConnectorLocations(width,length)
        let prefab = this.generatePrefab(width,length,height,connectorLocations,featureLocations)
        //console.log(prefab)
        return prefab;
    }
    generatePrefab(width,length,height,connectorLocations,featureLocations){
        let prefab = {
            total:{connectors:connectorLocations.length,links:featureLocations.length},
            width:width,
            length:length,
            height:height,
            connectors:connectorLocations,
            links:featureLocations
        }
        prefab.grid = generate3dMatrix(width,length,height,1)
        
        let overrideID = undefined
        for(let z = 0; z < height; z++){
            if(z != 0){
                overrideID = 0
                //Make all tiles above layer 0 air for now
            }
            for(let y = 0; y < length; y++){
                for(let x = 0; x < width; x++){
                    if(x == 0 || x == width-1 || y == 0 || y == length-1){
                        //if the tile is on the edge, set it to a wall (2)
                        prefab.grid[z][y][x] = 2
                        for(let location of connectorLocations){
                            if(location.x == x && location.y == y){
                                //If the tile has a connector location, set it back to air
                                prefab.grid[z][y][x] = 0
                            }
                        }
                        if(overrideID !== undefined){
                            prefab.grid[z][y][x] = overrideID
                        }
                    }
                }
            }
        }
        return prefab
    }
    generateListOfValidFeatureLocations(width,length){
        let locations = []
        let xRange = Math.floor((width-5)/2)
        let yRange = Math.floor((length-5)/2)
        let z = 0
        for(let x = 0; x <= xRange; x++){
            for(let y = 0; y <= yRange; y++){
                locations.push({x:(x*2)+2,y:(y*2)+2,z:z})
            }
        }
        return locations
    }
    generateListOfValidConnectorLocations(width,length){
        let locations = []
        let xRange = Math.max(0,Math.ceil((width-5)/2))
        let yRange = Math.max(0,Math.ceil((length-5)/2))
        let z = 0
        //top edge
        for(let x = 0; x <= xRange; x++){
            let y = 0
            locations.push({x:(x*2)+2,y:y,z:z})
        }
        //bottom edge
        for(let x = 0; x <= xRange; x++){
            let y = length-1
            locations.push({x:(x*2)+2,y:y,z:z})
        }
        //left edge
        for(let y = 0; y <= yRange; y++){
            let x = 0
            locations.push({x:x,y:(y*2)+2,z:z})
        }
        //right edge
        for(let y = 0; y <= yRange; y++){
            let x = width-1
            locations.push({x:x,y:(y*2)+2,z:z})
        }
        return locations
    }
}

module.exports = {PrefabGenerator}