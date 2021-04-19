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
        this.type = "link"
        this.gid = 100
        let newProperties = {
            "link":feature.link || "",
            "text":feature.text || ""
        }
        Object.assign(this.properties,newProperties)
    }
}

class HomeWarpFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "backlink"
        this.gid = 120
    }
}

class BackLinkFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "backlink"
        this.gid = 120
    }
}

class TextFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
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
        "homeWarps":{
            scrapedName:"homeWarps",//Does not exist really
            extraRequirements:0,
            className:HomeWarpFeature
        },
        "backLinks":{
            scrapedName:"backLinks",//Does not exist really
            extraRequirements:0,
            className:BackLinkFeature
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

module.exports = {featureCategories,Feature,LinkFeature,TextFeature,ImageFeature,HomeWarpFeature}