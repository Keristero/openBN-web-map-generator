let { NetAreaRoom } = require('./NetAreaRoom.js')
let { generateGrid, distance, RNG, generate3dMatrix, iterateOver3dMatrix, trim3dMatrix } = require('../helpers')
let tiled_tileTypes = require('./default_tiles')
let EasyStar = require('easystarjs')
let easystar = new EasyStar.js()

class NetAreaGenerator {
    constructor() {
        this.width = 500
        this.length = 500
        this.height = 30
        this.matrix = generate3dMatrix(this.width, this.length, this.height)
        this.arr_rooms = []
        this.arr_paths = []
        this.arr_queue = []
        this.features = {}
        this.RNG = new RNG(60902583)

        this.id_air = 0
        this.id_wall = 1
        this.id_floor_1 = 2
        this.id_floor_2 = 3
        this.id_floor_3 = 4
        this.id_path = 5
        this.id_importantPath = 6

        //Set up default tiles (by default use tileset from the prefab processor)
        this.tile_types = {}
        for (let filename in tiled_tileTypes) {
            let tileTypeData = tiled_tileTypes[filename]
            let firstGID = tileTypeData?.subIndex[0]?.id
            if (firstGID) {
                let tileCount = Object.keys(tileTypeData.subIndex).length
                let sourcePath = `../assets/shared/tiles/${filename}.tsx`
                this.tile_types[firstGID] = { tileCount, sourcePath }
            }
        }

        //Tiles paths are allowed to replace
        this.replacableTiles = [this.id_air, this.id_wall, this.id_path]
        //Tiles which can be pathfinded through
        this.walkableTiles = [
            this.id_air,
            this.id_wall,
            this.id_floor_1,
            this.id_floor_2,
            this.id_floor_3,
            this.id_path,
            this.id_importantPath,
        ]

        //Setup easystar
        easystar.setAcceptableTiles(this.walkableTiles)
        easystar.setTileCost(this.id_air, 4) //Going through empty area
        easystar.setTileCost(this.id_wall, 128) //Going through WALLS
        easystar.setTileCost(this.id_floor_1, 32) //Going through rooms
        easystar.setTileCost(this.id_floor_2, 32) //Going through rooms
        easystar.setTileCost(this.id_floor_3, 32) //Going through rooms
        easystar.setTileCost(this.id_path, 2) //Going along paths
        easystar.setTileCost(this.id_importantPath, 1) //Going along important paths

        //Options
        this.maximumPathFindingAttempts = 1 //If pathfinding is failing, raising may help
        this.oneUseConnectors = false //Improves look, but increases failure rate
        this.allowLayerGeneration = true //Allow generation to add new layers as required, can be a bit crazy...
    }
    async generateNetArea(startingNode, isHomePage) {
        this.isHomePage = isHomePage
        startingNode.isFirstNode = true
        this.arr_queue = [startingNode]
        console.log(`processing node queue`)
        await this.processNodeQueue()
        //console.log(`removing walls`)
        this.removeAllWalls()
        let trimmed = trim3dMatrix(this.matrix, this.id_air)
        this.width = trimmed.width
        this.length = trimmed.length
        this.height = trimmed.height
        this.matrix = trimmed.matrix
        let updatedOffsets = { x: trimmed.x, y: trimmed.y, z: trimmed.z }
        this.copyFeaturesOfRoomsToArea(updatedOffsets)
    }
    removeAllWalls() {
        const iterator = iterateOver3dMatrix(this.matrix)
        for (const gridPos of iterator) {
            if (gridPos.tileID === this.id_wall) {
                this.matrix[gridPos.z][gridPos.y][gridPos.x] = this.id_air
            }
        }
    }
    roomPlacementValid(room) {
        return this.areaIsClear(
            room.x,
            room.y,
            room.z,
            room.x + room.prefab.width,
            room.y + room.prefab.length,
            room.z + room.prefab.height
        )
    }
    areaIsClear(startX, startY, startZ, endX, endY, endZ) {
        const iterator = iterateOver3dMatrix(this.matrix, startX, startY, startZ, endX, endY, endZ)
        for (const gridPos of iterator) {
            if (gridPos.tileID !== 0) {
                return false
            }
        }
        return true
    }
    copyRoomFeatures(room) {
        //Burn features
        for (let featureType in room.features) {
            let featuresOfType = room.features[featureType]
            for (let locationString in featuresOfType) {
                let feature = featuresOfType[locationString]
                this.addFeature(room, feature)
            }
        }
    }
    burnRoomToMatrix(room) {
        //Burn layout
        const iterator = iterateOver3dMatrix(room.prefab.matrix)
        for (let gridPos of iterator) {
            if (gridPos.tileID != 0) {
                //make coordinates global
                const globalX = room.x + gridPos.x
                const globalY = room.y + gridPos.y
                const globalZ = room.z + gridPos.z
                this.matrix[globalZ][globalY][globalX] = gridPos.tileID
            }
        }
    }
    addExclusionZoneAboveRoom(room){
        //Burn layout
        const iterator = iterateOver3dMatrix(room.prefab.matrix)
        for (let gridPos of iterator) {
            if (gridPos.tileID != 0) {
                if(gridPos.z == room.prefab.height-1){
                    const globalX = room.x + gridPos.x
                    const globalY = room.y + gridPos.y
                    const globalZ = room.z + gridPos.z
                    for(let i = 1; i+globalZ < this.height; i++){
                        const x = globalX+Math.floor(i/2)
                        const y = globalY+Math.floor(i/2)
                        if(x > this.width || y > this.length){
                            break
                        }
                        if(this.matrix[i+globalZ][globalY][globalX] == 0){
                            this.matrix[i+globalZ][globalY][globalX] = 1
                        }
                    }
                }
                //make coordinates global
                const globalX = room.x + gridPos.x
                const globalY = room.y + gridPos.y
                const globalZ = room.z + gridPos.z
                this.matrix[globalZ][globalY][globalX] = gridPos.tileID
            }
        }
    }
    addLayers(amount) {
        for (let i = 0; i < amount; i++) {
            let newLayer = generateGrid(this.width, this.length)
            this.matrix.push(newLayer)
        }
        this.height += amount
    }
    addFeature(fromRoom, newFeature) {
        let x = fromRoom.x + newFeature.x
        let y = fromRoom.y + newFeature.y
        let z = fromRoom.z + newFeature.z
        //console.log(newFeature)
        if (!this.features[z]) {
            this.features[z] = {}
        }
        if (!this.features[z][y]) {
            this.features[z][y] = {}
        }
        this.features[z][y][x] = newFeature
    }
    async processNodeQueue() {
        while (this.arr_queue.length > 0) {
            //console.log(`queue length ${this.arr_queue.length}`)
            let currentNode = this.arr_queue.shift()
            this.addNodesChildrenToQueue(currentNode)
            await this.generateLayout(currentNode)
        }
    }
    addNodesChildrenToQueue(node) {
        let children = node?.features?.children
        if (children) {
            children = children.sort((a, b) => {
                //Sort ascending
                let childrenA = a?.features?.children?.length
                let childrenB = b?.features?.children?.length
                if (childrenA < childrenB) {
                    return -1
                }
                if (childrenA > childrenB) {
                    return 1
                }
                return 0
            })
            for (let childNode of children) {
                this.arr_queue.push(childNode)
            }
        }
    }
    copyFeaturesOfRoomsToArea(updatedOffsets) {
        for (let room of this.arr_rooms) {
            room._x -= updatedOffsets.x
            room._y -= updatedOffsets.y
            room._z -= updatedOffsets.z
            this.copyRoomFeatures(room)
        }
    }
    /**
     *
     * @param {*} node
     */
    async generateLayout(node) {
        let newRoom = new NetAreaRoom(node, this)
        let roomUnplaced = true
        let attempts = 0
        while (roomUnplaced) {
            if (this.roomPlacementValid(newRoom)) {
                this.burnRoomToMatrix(newRoom)
                this.addExclusionZoneAboveRoom(newRoom)
                this.arr_rooms.push(newRoom)
                roomUnplaced = false
                if (newRoom.node.parent) {
                    //console.log(`finding path between rooms`)
                    await this.findPathBetweenRooms(newRoom, newRoom.node.parent.room)
                }
            } else {
                this.setRoomLocation(newRoom, attempts)
                attempts++
            }
        }
    }
    calculateNewRoomLocation(room, attempts) {
        let parentNode = room.node.parent
        let parentRoom = parentNode.room
        let radius = 2+(attempts * 0.5)
        let pos = this.RNG.RandomPositionOnCircumference(radius)
        pos.x = Math.floor(parentRoom.x + pos.x)
        pos.y = Math.floor(parentRoom.y + pos.y)
        pos.z = parentRoom.z
        if (parentRoom.isStairs) {
            pos.z = parentRoom.z + parentRoom.getHighestConnectorZ()
        }
        return pos
    }
    setRoomLocation(room, attempts) {
        let pos = this.calculateNewRoomLocation(room, attempts)
        room.x = pos.x
        room.y = pos.y
        room.z = pos.z
    }
    async findPathBetweenRooms(roomA, roomB) {
        let zLayer = roomA.z
        easystar.setGrid(this.matrix[zLayer])

        let attempts = 0
        let path = null
        let con = null

        while (path == null && attempts < this.maximumPathFindingAttempts) {
            if (attempts == 0) {
                con = this.findClosestConnectors(roomA, roomB)
            } else {
                //con = this.findRandomConnectors(roomA, roomB)
            } 
            let startX = roomA.x + con.a.x
            let startY = roomA.y + con.a.y
            let startZ = roomA.z + con.a.z
            let endX = roomB.x + con.b.x
            let endY = roomB.y + con.b.y
            let endZ = roomB.z + con.b.z

            if(startZ !== endZ){
                throw(`Cant find a path between Z layers! ${roomA.z} != ${roomB.z}`)
            }
            
            path = await this.findPath2D(startX, startY, endX, endY)

            if (path !== null) {
                //Add the path to the map
                let pathImportant = path.length > 30
                this.addPathToMatrix(path, pathImportant, zLayer)
                if (this.oneUseConnectors) {
                    if (roomA.prefab.connectors > 1) {
                        roomA.prefab.connectors.splice(con.indexA, 1)
                    }
                    if (roomB.prefab.connectors > 1) {
                        roomB.prefab.connectors.splice(con.indexB, 1)
                    }
                }
            } else {
                console.warn('no path found, attempt:', attempts)
            }

            attempts++
        }
        if (path == null) {
            throw 'no path found!'
        }
    }
    findPath2D(startX, startY, endX, endY) {
        return new Promise((resolve, reject) => {
            easystar.findPath(startX, startY, endX, endY, (result) => {
                resolve(result)
            })
            easystar.calculate()
        })
    }
    findRandomConnectors(roomA, roomB) {
        let con = {
            a: null,
            b: null,
            indexA: null,
            indexB: null,
        }
        con.indexA = this.RNG.Integer(0, roomA.prefab.connectors.length - 1, this.seed)
        con.indexB = this.RNG.Integer(0, roomB.prefab.connectors.length - 1, this.seed)
        con.a = roomA.prefab.connectors[con.indexA]
        con.b = roomB.prefab.connectors[con.indexB]
        return con
    }
    findClosestConnectors(roomA, roomB) {
        //TODO allow rooms to connect connectors that are on the same Z layer
        let smallestDistance = Infinity
        let con = {
            a: null,
            b: null,
            indexA: null,
            indexB: null,
        }

        let connector_z = roomB.getHighestConnectorZ()
        let roomBConnections = roomB.connectionsOnZ(connector_z)
        if (roomBConnections.length == 0) {
            throw 'no connections on room b'
        }
        let roomAConnections = roomA.connectionsOnZ(0)
        if (roomAConnections.length == 0) {
            throw 'no connections on room a'
        }
        //Find the closest connector pair for connecting the rooms
        roomAConnections.forEach((conA, indexA) => {
            roomBConnections.forEach((conB, indexB) => {
                let dist = distance(roomA.x + conA.x, roomB.x + conB.x) + distance(roomA.y + conA.y, roomB.y + conB.y)
                if (dist < smallestDistance) {
                    smallestDistance = dist
                    con.a = conA
                    con.b = conB
                    con.indexA = indexA
                    con.indexB = indexB
                }
            })
        })
        if (con.a == null || con.b == null) {
            throw 'Unable to connect rooms, not enough connections'
        }
        return con
    }
    addPathToMatrix(path, important, zLayer) {
        let pathInfo = {
            important: important,
            tileID: important ? this.id_importantPath : this.id_path,
            locations: path,
            zLayer: zLayer,
        }
        for (let loc of pathInfo.locations) {
            let existingTileID = this.matrix[zLayer][loc.y][loc.x]
            if (this.replacableTiles.includes(existingTileID)) {
                this.matrix[zLayer][loc.y][loc.x] = pathInfo.tileID
            }
        }
        this.arr_paths.push(pathInfo)
        return true
    }
}

module.exports = { NetAreaGenerator }
