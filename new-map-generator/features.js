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

class LinkFeature extends Feature{
    constructor(x,y,z,link){
        super(x,y,z)
        this.href = link.info.href
        this.title = link.info.text ? link.info.text : link.info.href
        this.color = link.info.color
        this.type = "link"
    }
}

module.exports = {Feature,LinkFeature}