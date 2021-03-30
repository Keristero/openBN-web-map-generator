class Feature{
    constructor(x,y){
        this._x = x;
        this._y = y;
    }
    get locationString(){
        return `${this._x},${this._y}`
    }
}

class LinkFeature extends Feature{
    constructor(x,y,link){
        super(x,y)
        this.href = link.info.href
        this.title = link.info.text ? link.info.text : link.info.href
        this.color = link.info.color
        this.type = "link"
    }
}

module.exports = {Feature,LinkFeature}