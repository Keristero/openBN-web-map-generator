const Prefab = require('./Prefab.js')
const prefab_parts = require('./prefab_parts')
const { iterateOver3dMatrix, generate3dMatrix, iterateOverGrid } = require('../helpers')

function GenerateForRequirements({ ground_features, wall_features, stairs }) {
    console.log(`generating prefab with requirements`,{ ground_features, wall_features, stairs })
    let newPrefab = new Prefab()

    ground_features = Math.max(ground_features,0)

    let placed_features = {
        ground_features: 0,
        wall_features: 0,
        stairs:0,
        arr_female_connectors: [],
    }

    let placements = []
    let parts_with_ground_features = prefab_parts.filter((part) => {
        if (part.ground_features.length > 0) {
            return true
        }
    })
    while (placed_features.ground_features < ground_features) {
        let chosen_part = parts_with_ground_features[Math.floor(Math.random() * parts_with_ground_features.length)]
        let new_placement_position = find_placement(chosen_part, placements, placed_features)
        place_part(chosen_part, new_placement_position, placed_features, placements)
    }

    let parts_with_wall_features = prefab_parts.filter((part) => {
        if (part.wall_features.length > 0) {
            return true
        }
    })
    while (placed_features.wall_features < wall_features) {
        let chosen_part = parts_with_wall_features[Math.floor(Math.random() * parts_with_wall_features.length)]
        let new_placement_position = find_placement(chosen_part, placements, placed_features)
        place_part(chosen_part, new_placement_position, placed_features, placements)
    }

    let parts_with_stairs = prefab_parts.filter((part) => {
        if(part.is_stairs){
            return true
        }
    })
    while (placed_features.stairs < stairs){
        console.log(`placing stairs ${placed_features.stairs} / ${stairs}`)
        let chosen_part = parts_with_stairs[Math.floor(Math.random() * parts_with_stairs.length)]
        let new_placement_position = find_placement(chosen_part, placements, placed_features)
        place_part(chosen_part, new_placement_position, placed_features, placements)
    }
    if(placements.length == 0){
        //if nothing was placed, add default prefab so that we dont crash V8 lol
        let chosen_part = prefab_parts[0]
        let new_placement_position = find_placement(chosen_part, placements, placed_features)
        place_part(chosen_part, new_placement_position, placed_features, placements)
    }
    write_parts_to_prefab(newPrefab, placements)
    return newPrefab
}

function write_parts_to_prefab(prefab, placements) {
    const wall_padding = 1 //a tile on each size to allow for empty space where paths are expensive for pathfinding (walls)
    const wall_id = 1 //tile id of walls
    //Find dimensions of prefab and generate a 3d array with the same dimensions
    let part_max_x = -Infinity
    let part_max_y = -Infinity
    let part_max_z = -Infinity
    let part_start_x = Infinity
    let part_start_y = Infinity
    let part_start_z = Infinity
    for (let placement of placements) {
        let part_end_x = placement.part_pos.x + placement.part.width;
        let part_end_y = placement.part_pos.y + placement.part.length;
        let part_end_z = placement.part_pos.z + placement.part.height;
        if (part_end_x >= part_max_x) {
            part_max_x = part_end_x;
        }
        if (part_end_y >= part_max_y) {
            part_max_y = part_end_y;
        }
        if (part_end_z >= part_max_z) {
            part_max_z = part_end_z;
        }
        if (placement.part_pos.x <= part_start_x) {
            part_start_x = placement.part_pos.x
        }
        if (placement.part_pos.y <= part_start_y) {
            part_start_y = placement.part_pos.y
        }
        if (placement.part_pos.z <= part_start_z) {
            part_start_z = placement.part_pos.z
        }
    }
    let width = Math.abs(part_max_x-part_start_x)+(wall_padding*2)
    let length = Math.abs(part_max_y-part_start_y)+(wall_padding*2)
    let height = Math.abs(part_max_z-part_start_z)
    prefab.matrix = generate3dMatrix(width,length,height,0)

    //loop over each part and copy it's array contents to the 3d array
    for (let placement of placements) {
        let part_matrix_iterator = iterateOver3dMatrix(placement.part.matrix)
        for(let grid_pos of part_matrix_iterator){
            let x = -part_start_x + placement.part_pos.x + grid_pos.x + wall_padding
            let y = -part_start_y + placement.part_pos.y + grid_pos.y + wall_padding
            let z = -part_start_z + placement.part_pos.z + grid_pos.z
            prefab.matrix[z][y][x] = grid_pos.tileID
            //also add walls around it if we can
            //TODO find a better way to do this, it could be really slow
            if(prefab.matrix[z][y][x-1] == 0){
                prefab.matrix[z][y][x-1] = 1
            }
            if(prefab.matrix[z][y][x+1] == 0){
                prefab.matrix[z][y][x+1] = 1
            }
            if(prefab.matrix[z][y-1][x] == 0){
                prefab.matrix[z][y-1][x] = 1
            }
            if(prefab.matrix[z][y+1][x] == 0){
                prefab.matrix[z][y+1][x] = 1
            }
            if(prefab.matrix[z][y-1][x-1] == 0){
                prefab.matrix[z][y-1][x-1] = 1
            }
            if(prefab.matrix[z][y+1][x+1] == 0){
                prefab.matrix[z][y+1][x+1] = 1
            }
            if(prefab.matrix[z][y-1][x+1] == 0){
                prefab.matrix[z][y-1][x+1] = 1
            }
            if(prefab.matrix[z][y+1][x-1] == 0){
                prefab.matrix[z][y+1][x-1] = 1
            }
        }
    }

    //add each feature from each part into the prefab
    let feature_collections = ['ground_features','male_connectors','female_connectors', 'wall_features']
    let directions = ['Up Left','Up Right','Down Left','Down Right']
    for (let feature_collection_name of feature_collections) {
        for (let placement of placements) {
            let part = placement.part
            for (let feature of part[feature_collection_name]) {
                let x = -part_start_x + placement.part_pos.x + wall_padding + feature.x
                let y = -part_start_y + placement.part_pos.y + wall_padding + feature.y
                let z = -part_start_z + placement.part_pos.z + feature.z
                if(feature.properties){
                    if(!feature.properties.Direction){
                        feature.properties.Direction = directions[Math.floor(Math.random()*directions.length)]
                    }
                }
                prefab.AddFeature(feature_collection_name, x, y, z, feature.properties)
            }
        }
    }
}

