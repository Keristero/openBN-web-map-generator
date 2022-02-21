let parts = [
    {
        name: '3x3 with ground_feature',
        width: 3,
        length: 3,
        height: 1,
        matrix: [
            [
                [2, 2, 2],
                [2, 2, 2],
                [2, 2, 2],
            ],
        ],
        ground_features: [
            {
                x: 1,
                y: 1,
                z: 0,
                properties: {},
            },
        ],
        wall_features: [],
        male_connectors: [
            { x: -1, y: 1, z: 0, },
            { x: 3, y: 1, z: 0, },
            { x: 1, y: -1, z: 0, },
            { x: 1, y: 3, z: 0, },
        ],
        female_connectors: [
            { x: 0, y: 1, z: 0, },
            { x: 2, y: 1, z: 0, },
            { x: 1, y: 0, z: 0, },
            { x: 1, y: 2, z: 0, },
        ],
    },
    {
        name: '3x3 with wall_feature_left',
        width: 3,
        length: 3,
        height: 1,
        matrix: [
            [
                [2, 2, 2],
                [2, 2, 2],
                [2, 2, 2],
            ],
        ],
        ground_features: [
            {
                x: 1,
                y: 1,
                z: 0,
                properties: {},
            },
        ],
        wall_features: [
            {
                x: 0,
                y: 1,
                z: 0,
                properties: { Direction: 'Down Right' },
            },
        ],
        male_connectors: [
            { x: 3, y: 1, z: 0, },
            { x: 1, y: -1, z: 0, },
            { x: 1, y: 3, z: 0, },
        ],
        female_connectors: [
            { x: 2, y: 1, z: 0, },
            { x: 1, y: 0, z: 0, },
            { x: 1, y: 2, z: 0, },
        ],
    },
    {
        name: '3x3 with wall_feature_right',
        width: 3,
        length: 3,
        height: 1,
        matrix: [
            [
                [2, 2, 2],
                [2, 2, 2],
                [2, 2, 2],
            ],
        ],
        ground_features: [
            {
                x: 1,
                y: 1,
                z: 0,
                properties: {},
            },
        ],
        wall_features: [
            {
                x: 1,
                y: 0,
                z: 0,
                properties: { Direction: 'Down Left' },
            },
        ],
        male_connectors: [
            { x: 3, y: 1, z: 0, },
            { x: -1, y: 1, z: 0, },
            { x: 1, y: 3, z: 0, },
        ],
        female_connectors: [
            { x: 2, y: 1, z: 0, },
            { x: 0, y: 1, z: 0, },
            { x: 1, y: 2, z: 0, },
        ],
    },
]

module.exports = parts
