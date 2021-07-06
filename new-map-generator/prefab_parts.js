let parts = [
    {
        name:"3x3 with ground_feature",
        width: 3,
        length: 3,
        height:0,
        grid:[
            [
                [1,1,1],
                [1,1,1],
                [1,1,1]
            ]
        ],
        features:[
            {
                pos:{x:1,y:1},
                type:"ground_feature",
                properties:{}
            }
        ],
        connections:[
            {
                x:-1,
                y:1,
                z:0
            },
            {
                x:3,
                y:1,
                z:0
            },
            {
                x:1,
                y:-1,
                z:0
            },
            {
                x:1,
                y:3,
                z:0
            }
        ]
    },
    {
        name:"3x3 with wall_features",
        width: 3,
        length: 3,
        height:0,
        grid:[
            [
                [1,1,1],
                [1,1,1],
                [1,1,1]
            ]
        ],
        features:[
            {
                pos:{x:1,y:0},
                type:"wall_feature",
                properties:{Direction:"Down Left"}
            },
            {
                pos:{x:0,y:1},
                type:"wall_feature",
                properties:{Direction:"Down Right"}
            }
        ],
        connections:[
            {
                pos:{x:3,y:1,z:0}
            },
            {
                pos:{x:1,y:3,z:0}
            }
        ]
    }
]