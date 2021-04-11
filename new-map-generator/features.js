class Feature{
    constructor(x,y,z){
        this._x = x;
        this._y = y;
        this._z = z;
    }
    get locationString(){
        return `${this._x},${this._y},${this._z}`
    }
}

class LinkFeature{
    constructor(x,y,z,feature){
        this.x = x
        this.y = y
        this.z = z
        this.type = "link"
        this.gid = 100,
        this.width = 64
        this.height = 32
        this.properties = {
            "link":feature.link || "",
            "text":feature.text || ""
        }
    }
    get locationString(){
        return `${this.x},${this.y},${this.z}`
    }
}

module.exports = {Feature,LinkFeature}