let {PrefabGenerator} = require('./PrefabGenerator.js')
let {Feature,LinkFeature} = require('./features.js')

class NetAreaRoom extends Feature{
    constructor(node,netAreaGenerator){
        super(500,500)
        this.node = node;
        this.node.room = this
        this.netAreaGenerator = netAreaGenerator
        this.features = {};

        this.prefabRequirements = {
            connectors:node?.features?.children?.length,
            links:node?.features?.links?.length
        }

        //Set color of room based on the node's color, or on the parent node's
        this.color = this.node["background-color"]
        if(!this.color){
            if(this.node?.parent?.room?.color){
                this.color = this.node?.parent?.room?.color
            }
        }

        this.prefab = this.pickSmallestPrefab(node);
        this.width = this.prefab.width;
        this.height = this.prefab.height;
        this.widthRatio = this.width/this.height
        this.heightRatio = this.height/this.width
    }
    pickSmallestPrefab(node){
        /*
        let filtered = roomPrefabs.filter(prefab => prefab.total.connectors > node.minimumConnectors);
        let filteredFuther = filtered.filter(prefab => prefab.total.links > node.minimumLinks);
        if(filteredFuther.length == 0){
            console.warn(`node requirements not met minimumConnectors:${node.minimumConnectors} , minimumLinks:${node.minimumLinks}`)
            return roomPrefabs[this.netAreaGenerator.RNG.Integer(0,roomPrefabs.length-1)]
        }else{
            return filteredFuther[0];
        }
        */
        let prefabGenerator = new PrefabGenerator()
        return prefabGenerator.newPrefab(this.prefabRequirements)
    }
    set x(val){
        if(val > 0 && val < (this.width+this.netAreaGenerator.width-1)){
            this._x = val;
        }
    }
    set y(val){
        if(val > 0 && val < (this.height+this.netAreaGenerator.height-1)){
            this._y = val;
        }
    }
    get x(){
        return this._x
    }
    get y(){
        return this._y
    }
}

module.exports = {NetAreaRoom}