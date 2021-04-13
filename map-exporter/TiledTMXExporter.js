const { create, convert } = require('xmlbuilder2');
const {unstackLayersIntoArray} = require('../helpers.js')
const {tiled_tileTypes} = require('../prefab-processor/Prefab')
let { writeFile } = require('fs/promises')

class TiledTMXExporter {
    constructor(NetArea, p_properties) {
        this.width = NetArea.width
        this.length = NetArea.length
        this.height = NetArea.height
        this.tileHeight = 32
        this.tileWidth = 64
        this.tileHalfHeight = this.tileHeight/2
        this.tileHalfWidth = this.tileWidth/2
        this.nextTileGID = 1
        this.nextLayerID = 1
        this.nextObjectID = 1

        this.tileLayers = []
        this.objectLayers = []

        //Default properties
        let properties = {
            "Background":`custom`,
            "Background Animation":`/server/assets/background.animation`,
            "Background Texture":`/server/assets/background.png`,
            "Background Vel X":0.3,
            "Background Vel Y":0.3,
            "Name":"??? Area",
            "Song":"resources/loops/undernet.ogg",
        }
        //Copy and overwrite defaults
        Object.assign(properties,p_properties)

        this.xmlJSON = {
            map: {
                '@': {
                    version: '1.5',
                    tiledversion: '1.5.0',
                    orientation: 'isometric',
                    renderorder: 'right-down',
                    compressionlevel: '0',
                    width: this.width,
                    height: this.length,
                    tilewidth: '64',
                    tileheight: '32',
                    infinite: '0',
                    nextlayerid: this.height * 2,
                    nextobjectid: '216'
                },
                "#":[
                    {
                       properties:{
                          property:[]
                       }
                    },
                    {
                        "tileset":[]
                    }
                ]
            }
        }

        //Create tilesets
        for(let filename in tiled_tileTypes){
            let tileTypeData = tiled_tileTypes[filename]
            let firstGID = tileTypeData?.subIndex[0]?.id
            if(firstGID){
                let tileCount = Object.keys(tileTypeData.subIndex).length
                let sourcePath = `../assets/tiles/${filename}.tsx`
                this.AddTileset(tileCount,sourcePath,firstGID)
            }
        }

        //Add defined tilesets, check features for the gids
        //TODO dont hardcode these
        let linkGID = 100
        this.AddTileset(2,`../assets/tiles/ground_feature.tsx`,linkGID)
        let wallFeatureGID = 110
        this.AddTileset(2,`../assets/tiles/wall_feature.tsx`,wallFeatureGID)
        let homeWarpGID = 120
        this.AddTileset(4,`../assets/tiles/home_warp.tsx`,homeWarpGID)

        //Create properties
        for(let propertyName in properties){
            let propertyValue = properties[propertyName]
            this.AddProperty(propertyName,propertyValue)
        }

        //Create layers
        for(let grid of NetArea.matrix){
            let flatArr = unstackLayersIntoArray(grid)
            let csv = flatArr.join(',')
            let tileLayerIndex = this.tileLayers.length+1
            this.AddTileLayer(tileLayerIndex,csv)

            let objectLayerIndex = this.objectLayers.length+1
            this.AddObjectLayer(objectLayerIndex)
        }

        //Create objects
        for(let z in NetArea.features){
            for(let y in NetArea.features[z]){
                for(let x in NetArea.features[z][y]){
                    this.AddObject(x,y,z,NetArea.features[z][y][x])
                }
            }
        }
    }
    OrthoToIsoCoordinates(x,y){
        let IsoPos = {
            x:(x*this.tileHeight)+this.tileHeight,
            y:(y*this.tileHeight)+this.tileHeight
        }
        return IsoPos
    }
    AddObject(x,y,z,feature){
        let collection = this.objectLayers[z].objectgroup.object
        let isoCoords = this.OrthoToIsoCoordinates(x,y)
        let newObject = {
            "@id":this.nextObjectID,
            "@type":feature.type,
            "@gid":feature.gid,
            "@x":isoCoords.x,
            "@y":isoCoords.y,
            "@width":feature.width,
            "@height":feature.height,
            "properties":{
                "property":[]
            }
        }
        for(let propertyName in feature.properties){
            newObject.properties.property.push({
                "@name":propertyName,
                "@value":`${feature.properties[propertyName]}`
            })
        }
        collection.push(newObject)
        this.nextObjectID++
    }
    AddProperty(propertyName,propertyValue){
        let propertyArray =  this.xmlJSON.map['#'][0].properties.property
        let newProp = {
            "@name":`${propertyName}`,
            "@value":`${propertyValue}`
        }
        propertyArray.push(newProp)
    }
    AddTileset(tileCount,sourcePath,firstgid=this.nextTileGID){
        let tilesetArray = this.xmlJSON.map['#'][1].tileset
        let newTilesetData = {
            "@firstgid":`${firstgid}`,
            "@source":`${sourcePath}`
        }
        this.nextTileGID = firstgid+tileCount
        tilesetArray.push(newTilesetData)
        console.log(`[TMXExporter] added tileset ${newTilesetData["@source"]}`)
    }
    AddObjectLayer(layerIndex){
        let layerArray = this.xmlJSON.map['#']
        let newObjLayer = {
            objectgroup:{
                "@id":`${this.nextLayerID}`,
                "@name":`Objects ${layerIndex}`,
                "@offsetx":`0`,
                "@offsety":`${-((layerIndex-1)*16)}`,
                "object":[]//We can add the objects here later
            }
        }
        this.nextLayerID++
        this.objectLayers.push(newObjLayer)
        layerArray.push(newObjLayer)
    }
    AddTileLayer(layerIndex,csvData){
        let layerArray = this.xmlJSON.map['#']
        let newTileLayer = {
            layer:{
                "@id":`${this.nextLayerID}`,
                "@name":`Tiles ${layerIndex}`,
                "@width":this.width,
                "@height":this.length,
                "@offsetx":`0`,
                "@offsety":`${-((layerIndex-1)*16)}`,
                "data":{
                   "@encoding":"csv",
                   "#":csvData
                }
            }
        }
        this.nextLayerID++
        this.tileLayers.push(newTileLayer)
        layerArray.push(newTileLayer)
    }
    async ExportTMX(path) {
        const doc = create({ version: '1.0' }, this.xmlJSON).end({ prettyPrint: true });
        writeFile(path,doc)
    }
}

module.exports = TiledTMXExporter