class Feature{
    constructor(x,y,z,properties){
        this.x = x;
        this.y = y;
        this.z = z;
        this.x_spawn_offset = 0
        this.y_spawn_offset = 0
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
        this.type = "Home Warp"
        this.gid = 120
    }
    onExport(tiledTMXExporter,x,y,z){
        //Called by tmx exporter when this feature is exported
        tiledTMXExporter.AddProperty("entryX",x)//+0.5 so that players appear in the middle of the tile
        tiledTMXExporter.AddProperty("entryY",y)
        tiledTMXExporter.AddProperty("entryZ",z)
        tiledTMXExporter.AddProperty("entryDirection",this.properties.Direction)
    }
}

class BackLinkFeature extends HomeWarpFeature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,feature,properties)
        this.type = "back_link"
        this.gid = 102
    }
}

class TextFeature extends Feature{
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "NPC"
        this.gid = 104
        this.y_spawn_offset = -16
        this.x_spawn_offset = -16
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
        "home_warps":{
            scrapedName:"home_warps",//Does not exist really
            extraRequirements:0,
            className:HomeWarpFeature
        },
        "back_links":{
            scrapedName:"back_links",//Does not exist really
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