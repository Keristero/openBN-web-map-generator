class Prefab {
    constructor() {
        this.features = {
            connections: [],
            groundFeatures: [],
            wallFeatures: []
        }
        this.totalFeatures = 0
        this.matrix = []
    }
    get width() {
        return this.matrix[0][0].length
    }
    get length() {
        return this.matrix[0].length
    }
    get height() {
        return this.matrix.length
    }
    AddMatrixLayer(gridLayer) {
        this.matrix.push(gridLayer)
    }
    AddFeature(featureCollectionName, x, y, z, properties) {
        let newFeatureData = { x, y, z, properties }
        this.features[featureCollectionName].push(newFeatureData)
        this.totalFeatures++
        console.log("Added feature", newFeatureData, "To", featureCollectionName)
    }
}

return Prefab