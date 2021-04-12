let {generateGrid, iterateOverGrid, stackArrayIntoLayers } = require('../new-map-generator/helpers.js')

let tiled_tileTypes = {
    "prefab_tiles": {
        subIndex: {
            0: { type: "Tile", name: "Wall", id: 1 },
            1: { type: "Tile", name: "Ground Tile 1", id: 2 },
            2: { type: "Tile", name: "Ground Tile 2", id: 3 },
            3: { type: "Tile", name: "Ground Tile 3", id: 4 }
        }
    },
    "path-tiles": {
        subIndex: {
            0: { type: "Tile", name: "Normal Path", id: 5 },
            1: { type: "Tile", name: "Important Path", id: 6 },
        }
    },
    "connection": {
        subIndex: {
            0: { type: "Feature", name: "Connection",collection: "connections"},
        }
    },
    "ground_feature": {
        subIndex: {
            0: { type: "Feature", name: "GroundFeature",collection: "groundFeatures", Direction:"Up Left"},
            1: { type: "Feature", name: "GroundFeature",collection: "groundFeatures", Direction:"Up Right"},
            2: { type: "Feature", name: "GroundFeature",collection: "groundFeatures", Direction:"Down Right"},
            3: { type: "Feature", name: "GroundFeature",collection: "groundFeatures", Direction:"Down Left"},
        }
    },
    "home_warp": {
        subIndex: {
            0: { type: "Feature", name: "HomeWarp",collection: "groundFeatures", Direction:"Up Left"},
            1: { type: "Feature", name: "HomeWarp",collection: "groundFeatures", Direction:"Up Right"},
            2: { type: "Feature", name: "HomeWarp",collection: "groundFeatures", Direction:"Down Right"},
            3: { type: "Feature", name: "HomeWarp",collection: "groundFeatures", Direction:"Down Left"},
        }
    },
    "wall_feature": {
        subIndex: {
            0: { type: "Feature", name: "WallFeature",collection: "wallFeatures",Direction:"Down Right"},
            1: { type: "Feature", name: "WallFeature",collection: "wallFeatures",Direction:"Down Left"},
        }
    },
    "forward-stairs": {
        subIndex: {
            0: { type: "Tile", name: "Forward-Middle-Left", id: 7, flippedid:8,Direction:"Up Left"},
            1: { type: "Tile", name: "Forward-Middle-Right", id: 8, flippedid:7,Direction:"Up Right"},
            2: { type: "Tile", name: "Forward-Top-Left", id: 9, flippedid:10,Direction:"Up Left"},
            3: { type: "Tile", name: "Forward-Top-Right", id: 10, flippedid:9,Direction:"Up Right"},
        }
    },
    "back-stairs": {
        subIndex: {
            0: { type: "Tile", name: "Backward-Base-Left", id: 11},
            1: { type: "Tile", name: "Backward-Base-Right", id: 12},
            2: { type: "Tile", name: "Backward-Middle-Left", id: 13},
            3: { type: "Tile", name: "Backward-Middle-Right", id: 14},
            4: { type: "Tile", name: "Backward-Top-Left", id: 15},
            5: { type: "Tile", name: "Backward-Top-Right", id: 16},
        }
    },
}

