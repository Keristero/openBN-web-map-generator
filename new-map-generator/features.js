let {get_tiled_tid} = require('../helpers')
let {generate_image_board} = require('../map-exporter/generate-image-board')
class Feature {
    static tilesetGID = null
    static tsxPath = null
    constructor(x, y, z, properties) {
        this.x = x
        this.y = y
        this.z = z
        this.x_spawn_offset = 0
        this.y_spawn_offset = 0
        this.width = 64
        this.height = 32
        this.tid = 0
        this.visible = '1'
        this.properties = {}
        Object.assign(this.properties, properties)
    }
    get locationString() {
        return `${this.x},${this.y},${this.z}`
    }
    get tilesetGID() {
        return this.constructor.tilesetGID
    }
    get tsxPath() {
        return this.constructor.tsxPath
    }
}

class LinkFeature extends Feature {
    static tsxPath = `../assets/shared/objects/link.tsx`
    static tsxTileCount = 6
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        this.type = 'Custom Warp'
        let newProperties = {
            link: feature.href || '',
            text: feature.text || '',
        }
        Object.assign(this.properties, newProperties)
    }
}
class HomeWarpFeature extends Feature {
    static tsxPath = `../assets/shared/objects/home_warp.tsx`
    static tsxTileCount = 5
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        this.type = 'Home Warp'
    }
    async onExport({ exporter, newObject }) {
        //Called by tmx exporter when this feature is exported
        //sets the default entry point for this map, where the player will be transfered to on moving here
        exporter.AddProperty('entry_warp_id', newObject['@id'])
    }
}

class BackLinkFeature extends HomeWarpFeature {
    static tsxPath = `../assets/shared/objects/back_link.tsx`
    static tsxTileCount = 6
    constructor(x, y, z, feature, properties) {
        super(x, y, z, feature, properties)
        this.type = 'back_link'
    }
}

class TextFeature extends Feature {
    static tsxPath = `../assets/shared/objects/placeholder_npc.tsx`
    static tsxTileCount = 1
    static deprecated_tag_assets  = ["heel-navi-exe4_black","heel-navi-exe4_purple","punk-navi-exe6_navy","punk-navi-exe6_red"]
    static tag_to_npc_asset = {
        "P":["prog"],
        "H1":["official-navi-exe4_orange","official-navi-exe6_orange"],
        "H2":["normal-navi-bn4_red","normal-navi-bn4_green","normal-navi-bn4_brown","male-navi-exe6_teal"],
        "H3":["female-navi-exe4_orange","female-navi-exe5_purple","female-navi-exe6_pink","female-navi-exe6_yellow"],
        "FONT":TextFeature.deprecated_tag_assets,
        "CENTER":TextFeature.deprecated_tag_assets,
        "B":TextFeature.deprecated_tag_assets,
        "MARQUEE":["bass"],
        "STRONG":["gutsman"]
    }
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        this.type = 'NPC'
        this.y_spawn_offset = 16
        this.x_spawn_offset = 16
        this.width = 16
        this.height = 32
        let newProperties = {
            "Asset Name": 'prog',
            "Dialogue Type": 'first',
            "Text 1": feature.text
        }
        //Choose a random NPC asset based on the HTML tag
        let assets_for_this_tag = TextFeature.tag_to_npc_asset[feature.tag]
        if(assets_for_this_tag){
            newProperties['Asset Name'] = assets_for_this_tag[Math.floor(Math.random()*assets_for_this_tag.length)];
        }
        //If we end up with a prog asset, convert the text to uppercase
        if(newProperties['Asset Name'] == 'prog'){
            newProperties['Text 1'] = newProperties['Text 1'].toUpperCase()
        }
        Object.assign(this.properties, newProperties)
    }
}

class ImageFeature extends Feature {
    static tsxPath = `../assets/shared/objects/wall_feature.tsx`
    static tsxTileCount = 2
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        //TODO download the image
        this.type = 'image'
        this.height = 64
        this.y_spawn_offset = -32
        this.x_spawn_offset = -32
        this.image_data = feature.data //image data from scrape
        this.src = feature.src
        let newProperties = {
            text: feature.alt || '',
            src:feature.src
        }
        Object.assign(this.properties, newProperties)
    }
    async onExport({ exporter, newObject ,feature}) {
        let tile_count = 1
        try{
            let tsx_path = await generate_image_board(feature.src,feature.image_data)
            let new_gid = exporter.AddTileset(tile_count, tsx_path)
            let xflipped = false
            if (this.properties.Direction == 'Down Left') {
                xflipped = true
            }
            newObject['@gid'] = get_tiled_tid(new_gid,xflipped)
        }catch(e){
            console.log(`error generating image board for ${this.properties.src}`,e)
        }
    }
}

let featureCategories = {
    unplaced: {
        connections: {
            scrapedName: 'children',
            extraRequirements: 1,
            className: null,
        },
    },
    ground_features: {
        links: {
            scrapedName: 'links',
            extraRequirements: 0,
            className: LinkFeature,
        },
        home_warps: {
            scrapedName: 'home_warps', //Does not exist really
            extraRequirements: 0,
            className: HomeWarpFeature,
        },
        back_links: {
            scrapedName: 'back_links', //Does not exist really
            extraRequirements: 0,
            className: BackLinkFeature,
        },
        text: {
            scrapedName: 'text',
            extraRequirements: 0,
            className: TextFeature,
        },
    },
    wall_features: {
        images: {
            scrapedName: 'images',
            extraRequirements: 0,
            className: ImageFeature,
        },
    },
}

module.exports = {
    featureCategories,
    Feature,
    LinkFeature,
    TextFeature,
    ImageFeature,
    HomeWarpFeature,
}