function place_part(part, part_pos, placed_features, placements) {
    console.log(`placing part at ${part_pos.x}, ${part_pos.y}, ${part_pos.z}`)
    let placement = {
        part,
        part_pos,
    }

    //update list of all female connectors
    for(let connector of part.female_connectors){
        //convert connector coordinates to global
        let global_connector = {
            x:connector.x+part_pos.x,
            y:connector.y+part_pos.y,
            z:connector.z+part_pos.z
        }
        placed_features.arr_female_connectors.push(global_connector)
    }
    placed_features.ground_features += part.ground_features.length
    placed_features.wall_features += part.wall_features.length
    if(part.is_stairs){
        placed_features.stairs += 1
    }

    //add placement to list of placements
    placements.push(placement)
}

function find_placement(partA, placements, placed_features) {
    console.log(`finding placement for`, partA.name)

    let female_connectors = placed_features.arr_female_connectors

    //If no other parts are placed yet, just place this one
    if (placements.length == 0) {
        return {
            x: 0,
            y: 0,
            z: 0,
        }
    }

    //first naive approach, just connect first male+female connector pair that works without collisions
    /*
    for (let male_connector of partA.male_connectors) {
        for (let female_connector of female_connectors) {
            partA_pos.x = female_connector.x - male_connector.x
            partA_pos.y = female_connector.y - male_connector.y
            partA_pos.z = female_connector.z - male_connector.z
            if (!does_part_at_position_overlap_placed_part(partA, partA_pos, placements)) {
                return partA_pos
            }
        }
    }
    */

    //more random approach, add all valid placements to list and pick one randomly
    let valid_placements = []
    for (let male_connector of partA.male_connectors) {
        for (let female_connector of female_connectors) {
            let partA_pos = {
                x: 0,
                y: 0,
                z: 0,
            }
            partA_pos.x = female_connector.x - male_connector.x
            partA_pos.y = female_connector.y - male_connector.y
            partA_pos.z = female_connector.z - male_connector.z
            if (!does_part_at_position_overlap_placed_part(partA, partA_pos, placements)) {
                valid_placements.push(partA_pos)
            }
        }
    }
    if(valid_placements.length > 0){
        return valid_placements[Math.floor(Math.random() * valid_placements.length)]
    }
    console.warn(`no placement found for part`,partA,female_connectors)
    return null
}

function does_part_at_position_overlap_placed_part(partA, partA_pos, placements) {
    for (let placement of placements) {
        let partB = placement.part
        let partB_pos = placement.part_pos

        let z_overlap = partA_pos.z <= partB_pos.z + partB.height && partA_pos.z + partA.height > partB_pos.z
        let y_overlap = partA_pos.y <= partB_pos.y + partB.length && partA_pos.y + partA.length > partB_pos.y
        let x_overlap = partA_pos.x <= partB_pos.x + partB.width && partA_pos.x + partA.width > partB_pos.x

        if (z_overlap && y_overlap && x_overlap) {
            return true
        }
    }
    return false
}

module.exports = GenerateForRequirements
