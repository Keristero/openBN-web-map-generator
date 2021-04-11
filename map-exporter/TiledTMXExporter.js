const { create, convert } = require('xmlbuilder2');
const {unstackLayersIntoArray} = require('../new-map-generator/helpers.js')
const {tiled_tileTypes} = require('../prefab-processor/Prefab')
let { writeFile } = require('fs/promises')

class TiledTMXExporter {
    constructor(NetArea, p_properties) {
        this.width = NetArea.width
        this.length = NetArea.length
        this.height = NetArea.height
        this.totalObjects = this.CountFeatures(NetArea)
        this.nextTileGID = 1
        this.nextLayerID = 1
        console.log(`counted ${this.totalObjects} features`)

        this.tileLayers = []
        this.objectLayers = []

        //Default properties
        let properties = {
            "Background":`undernet`,
            "Background Animation":``,
            "Background Texture":``,
            "Background Vel X":0.3,
            "Background Vel Y":0.3,
            "Name":"??? Area",
            "Song":"/resources/loops/undernet.ogg",
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
                let sourcePath = `./tiles/${filename}.tsx`
                this.AddTileset(tileCount,sourcePath,firstGID)
            }
        }

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
    CountFeatures(NetArea) {
        let sum = 0
        for (let collectionName in NetArea.features) {
            sum += NetArea.features[collectionName].length
        }
        return sum
    }
    async ExportTMX(path) {
        const doc = create({ version: '1.0' }, this.xmlJSON).end({ prettyPrint: true });
        writeFile(path,doc)
    }
}

module.exports = TiledTMXExporter