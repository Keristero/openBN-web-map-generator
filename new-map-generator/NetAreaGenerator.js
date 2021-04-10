let {NetAreaRoom} = require('./NetAreaRoom.js')
let {generateGrid,distance,RNG,iterateOverGrid,generate3dMatrix,iterateOver3dMatrix} = require('./helpers')
let EasyStar = require('easystarjs')
let easystar = new EasyStar.js()

class NetAreaGenerator {
    constructor() {
        this.width = 1000;
        this.length = 1000;
        this.height = 20;
        this.matrix = generate3dMatrix(this.width, this.length, this.height)
        this.arr_rooms = [];
        this.arr_paths = [];
        this.arr_queue = [];
        this.features = {};
        this.RNG = new RNG(60902583)

        /*Setup pathfinding (OLD INFO)
        0 = air
        1 = room
        2 = wall (invisible)
        3 = path
        4 = main path
        */

        this.id_path = 5
        this.id_importantPath = 6

        //Setup easystar
        easystar.setAcceptableTiles([0,1,2,3,4,5,6]);
        easystar.setTileCost(0, 4);//Going through empty area
        easystar.setTileCost(1, 128);//Going through WALLS
        easystar.setTileCost(2, 64);//Going through rooms
        easystar.setTileCost(3, 64);//Going through rooms
        easystar.setTileCost(4, 64);//Going through rooms
        easystar.setTileCost(this.id_path, 2);//Going along paths
        easystar.setTileCost(this.id_importantPath, 1);//Going along important paths

        //Options
        this.maximumPathFindingAttempts = 1; //If pathfinding is failing, raising may help
        this.oneUseConnectors = false; //Improves look, but increases failure rate
    }
    async generateNetArea(startingNode,prefabs){
        try{
            this.prefabs = prefabs
            this.arr_queue = [startingNode]
            await this.processNodeQueue();
        }catch(e){
            console.log(e)
            throw(e)
        }
    }
    roomPlacementValid(room) {
        return this.areaIsClear(room.x, room.y, room.z, room.x + room.prefab.width, room.y + room.prefab.length, room.z + room.prefab.height)
    }
    areaIsClear(startX, startY, startZ, endX, endY, endZ) {
        const iterator = iterateOver3dMatrix(this.matrix,startX, startY, startZ, endX, endY, endZ);
        for (const gridPos of iterator) {
            if(gridPos.tileID !== 0){
                return false
            }
        }
        return true
    }
    burnRoomToMatrix(room) {
        console.log('burning room to matrix')
        //Burn layout
        const iterator = iterateOver3dMatrix(room.prefab.matrix);
        for (let gridPos of iterator) {
            if(gridPos.tileID != 0){
                //make coordinates global
                const globalX = room.x + gridPos.x
                const globalY = room.y + gridPos.y
                const globalZ = room.z + gridPos.z
                this.matrix[globalZ][globalY][globalX] = gridPos.tileID;
            }
        }
        //Burn features
        for(let locationString in room.features){
            let feature = room.features[locationString]
            //make coordinates global
            feature.x+=room.x;
            feature.y+=room.y;
            feature.z+=room.z;
            this.features[feature.locationString] = feature
        }
        this.arr_rooms.push(room)
    }
    async processNodeQueue() {
        while(this.arr_queue.length > 0){
            let currentNode = this.arr_queue.shift()
            this.addNodesChildrenToQueue(currentNode)
            await this.generateLayout(currentNode)
        }
    }
    addNodesChildrenToQueue(node) {
        let children = node?.features?.children
        if(children){
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
            for(let childNode of children){
                this.arr_queue.push(childNode)
            }
        }
    }
    async generateLayout(node) {
        let newRoom = new NetAreaRoom(node,this);
        let roomUnplaced = true;
        let attempts = 0;
        while (roomUnplaced) {
            if (this.roomPlacementValid(newRoom)) {
                this.burnRoomToMatrix(newRoom);
                roomUnplaced = false;
                if (newRoom.node.parent) {
                    await this.findPathBetweenRooms(newRoom, newRoom.node.parent.room)
                }
            } else {
                this.setRoomLocation(newRoom, attempts)
                attempts++;
            }
        }
    }
    calculateNewRoomLocation(room, attempts){
        //TODO let rooms be placed on different z layers
        let parentNode = room.node.parent;
        let parentRoom = parentNode.room;
        let radius = attempts*2
        let pos = this.RNG.RandomPositionOnCircumference(radius)
        pos.x = Math.floor(parentRoom.x+parentRoom.width/2 + pos.x*Math.min(parentRoom.widthRatio,1))
        pos.y = Math.floor(parentRoom.y+parentRoom.length/2 + pos.y*Math.min(parentRoom.lengthRatio,1))
        pos.z = parentRoom.z
        return pos;
    }
    setRoomLocation(room, attempts) {
        let pos = this.calculateNewRoomLocation(room,attempts)
        room.x = pos.x
        room.y = pos.y
        room.z = pos.z
    }
    async findPathBetweenRooms(roomA, roomB) {
        if(roomA.z != roomB.z){
            throw("Cant find a path between Z layers!")
        }
        let zLayer = roomA.z
        console.log('easystar using',zLayer,'zLayer!')
        easystar.setGrid(this.matrix[zLayer]);

        let attempts = 0;
        let path = null;
        let con = null;

        while(path == null && attempts < this.maximumPathFindingAttempts){
            if(attempts == 0){
                con = this.findClosestConnectors(roomA,roomB)
            }else{
                con = this.findRandomConnectors(roomA,roomB)
            }
            let startX = roomA.x + con.a.x
            let startY = roomA.y + con.a.y;
            let endX = roomB.x + con.b.x;
            let endY = roomB.y + con.b.y;
            path = await this.findPath2D(startX, startY, endX, endY)
            
            if(path !== null){
                //Add the path to the map
                let pathImportant = false
                this.addPathToMatrix(path,pathImportant,zLayer)
                if(this.oneUseConnectors){
                    if(roomA.prefab.connectors > 1){
                        roomA.prefab.connectors.splice(con.indexA,1)
                    }
                    if(roomB.prefab.connectors > 1){
                        roomB.prefab.connectors.splice(con.indexB,1)
                    }
                }
            }else{
                console.warn("no path found, attempt:",attempts)
            }

            attempts++
        }
        if(path == null){
            throw("no path found!")
        }
    }
    findPath2D(startX,startY,endX,endY){
        return new Promise((resolve, reject)=>{
            easystar.findPath(startX, startY, endX, endY, (result)=>{
                resolve(result)
            });
            easystar.calculate();
        });
    }
    findRandomConnectors(roomA,roomB){
        let con = {
            a: null,
            b: null,
            indexA: null,
            indexB: null
        };
        con.indexA = this.RNG.Integer(0,roomA.prefab.connectors.length-1,this.seed);
        con.indexB = this.RNG.Integer(0,roomB.prefab.connectors.length-1,this.seed);
        con.a = roomA.prefab.connectors[con.indexA];
        con.b = roomB.prefab.connectors[con.indexB];
        return con
    }
    findClosestConnectors(roomA,roomB){
        //TODO allow rooms to connect connectors that are on the same Z layer
        let smallestDistance = Infinity;
        let con = {
            a: null,
            b: null,
            indexA: null,
            indexB: null
        };
        //Find the closest connector pair for connecting the rooms
        roomA.prefab.features.connections.forEach((conA,indexA) => {
            roomB.prefab.features.connections.forEach((conB,indexB) => {
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
        if(con.a == null || con.b == null){
            throw("Unable to connect rooms, not enough connections",roomA.prefab,roomB.prefab)
        }
        return con
    }
    addPathToMatrix(path,important,zLayer) {
        let pathInfo = {
            important: important,
            tileID: important ? this.id_importantPath : this.id_path,
            locations:path,
            zLayer: zLayer
        }
        for(let loc of pathInfo.locations){
            if(this.matrix[zLayer][loc.y][loc.x] == 0 || this.matrix[zLayer][loc.y][loc.x] == this.id_path){
                this.matrix[zLayer][loc.y][loc.x] = pathInfo.tileID;
            }
        }
        this.arr_paths.push(pathInfo)
        return true;
    }
}

module.exports = {NetAreaGenerator}