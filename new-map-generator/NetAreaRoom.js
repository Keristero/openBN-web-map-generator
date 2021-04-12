let { PrefabGenerator } = require('./PrefabGenerator.js')
let { Feature, LinkFeature,TextFeature,ImageFeature} = require('./features.js')

//This list is a mapping of features on a node to features on a prefab
let featureCategories = {
    unplaced:{
        "connections":{
            scrapedName:"children",
            extraRequirements:1,
            className:null
        }
    },
    groundFeatures:{
        "links":{
            scrapedName:"links",
            extraRequirements:0,
            className:LinkFeature
        },
        "text":{
            scrapedName:"text",
            extraRequirements:0,
            className:TextFeature
        }
    },
    wallFeatures:{
        "images":{
            scrapedName:"images",
            extraRequirements:0,
            className:ImageFeature
        }
    }
}

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
            "images":{}
        };
        this.nextGroundFeatureIndex = 0
        this.nextWallFeatureIndex = 0

        this.determineFeatureRequirementsFromNode(this.node)

        //If all a room has is 2 connections, use it as a flight of stairs
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
    determineFeatureRequirementsFromNode(node){
        /*
            Count how many features of each type we will need in the prefab
            for all the features of this node to be placed on
        */
        this.prefabRequirements = {}

        for(let featureType in featureCategories){
            let featuresOfType = featureCategories[featureType]
            for(let featureName in featuresOfType){
                let feature = featuresOfType[featureName]
                let requiredCount = feature.extraRequirements
                let nodeCollection = node?.features[feature.scrapedName]
                if(nodeCollection){
                    requiredCount+=nodeCollection.length
                }
                this.prefabRequirements[featureName] = requiredCount
            }
        }
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
                    let {x,y,z} = newPlacementPosition
                    let newFeature = new featureMapping.className(x,y,z,featureData)
                    this.features[featureName][newFeature.locationString] = newFeature
                }
            }
        }
        /*
        //Place ground features
        let groundFeatures = this.prefab.features.groundFeatures
        let wallFeatures = this.prefab.features.wallFeatures
        for(let featureCollectionName in this.node.features){
            for(let feature of this.node.features[featureCollectionName]){
                if(featureCollectionName == "children"){
                    continue
                }
                //Ground Features
                let {x,y,z} = groundFeatures[this.nextGroundFeatureIndex]
                if(featureCollectionName == "links"){
                    let newFeature = new LinkFeature(x,y,z,feature)
                    this.features.links[newFeature.locationString] = newFeature
                    this.nextGroundFeatureIndex++
                }
                if(featureCollectionName == "text"){
                    let newFeature = new TextFeature(x,y,z,feature)
                    this.features.text[newFeature.locationString] = newFeature
                    console.log(newFeature.locationString,newFeature)
                    this.nextGroundFeatureIndex++
                }

                //Wall Features
                if(featureCollectionName == "images"){
                    let newFeature = new ImageFeature(x,y,z,feature)
                    this.features.links[newFeature.locationString] = newFeature
                    this.nextWallFeatureIndex++
                }
            }
        }
        */
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
        let requiredText = node.room.prefabRequirements.text
        let requiredGroundFeatures = requiredLinks+requiredText

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

        filtered = filtered.filter(prefab => prefab.features.groundFeatures.length >= requiredGroundFeatures);
        //console.log(`prefabs with ${requiredLinks} or more links (${filtered.length})`)


        if (filtered.length == 0) {
            throw(`node requirements not met requiredConnections:${requiredConnections} , requiredGroundFeatures:${requiredGroundFeatures}`)
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