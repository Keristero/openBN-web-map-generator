let parts = [
    {
        name: '3x3 with ground_feature',
        width: 3,
        length: 3,
        height: 0,
        grid: [
            [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
            ],
        ],
        ground_features: [
            {
                pos: { x: 1, y: 1, z: 0 },
                properties: {},
            },
        ],
        wall_features: [],
        male_connectors: [
            {
                x: -1,
                y: 1,
                z: 0,
            },
            {
                x: 3,
                y: 1,
                z: 0,
            },
            {
                x: 1,
                y: -1,
                z: 0,
            },
            {
                x: 1,
                y: 3,
                z: 0,
            },
        ],
        female_connectors: [
            {
                x: 0,
                y: 1,
                z: 0,
            },
            {
                x: 2,
                y: 1,
                z: 0,
            },
            {
                x: 1,
                y: 0,
                z: 0,
            },
            {
                x: 1,
                y: 2,
                z: 0,
            },
        ],
    },
    {
        name: '3x3 with wall_features',
        width: 3,
        length: 3,
        height: 0,
        grid: [
            [
                [1, 1, 1],
                [1, 1, 1],
                [1, 1, 1],
            ],
        ],
        ground_features: [],
        wall_features: [
            {
                pos: { x: 1, y: 0, z: 0 },
                properties: { Direction: 'Down Left' },
            },
            {
                pos: { x: 0, y: 1, z: 0 },
                properties: { Direction: 'Down Right' },
            },
        ],
        male_connectors: [
            { x: 3, y: 1, z: 0 },
            { x: 1, y: 3, z: 0 },
        ],
        female_connectors: [
            { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
        ],
    },
]

module.exports = parts
