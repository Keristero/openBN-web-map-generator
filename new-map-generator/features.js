class Feature{
    constructor(x,y,z,properties){
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = 64
        this.height = 32
        this.properties = {}
        Object.assign(this.properties,properties)
    }
    get locationString(){
        return `${this.x},${this.y},${this.z}`
    }
}

class LinkFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        //Add directionality for warp exit
        this.type = "link"
        this.gid = 100
        let newProperties = {
            "link":feature.link || "",
            "text":feature.text || ""
        }
        Object.assign(this.properties,newProperties)
    }
}

class TextFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        //Add directionality for npc facing
        this.type = "NPC"
        this.gid = 101
        let newProperties = {
            "default_response":feature.text.toUpperCase(),
        }
        Object.assign(this.properties,newProperties)
    }
}

class ImageFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        //TODO download the image
        this.type = "image"
        this.gid = 110
        this.height = 64
        let newProperties = {
            "src":feature.link || "",
            "text":feature.text || ""
        }
        Object.assign(this.properties,newProperties)
    }
}

module.exports = {Feature,LinkFeature,TextFeature,ImageFeature}