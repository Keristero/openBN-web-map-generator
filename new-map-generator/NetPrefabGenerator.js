const Prefab = require('./Prefab.js')
const prefab_parts = require('./prefab_parts')
const {iterateOver3dMatrix} = require('../helpers')

function GenerateForRequirements({groundFeatures,wallFeatures}){
    let newPrefab = new Prefab()

    let placed_features = {
        ground_features:0,
        wall_features:0,
        arr_female_connectors:[]
    }

    let placements = []

    while(placed_features.ground_features < groundFeatures){
        let parts_with_ground_features = prefab_parts.filter((part)=>{
            if(part.ground_features.length > 0){
                return true
            }
        })
        let chosen_part = parts_with_ground_features[Math.floor(Math.random()*parts_with_ground_features.length)]
        let new_placement_position = find_placement(chosen_part,placements,placed_features)
        place_part(chosen_part,new_placement_position,placed_features,placements)
        console.log(`placed ground features`,placed_features.ground_features,'/',groundFeatures)
    }

    while(placed_features.wall_features < wallFeatures){
        let parts_with_wall_features = prefab_parts.filter((part)=>{
            if(part.wall_features.length > 0){
                return true
            }
        })
        let chosen_part = parts_with_wall_features[Math.floor(Math.random()*parts_with_wall_features.length)]
        let new_placement_position = find_placement(chosen_part,placements,placed_features)
        place_part(chosen_part,new_placement_position,placed_features,placements)
        console.log(`placed wall features`,placed_features.wall_features,'/',wallFeatures)
    }
    write_parts_to_prefab(newPrefab,placements)
    return newPrefab
}

function write_parts_to_prefab(){

}

function place_part(part,part_pos,placed_features,placements){
    console.log(`placing part at ${part_pos.x}, ${part_pos.y}, ${part_pos.z}`)
    let placement = {
        part,
        part_pos
    }

    //update list of all female connectors
    placed_features.arr_female_connectors = placed_features.arr_female_connectors.concat(part.female_connectors)
    placed_features.ground_features += part.ground_features.length
    placed_features.wall_features += part.wall_features.length
    
    //add placement to list of placements
    placements.push(placement)
}

function find_placement(partA,placements,placed_features){
    console.log(`finding placement for`,partA.name)
    let partA_pos = {
        x:0,
        y:0,
        z:0
    }

    let female_connectors = placed_features.arr_female_connectors

    //If no other parts are placed yet, just place this one
    if(placements.length == 0){
        return partA_pos
    }

    //first naive approach, just connect first male+female connector pair that works without collisions
    for(let male_connector of partA.male_connectors){
        for(let female_connector of female_connectors){
            partA_pos.x = female_connector.x - male_connector.x
            partA_pos.y = female_connector.y - male_connector.y
            partA_pos.z = female_connector.z - male_connector.z
            if (!does_part_at_position_overlap_placed_part(partA,partA_pos,placements)){
                return partA_pos
            }
        }
    }
    console.warn(`no placement found for part`)
    return null
}

function does_part_at_position_overlap_placed_part(partA,partA_pos,placements){
    for(let placement of placements){
        let partB = placement.part
        let partB_pos = placement.part_pos

        let z_overlap = partA_pos.z < partB_pos.z+partB.height && partA_pos.z+partA.height > partB_pos.z
        let y_overlap = partA_pos.y < partB_pos.y+partB.length && partA_pos.y+partA.length > partB_pos.y
        let x_overlap = partA_pos.x < partB_pos.z+partB.width && partA_pos.x+partA.width > partB_pos.x

        if(z_overlap && y_overlap && x_overlap){
            return true
        }
    }
    return false
}

module.exports = GenerateForRequirements