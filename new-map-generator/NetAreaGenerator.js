let {NetAreaRoom} = require('./NetAreaRoom.js')
let {NetAreaTileType} = require('./NetAreaTileType.js')
let {generateGrid,distance,RNG} = require('./helpers')
let EasyStar = require('easystarjs')
let easystar = new EasyStar.js()

class NetAreaGenerator {
    constructor() {
        this.width = 1000;
        this.height = 1000;
        this.grid = generateGrid(this.width, this.height)
        this.arr_rooms = [];
        this.arr_paths = [];
        this.arr_queue = [];
        this.features = {};
        this.RNG = new RNG(60902583)

        /*Setup pathfinding
        0 = air
        1 = room
        2 = wall (invisible)
        3 = path
        4 = main path
        */
        easystar.setGrid(this.grid);
        easystar.setAcceptableTiles([0,1,3,4]);
        easystar.setTileCost(0, 4);//Going through empty area
        easystar.setTileCost(1, 64);//Going through rooms
        easystar.setTileCost(3, 2);//Going along paths
        easystar.setTileCost(4, 1);//Going along important paths

        //Options
        this.maximumPathFindingAttempts = 1; //If pathfinding is failing, raising may help
        this.oneUseConnectors = true; //Improves look, but increases failure rate
    }
    async generateNetArea(startingNode){
        this.arr_queue = [startingNode]
        await this.processNodeQueue();
    }
    roomPlacementValid(room) {
        return this.areaIsClear(room.x, room.y, room.x + room.prefab.width, room.y + room.prefab.height)
    }
    areaIsClear(px, py, endx, endy) {
        let g = this.grid
        for (var y = py; y < endy; y++) {
            for (var x = px; x < endx; x++) {
                let tileID = g[y][x]
                if (tileID !== 0) {
                    return false;
                }
            }
        }
        return true;
    }
    burnRoomToGrid(room) {
        //Burn layout
        let g = room.prefab.grid
        for (var y = 0; y < g.length; y++) {
            for (var x = 0; x < g[y].length; x++) {
                let tileID = g[y][x]
                //make coordinates global
                let globalX = room.x + x
                let globalY = room.y + y
                if (tileID != 0) {
                    this.grid[globalY][globalX] = tileID;
                }
            }
        }
        //Burn features
        for(let locationString in room.features){
            let feature = room.features[locationString]
            //make coordinates global
            feature.x+=room.x;
            feature.y+=room.y;
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
                this.burnRoomToGrid(newRoom);
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
        let parentNode = room.node.parent;
        let parentRoom = parentNode.room;
        let radius = attempts*2
        let pos = this.RNG.RandomPositionOnCircumference(radius)
        pos.x = Math.floor(parentRoom.x+parentRoom.width/2 + pos.x*Math.min(parentRoom.widthRatio,1))
        pos.y = Math.floor(parentRoom.y+parentRoom.height/2 + pos.y*Math.min(parentRoom.heightRatio,1))
        return pos;
    }
    setRoomLocation(room, attempts) {
        let pos = this.calculateNewRoomLocation(room,attempts)
        room.x = pos.x
        room.y = pos.y
    }
    async findPathBetweenRooms(roomA, roomB) {
        this.PFgrid = easystar.setGrid(this.grid);

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
            path = await this.findPath(startX, startY, endX, endY)
            
            if(path !== null){
                //Add the path to the map
                let pathImportant = false
                this.burnPathToGrid(path,pathImportant)
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
    findPath(startX,startY,endX,endY){
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
        let smallestDistance = Infinity;
        let con = {
            a: null,
            b: null,
            indexA: null,
            indexB: null
        };
        //Find the closest connector pair for connecting the rooms
        roomA.prefab.connectors.forEach((conA,indexA) => {
            roomB.prefab.connectors.forEach((conB,indexB) => {
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
    burnPathToGrid(path,important) {
        let pathInfo = {
            important: important,
            tileID: important ? 4 : 3,
            locations:path
        }
        for(let loc of pathInfo.locations){
            if(this.grid[loc.y][loc.x] == 0 || this.grid[loc.y][loc.x] == 3){
                this.grid[loc.y][loc.x] = pathInfo.tileID;
            }
        }
        this.arr_paths.push(pathInfo)
        return true;
    }
}

module.exports = {NetAreaGenerator}