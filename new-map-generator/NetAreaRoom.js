let { PrefabGenerator } = require('./PrefabGenerator.js')
let { Feature, LinkFeature } = require('./features.js')

class NetAreaRoom extends Feature {
    constructor(node, netAreaGenerator) {
        super(500, 500, 0)
        this.node = node;
        this.node.room = this
        this.netAreaGenerator = netAreaGenerator
        this.features = {
            "links":{}
        };
        this.nextGroundFeatureIndex = 0

        this.prefabRequirements = {
            connections:1,
            links:0
        }

        if(node?.features?.children){
            this.prefabRequirements.connections = node?.features?.children?.length+1
        }
        if(node?.features?.links){
            this.prefabRequirements.links = node?.features?.links?.length
        }

        this.isStairs = true
        for (let requirementName in this.prefabRequirements) {
            let req = this.prefabRequirements[requirementName]
            if (requirementName == "connections") {
                if (req != 2) {
                    this.isStairs = false
                }
            } else {
                if (req > 0) {
                    this.isStairs = false
                }
            }
        }

        //Set color of room based on the node's color, or on the parent node's
        this.color = this.node["background-color"]
        if (!this.color) {
            if (this.node?.parent?.room?.color) {
                this.color = this.node?.parent?.room?.color
            }
        }

        this.prefab = this.pickSmallestPrefab(node);
        this.width = this.prefab.width;
        this.length = this.prefab.length;
        this.height = this.prefab.height;
        this.widthRatio = this.width / this.length
        this.lengthRatio = this.length / this.width
        this.placeFeatures()
    }
    addFeature(collectionName,feature){
        this.features[collectionName]
    }
    placeFeatures(){
        let groundFeatures = this.prefab.features.groundFeatures
        for(let featureCollectionName in this.node.features){
            for(let feature of this.node.features[featureCollectionName]){
                if(featureCollectionName == "links"){
                    let {x,y,z} = groundFeatures[this.nextGroundFeatureIndex]
                    let newLink = new LinkFeature(x,y,z,feature)
                    this.features.links[newLink.locationString] = newLink
                }
            }
        }
    }
    connectionsOnZ(targetZ){
        let connections = this.prefab.features.connections.filter(connection => connection.z == targetZ);
        return connections
    }
    getHighestConnectorZ(){
        let highestLayer = 0
        for(let connection of this.prefab.features.connections){
            if(connection.z > highestLayer){
                highestLayer = connection.z
            }
        }
        return highestLayer
    }
    filterAllButSmallestPrefabs(prefabList){
        let leastFeatures = Infinity
        let smallestPrefabs = []
        for(let prefab of prefabList){
            if(prefab.totalFeatures < leastFeatures){
                leastFeatures = prefab.totalFeatures
                smallestPrefabs = [prefab]
            }else if(prefab.totalFeatures == leastFeatures){
                smallestPrefabs.push(prefab)
            }
        }
        return smallestPrefabs
    }
    pickSmallestPrefab(node) {
        let prefabs = this.netAreaGenerator.prefabs
        //TODO select prefab from list of exisitng ones, rather than generating a new one each time

        let requiredConnections = node.room.prefabRequirements.connections
        let requiredLinks = node.room.prefabRequirements.links

        let filtered = []

        if(this.isStairs){
            filtered = prefabs.filter(prefab => prefab?.properties?.Stairs);
            //console.log(`prefabs that are stairs (${filtered.length})`)
        }else{
            filtered = prefabs.filter(prefab => !prefab?.properties?.Stairs);
            //console.log(`prefabs that are not stairs (${filtered.length})`)
        }

        filtered = filtered.filter(prefab => prefab.features.connections.length >= requiredConnections);
        //console.log(`prefabs with ${requiredConnections} or more connections (${filtered.length})`)

        filtered = filtered.filter(prefab => prefab.features.groundFeatures.length >= requiredLinks);
        //console.log(`prefabs with ${requiredLinks} or more links (${filtered.length})`)

        if (filtered.length == 0) {
            throw(`node requirements not met requiredConnections:${requiredConnections} , requiredLinks:${requiredLinks}`)
            //return prefabs[this.netAreaGenerator.RNG.Integer(0, prefabs.length - 1)]
        }

        let smallestPrefabs = this.filterAllButSmallestPrefabs(filtered)
        return smallestPrefabs[this.netAreaGenerator.RNG.Integer(0,smallestPrefabs.length-1)];
        /*
         let prefabGenerator = new PrefabGenerator()
         return prefabGenerator.newPrefab(this.prefabRequirements)
         */
    }
    set x(val) {
        if (val > 0 && val < (this.width + this.netAreaGenerator.width - 1)) {
            this._x = val;
        }
    }
    set y(val) {
        if (val > 0 && val < (this.length + this.netAreaGenerator.length - 1)) {
            this._y = val;
        }
    }
    set z(val) {
        if (val > 0 && val < (this.length + this.netAreaGenerator.height - 1)) {
            this._z = val;
        }
    }
    get x() {
        return this._x
    }
    get y() {
        return this._y
    }
    get z() {
        return this._z
    }
}

module.exports = { NetAreaRoom }