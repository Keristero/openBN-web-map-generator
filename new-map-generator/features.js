class Feature{
    constructor(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = 64
        this.height = 32
    }
    get locationString(){
        return `${this.x},${this.y},${this.z}`
    }
}

class LinkFeature extends Feature{
    constructor(x,y,z,feature){
        super(x,y,z)
        //Add directionality for warp exit
        this.type = "link"
        this.gid = 100,
        this.properties = {
            "link":feature.link || "",
            "text":feature.text || ""
        }
    }
}

class TextFeature extends Feature{
    constructor(x,y,z,feature){
        super(x,y,z)
        //Add directionality for npc facing
        this.type = "NPC"
        this.gid = 101,
        this.properties = {
            "default_response":feature.text.toUpperCase(),
        }
    }
}

class ImageFeature extends Feature{
    constructor(x,y,z,feature){
        super(x,y,z)
        //TODO download the image
        this.type = "image"
        this.gid = 110,
        this.properties = {
            "src":feature.link || "",
            "text":feature.text || ""
        }
    }
}

module.exports = {Feature,LinkFeature,TextFeature,ImageFeature}