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
        this.type = 'link'
        let newProperties = {
            link: feature.link || '',
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
    onExport({ exporter, newObject }) {
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
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        this.type = 'NPC'
        this.visible = 0
        this.y_spawn_offset = -16
        this.x_spawn_offset = -16
        let newProperties = {
            npc_asset_name: 'prog',
            npc_chat: feature.text.toUpperCase(),
            npc_type: 'chat',
        }
        Object.assign(this.properties, newProperties)
    }
}

class ImageFeature extends Feature {
    static tsxPath = `../assets/shared/objects/wall_feature.tsx`
    static tsxTileCount = 2
    constructor(x, y, z, feature, properties) {
        super(x, y, z, properties)
        console.log(`creating image feature with properties`, properties, feature)
        //TODO download the image
        this.type = 'image'
        this.height = 64
        this.y_spawn_offset = -32
        this.x_spawn_offset = -32
        let newProperties = {
            src: feature.link || '',
            text: feature.text || '',
        }
        Object.assign(this.properties, newProperties)
    }
    onExport({ exporter, newObject }) {
        //This ensures that the Down Left facing objects are using the gid and facing the correct way as a result
        if (this.properties.Direction == 'Down Left') {
            newObject['@gid'] = newObject['@gid'] + 1
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
