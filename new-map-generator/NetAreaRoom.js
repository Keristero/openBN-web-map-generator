let {featureCategories, LinkFeature,TextFeature,ImageFeature,HomeWarpFeature} = require('./features.js')
class NetAreaRoom{
    constructor(node, netAreaGenerator) {
        let defaultX = parseInt(netAreaGenerator.width/2)
        let defaultY = parseInt(netAreaGenerator.length/2)
        let defaultZ = 0
        this._x = defaultX;
        this._y = defaultY;
        this._z = defaultZ;
        this.node = node;
        this.node.room = this
        this.netAreaGenerator = netAreaGenerator
        this.features = {
            "links":{},
            "text":{},
            "images":{},
            "homeWarps":{}
        };
        this.nextGroundFeatureIndex = 0
        this.nextWallFeatureIndex = 0

        let {prefabRequirements,totalRequired} = this.determineFeatureRequirementsFromNode(this.node)
        this.prefabRequirements = prefabRequirements
        this.totalRequired = totalRequired

        //If all a room has is 2 connections, use it as a flight of stairs
        this.isStairs = true
        if(!this.prefabRequirements["connections"]){
            this.isStairs = false
        }else{
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
    determineFeatureRequirementsFromNode(node){
        /*
            Count how many features of each type we will need in the prefab
            for all the features of this node to be placed on
        */
        let prefabRequirements = {}
        let totalRequired = {
            "groundFeatures":0,
            "wallFeatures":0
        }

        for(let featureCategory in featureCategories){
            let category = featureCategories[featureCategory]
            for(let featureName in category){
                let feature = category[featureName]
                let requiredCount = feature.extraRequirements
                if(node && node?.features){
                    let nodeCollection = node?.features[feature.scrapedName]
                    if(nodeCollection){
                        requiredCount+=nodeCollection.length
                    }
                    totalRequired[featureCategory] += requiredCount
                    prefabRequirements[featureName] = requiredCount
                }
            }
        }
        return {prefabRequirements,totalRequired}
    }
    placeFeatures(){
        console.log('placing features for room')
        for(let category in featureCategories){
            //Loop through each feature category
            if(category == "unplaced"){
                //Unplaced features have special logic for placement elsewhere
                continue
            }
            if(this.prefab.features[category].length == 0){
                continue
            }

            let featureTypes = featureCategories[category]
            for(let featureName in featureTypes){
                //Loop through each feature subtype
                let featureMapping = featureTypes[featureName]
                //Skip if this node does not have any features of this type
                if(!this.node?.features || !this.node.features[featureMapping.scrapedName]){
                    continue
                }
                let nodeFeaturesOfType = this.node.features[featureMapping.scrapedName]
                for(let n_featureKey in nodeFeaturesOfType){
                    let newPlacementPosition;
                    if(category == "groundFeatures"){
                        newPlacementPosition = this.prefab.features[category][this.nextGroundFeatureIndex]
                        this.nextGroundFeatureIndex++
                        //console.log('placing a ground feature on location',this.nextGroundFeatureIndex,'/', this.prefab.features[category].length)
                    }
                    if(category == "wallFeatures"){
                        newPlacementPosition = this.prefab.features[category][this.nextWallFeatureIndex]
                        this.nextWallFeatureIndex++
                        //console.log('placing a wall feature on location',this.nextWallFeatureIndex,'/', this.prefab.features[category].length)
                    }
                    let featureData = nodeFeaturesOfType[n_featureKey]
                    let {x,y,z,properties} = newPlacementPosition
                    let newFeature = new featureMapping.className(x,y,z,featureData,properties)
                    this.features[featureName][newFeature.locationString] = newFeature
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

        let filtered = prefabs

        if(this.node.isFirstNode){
            this.totalRequired.homeWarps = 1
            this.totalRequired.groundFeatures += 1
            this.node.features.homeWarps = [{}]
            this.isStairs = false
        }

        let requiredConnections = node?.room?.prefabRequirements?.connections || 0
        let requiredGroundFeatures = this.totalRequired.groundFeatures
        let requiredWallFeatures = this.totalRequired.wallFeatures

        if(this.isStairs){
            filtered = filtered.filter(prefab => prefab?.properties?.Stairs);
            //console.log(`prefabs that are stairs (${filtered.length})`)
        }else{
            filtered = filtered.filter(prefab => !prefab?.properties?.Stairs);
            //console.log(`prefabs that are not stairs (${filtered.length})`)
        }


        /* TODO maybe remove this?
        filtered = filtered.filter(prefab => prefab.features.connections.length >= requiredConnections);
        //console.log(`prefabs with ${requiredConnections} or more connections (${filtered.length})`)
        */

        filtered = filtered.filter(prefab => prefab.features.groundFeatures.length >= requiredGroundFeatures);
        //console.log(`prefabs with ${requiredLinks} or more links (${filtered.length})`)

        filtered = filtered.filter(prefab => prefab.features.wallFeatures.length >= requiredWallFeatures);


        if (filtered.length == 0) {
            throw(`node requirements not met ${JSON.stringify({requiredConnections,requiredGroundFeatures,requiredWallFeatures})}`)
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
        if (val > 0 && val + this.width < (this.netAreaGenerator.width - 1)) {
            this._x = val;
        }
    }
    set y(val) {
        if (val > 0 && val+this.length < (this.netAreaGenerator.length - 1)) {
            this._y = val;
        }
    }
    set z(val) {
        if (val >= 0 && val+this.height < (this.netAreaGenerator.height - 1)) {
            this._z = val;
        }else{
            //TODO remove this prob, it is a bit crazy
            if(this.netAreaGenerator.allowLayerGeneration){
                if(val+this.height >= (this.netAreaGenerator.height - 1)){
                    let heightNeeded = ((val+this.height)-(this.netAreaGenerator.height - 1))+1
                    console.log(val+this.height, ">=",(this.netAreaGenerator.height - 1))
                    console.log('adding layers',heightNeeded)
                    this.netAreaGenerator.addLayers(heightNeeded)
                    this._z = val
                }
            }
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