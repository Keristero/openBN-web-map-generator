const { create, convert } = require('xmlbuilder2')
const { unstackLayersIntoArray, returnObjectFromArrayWithKeyValue } = require('../helpers.js')
const { featureCategories } = require('../new-map-generator/features')
let { writeFile } = require('fs/promises')

class TiledTMXExporter {
    constructor(){
    }
    GridCoordsToWorldCoords(x, y) {
        let IsoPos = {
            x: x * this.tileHeight,
            y: y * this.tileHeight,
        }
        return IsoPos
    }
    async AddObject(x, y, z, feature) {
        let collection = this.objectLayers[z].objectgroup.object
        let isoCoords = this.GridCoordsToWorldCoords(x, y)
        //console.log(`feature gid = ${feature.tilesetGID}, lid=${feature.tid}`)
        let newObject = {
            '@id': this.nextObjectID,
            '@type': feature.type,
            '@gid': feature.tilesetGID + feature.tid,
            '@x': isoCoords.x + feature.x_spawn_offset,
            '@y': isoCoords.y + feature.y_spawn_offset,
            '@width': feature.width,
            '@height': feature.height,
            '@visible': feature.visible,
            properties: {
                property: [],
            },
        }
        for (let propertyName in feature.properties) {
            newObject.properties.property.push({
                '@name': propertyName,
                '@value': `${feature.properties[propertyName]}`,
            })
        }
        if (feature.onExport) {
            await feature.onExport({ exporter: this, x, y, z, newObject, feature})
        }
        collection.push(newObject)
        this.nextObjectID++
    }
    AddProperty(propertyName, propertyValue) {
        let propertyArray = this.xmlJSON.map['#'][0].properties.property
        let newProp = {
            '@name': `${propertyName}`,
            '@value': `${propertyValue}`,
        }
        propertyArray.push(newProp)
    }
    AddTileset(tileCount, sourcePath, firstgid = this.nextTileGID, forceAdd = false) {
        let tilesetArray = this.xmlJSON.map['#'][1].tileset
        let preexistingTileset = returnObjectFromArrayWithKeyValue(tilesetArray, '@source', sourcePath)
        if (!preexistingTileset !== undefined || forceAdd === true) {
            let newTilesetData = {
                '@firstgid': `${parseInt(firstgid)}`,
                '@source': `${sourcePath}`,
            }
            if (!preexistingTileset) {
                let asset_path = sourcePath.replace('..', '.')
                this.assets.push(asset_path)
                this.assets.push(asset_path.replace('.tsx', '.png'))
            }
            this.nextTileGID = parseInt(firstgid) + tileCount
            tilesetArray.push(newTilesetData)
            //console.log(`[TMXExporter] added tileset ${newTilesetData['@firstgid']}:${newTilesetData['@source']}`)
        } else {
            firstgid = preexistingTileset['@firstgid']
            console.log('there is already a tileset with a matching source', firstgid)
        }
        return firstgid
    }
    AddObjectLayer(layerIndex) {
        let layerArray = this.xmlJSON.map['#']
        let newObjLayer = {
            objectgroup: {
                '@id': `${this.nextLayerID}`,
                '@name': `Objects ${layerIndex}`,
                '@offsetx': `0`,
                '@offsety': `${-((layerIndex - 1) * 16)}`,
                object: [], //We can add the objects here later
            },
        }
        this.nextLayerID++
        this.objectLayers.push(newObjLayer)
        layerArray.push(newObjLayer)
    }
    AddTileLayer(layerIndex, csvData) {
        let layerArray = this.xmlJSON.map['#']
        let newTileLayer = {
            layer: {
                '@id': `${this.nextLayerID}`,
                '@name': `Tiles ${layerIndex}`,
                '@width': this.width,
                '@height': this.length,
                '@offsetx': `0`,
                '@offsety': `${-((layerIndex - 1) * 16)}`,
                data: {
                    '@encoding': 'csv',
                    '#': csvData,
                },
            },
        }
        this.nextLayerID++
        this.tileLayers.push(newTileLayer)
        layerArray.push(newTileLayer)
    }
    async ExportTMX(NetArea, p_properties,path) {
        this.height = NetArea.height
        this.length = NetArea.length
        this.width = NetArea.width
        this.tileHeight = 32
        this.tileWidth = 64
        this.tileHalfHeight = this.tileHeight / 2
        this.tileHalfWidth = this.tileWidth / 2
        this.nextTileGID = 1
        this.nextLayerID = 1
        this.nextObjectID = 1

        this.tileLayers = []
        this.objectLayers = []
        this.assets = []

        //Default properties
        let properties = {
            Background: `custom`,
            'Background Animation': `/server/assets/background.animation`,
            'Background Texture': `/server/assets/background.png`,
            'Background Vel X': 0.3,
            'Background Vel Y': 0.3,
            Name: '??? Area',
            Song: 'resources/loops/undernet.ogg',
            'Generation Date': `${Date.now()}`,
        }
        //Copy and overwrite defaults
        Object.assign(properties, p_properties)

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
                    nextobjectid: '216',
                },
                '#': [
                    {
                        properties: {
                            property: [],
                        },
                    },
                    {
                        tileset: [],
                    },
                ],
            },
        }

        //Create tilesets
        for (let firstGID in NetArea.tile_types) {
            let tileInfo = NetArea.tile_types[firstGID]
            this.AddTileset(tileInfo.tileCount, tileInfo.sourcePath, firstGID, true)
        }

        this.nextTileGID++

        //Create tilesets from features
        for (let featureCategoryName in featureCategories) {
            if (featureCategoryName === 'unplaced') {
                continue
            }

            let featureCategory = featureCategories[featureCategoryName]
            for (let featureName in featureCategory) {
                let feature = featureCategory[featureName]
                let featureClass = feature.className
                let tsxTileCount = featureClass.tsxTileCount
                let tilesetGID = this.AddTileset(tsxTileCount, featureClass.tsxPath)
                featureClass.tilesetGID = tilesetGID
            }
        }

        //Create properties
        for (let propertyName in properties) {
            let propertyValue = properties[propertyName]
            this.AddProperty(propertyName, propertyValue)
        }

        //Create layers
        for (let grid of NetArea.matrix) {
            let flatArr = unstackLayersIntoArray(grid)
            let csv = flatArr.join(',')
            let tileLayerIndex = this.tileLayers.length + 1
            this.AddTileLayer(tileLayerIndex, csv)

            let objectLayerIndex = this.objectLayers.length + 1
            this.AddObjectLayer(objectLayerIndex)
        }

        //Create objects
        //let object_creation_promises = []
        for (let z in NetArea.features) {
            for (let y in NetArea.features[z]) {
                for (let x in NetArea.features[z][y]) {
                    let promise = await this.AddObject(x, y, z, NetArea.features[z][y][x])
                    //object_creation_promises.push(promise)
                }
            }
        }
        //await Promise.all(object_creation_promises)
        const doc = create({ version: '1.0' }, this.xmlJSON).end({
            prettyPrint: true,
        })
        writeFile(path, doc)
        return this.assets
    }
}

module.exports = TiledTMXExporter