class Prefab{
    constructor(){
        this.features = {
            connections:[],
            groundFeatures:[],
            wallFeatures:[]
        }
        this.totalFeatures = 0
        this.matrix = []
        this.properties = {
            "Autofill Walls":true,//Fill air with invisible walls
            "Entrance Room":false,//Should this be used as a map entry warp
            "Mirror Variations":false,
            "Random Selection Weighting":10,
            "Rotation Variations":false,
            "Shuffle Tile Variations":true,
            "Theme Set":false,
            "Stairs":false,//This prefab is a flight of stairs
            "Direction":null,//Direction of stairs
        }
    }
    get width(){
        return this.matrix[0][0].length
    }
    get length(){
        return this.matrix[0].length
    }
    get height(){
        return this.matrix.length
    }
    static Tiled_GeneratePrefab(unprocessed_prefab) {
        let data = unprocessed_prefab.data

        //First make a mapping of tilesets in this .tmx prefab to the IDS used internally
        //In the map generator
        let tileMapping = this.Tiled_createTileMapping(data.tilesets,tiled_tileTypes)

        let newPrefab = new Prefab()

        for (let layer of data.layers) {
            let layerZ = parseInt(layer.name[layer.name.length - 1])-1
            if (layer.name.includes("Feature")) {
                this.Tiled_process_feature_layer(layer, layerZ, tileMapping, newPrefab)
            }
            if (layer.name.includes("Tile")) {
                this.Tiled_process_tile_layer(layer, layerZ, tileMapping, newPrefab)
            }
        }

        //Override default properties
        for(let property of data.properties){
            let {name,value} = property
            newPrefab.properties[name] = value
        }

        //console.log("Generated prefab from tiled",newPrefab)
        return newPrefab
    }
    AddMatrixLayer(gridLayer){
        this.matrix.push(gridLayer)
    }
    AddFeature(featureCollectionName,x,y,z,properties){
        let newFeatureData = {x,y,z,properties}
        this.features[featureCollectionName].push(newFeatureData)
        this.totalFeatures++
        console.log("Added feature",newFeatureData,"To",featureCollectionName)
    }
    static Tiled_createTileMapping(prefab_tilesets,tiled_tileTypes){
        let tileMapping = {}
        for(let tileTypeKey in tiled_tileTypes){
            let tileType = tiled_tileTypes[tileTypeKey]
            for(let tileset of prefab_tilesets){
                let tileset_firstgid = parseInt(tileset.firstgid)
                let tileset_path = tileset.source
                if(tileset_path.includes(tileTypeKey)){
                    for(let relativeId in tileType.subIndex){
                        let subTileData = tileType.subIndex[relativeId]
                        let gid = tileset_firstgid+parseInt(relativeId)
                        tileMapping[gid] = subTileData
                    }
                }
            }
        }
        return tileMapping
    }
    static Tiled_process_tile_layer(layer,layerZ,tileMapping,prefab) {
        let grid = stackArrayIntoLayers(layer.data, layer.width, layer.height)
        let outputGrid = generateGrid(layer.width,layer.height,1)
        let iterator = iterateOverGrid(grid)
        for (const gridPos of iterator) {
            if(gridPos.tileID != 0){
                let tiled_tileInfo = this.Tiled_parse_tid(gridPos.tileID)
                let mapped_tile_info = tileMapping[tiled_tileInfo.id]
                if(mapped_tile_info.type == "Tile"){
                    let {x,y} = gridPos
                    outputGrid[y][x] = mapped_tile_info.id
                }
                //TODO finish this bit
            }
        }
        prefab.AddMatrixLayer(outputGrid)
    }
    static Tiled_process_feature_layer(layer,layerZ,tileMapping,prefab) {
        let grid = stackArrayIntoLayers(layer.data, layer.width, layer.height)
        let iterator = iterateOverGrid(grid)
        for (const gridPos of iterator) {
            if(gridPos.tileID != 0){
                let tiled_tileInfo = this.Tiled_parse_tid(gridPos.tileID)
                let mapped_tile_info = tileMapping[tiled_tileInfo.id]
                if(mapped_tile_info.type == "Feature"){
                    let {x,y} = gridPos
                    let tileProperties = {}
                    if(mapped_tile_info.Direction){
                        tileProperties.Direction = mapped_tile_info.Direction
                    }
                    prefab.AddFeature(mapped_tile_info.collection,x,y,layerZ,tileProperties)
                }
            }
        }
    }
    static Tiled_parse_tid(tid){
        /* Tiled map editor encodes the flipping of tiles in a number using binary
        https://doc.mapeditor.org/en/stable/reference/tmx-map-format/
        */
        let binary = tid.toString(2).padStart(32,"0")
        let xFlipped = binary[0] === "1"
        let yFlipped = binary[1] === "1"
        let diagonallyFlipped = binary[2] === "1"
        let id = parseInt(binary.substr(3,binary.length),2)
        let tiledTileInfo = {
            id,
            xFlipped,
            yFlipped,
            diagonallyFlipped
        }
        return tiledTileInfo
    }
}

module.exports = {Prefab,tiled_tileTypes}