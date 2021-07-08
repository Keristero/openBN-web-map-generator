const Prefab = require('./Prefab.js')
const prefab_parts = require('./prefab_parts')

function GenerateForRequirements({groundFeatures,wallFeatures}){
    let newPrefab = new Prefab()
    let added_ground_features = 0
    let added_wall_features = 0
    let placed_features = {
        ground_features:0,
        wall_features:0,
        arr_connectors:[]
    }

    let placed_parts = []

    while(placed_features.ground_features < groundFeatures){
        let parts_with_ground_features = prefab_parts.filter((part)=>{
            if(part.ground_features.length > 0 && part.ground_features.length <= groundFeatures-placed_features.ground_features){
                return true
            }
        })
        let chosen_part = parts_with_ground_features[Math.floor(Math.random()*parts_with_ground_features.length)]
        let new_placement_position = find_placement(chosen_part,placed_parts)
        place_part(chosen_part,new_placement_position)
    }

    while(placed_features.wall_features < wallFeatures){
        let parts_with_wall_features = prefab_parts.filter((part)=>{
            if(part.wall_features.length > 0 && part.wall_features.length <= wallFeatures-placed_features.wall_features){
                return true
            }
        })
        let chosen_part = parts_with_wall_features[Math.floor(Math.random()*parts_with_wall_features.length)]
        let new_placement_position = find_placement(chosen_part,placed_parts)
        place_part(chosen_part,new_placement_position)
    }
    return newPrefab
}

function place_part(part,part_pos){
    let placement = {
        part,
        part_pos
    }
    placed_parts.push(placement)
}

function find_placement(part,placed_parts){
    let part_pos = {
        x:0,
        y:0,
        z:0
    }

    //If no other parts are placed yet, just place this one
    if(placed_parts.length == 0){
        return part_pos
    }
}