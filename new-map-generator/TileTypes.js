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
        homeWarps: {
            scrapedName: 'homeWarps', //Does not exist really
            extraRequirements: 0,
            className: HomeWarpFeature,
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
