let default_tiles = {
    prefab_tiles: {
        subIndex: {
            0: { type: "Tile", name: "Wall", id: 1 },
            1: { type: "Tile", name: "Ground Tile 1", id: 2 },
            2: { type: "Tile", name: "Ground Tile 2", id: 3 },
            3: { type: "Tile", name: "Ground Tile 3", id: 4 },
        },
    },
    "path-tiles": {
        subIndex: {
            0: { type: "Tile", name: "Normal Path", id: 5 },
            1: { type: "Tile", name: "Important Path", id: 6 },
        },
    },
    connection: {
        subIndex: {
            0: {
                type: "Feature",
                name: "Connection",
                collection: "connections",
            },
        },
    },
    ground_feature: {
        subIndex: {
            0: {
                type: "Feature",
                name: "GroundFeature",
                collection: "ground_features",
                Direction: "Up Left",
            },
            1: {
                type: "Feature",
                name: "GroundFeature",
                collection: "ground_features",
                Direction: "Up Right",
            },
            2: {
                type: "Feature",
                name: "GroundFeature",
                collection: "ground_features",
                Direction: "Down Right",
            },
            3: {
                type: "Feature",
                name: "GroundFeature",
                collection: "ground_features",
                Direction: "Down Left",
            },
        },
    },
    wall_feature: {
        subIndex: {
            0: {
                type: "Feature",
                name: "WallFeature",
                collection: "wall_features",
                Direction: "Down Right",
            },
            1: {
                type: "Feature",
                name: "WallFeature",
                collection: "wall_features",
                Direction: "Down Left",
            },
        },
    },
    "forward-stairs": {
        subIndex: {
            0: {
                type: "Tile",
                name: "Forward-Middle-Left",
                id: 7,
                Direction: "Up Left",
            },
            1: {
                type: "Tile",
                name: "Forward-Middle-Right",
                id: 8,
                Direction: "Up Right",
            },
            2: {
                type: "Tile",
                name: "Forward-Top-Left",
                id: 9,
                Direction: "Up Left",
            },
            3: {
                type: "Tile",
                name: "Forward-Top-Right",
                id: 10,
                Direction: "Up Right",
            },
        },
    },
    "back-stairs": {
        subIndex: {
            0: { type: "Tile", name: "Backward-Base-Left", id: 11 },
            1: { type: "Tile", name: "Backward-Base-Right", id: 12 },
            2: { type: "Tile", name: "Backward-Middle-Left", id: 13 },
            3: { type: "Tile", name: "Backward-Middle-Right", id: 14 },
            4: { type: "Tile", name: "Backward-Top-Left", id: 15 },
            5: { type: "Tile", name: "Backward-Top-Right", id: 16 },
        },
    },
};

module.exports = default_tiles;
