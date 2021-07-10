const Prefab = require("./Prefab.js");
const prefab_parts = require("./prefab_parts");
const { iterateOver3dMatrix,generate3dMatrix,iterateOverGrid} = require("../helpers");

function GenerateForRequirements({ ground_features, wall_features }) {
    let newPrefab = new Prefab();

    let placed_features = {
        ground_features: 0,
        wall_features: 0,
        arr_female_connectors: [],
    };

    let placements = [];

    while (placed_features.ground_features < ground_features) {
        let parts_with_ground_features = prefab_parts.filter((part) => {
            if (part.ground_features.length > 0) {
                return true;
            }
        });
        let chosen_part = parts_with_ground_features[Math.floor(Math.random() * parts_with_ground_features.length)];
        let new_placement_position = find_placement(chosen_part, placements, placed_features);
        place_part(chosen_part, new_placement_position, placed_features, placements);
        console.log(`placed ground features`, placed_features.ground_features, "/", ground_features);
    }

    while (placed_features.wall_features < wall_features) {
        let parts_with_wall_features = prefab_parts.filter((part) => {
            if (part.wall_features.length > 0) {
                return true;
            }
        });
        let chosen_part = parts_with_wall_features[Math.floor(Math.random() * parts_with_wall_features.length)];
        let new_placement_position = find_placement(chosen_part, placements, placed_features);
        place_part(chosen_part, new_placement_position, placed_features, placements);
        console.log(`placed wall features`, placed_features.wall_features, "/", wall_features);
    }
    write_parts_to_prefab(newPrefab, placements);
    return newPrefab;
}

function write_parts_to_prefab(prefab, placements) {
    //Find dimensions of prefab and generate a 3d array with the same dimensions
    let part_max_x = -Infinity;
    let part_max_y = -Infinity;
    let part_max_z = -Infinity;
    let part_start_x = Infinity;
    let part_start_y = Infinity;
    let part_start_z = Infinity;
    for (let placement of placements) {
        let part_max_x = placement.part_pos.x + placement.part.width;
        let part_max_y = placement.part_pos.y + placement.part.length;
        let part_max_z = placement.part_pos.z + placement.part.height;
        if (part_max_x > part_max_x) {
            part_max_x = part_max_x;
        }
        if (part_max_x > part_max_x) {
            part_max_y = part_max_y;
        }
        if (part_max_z > part_max_z) {
            part_max_z = part_max_z;
        }
        if (placement.part_pos.x < part_start_x) {
            part_start_x = placement.part_pos.x;
        }
        if (placement.part_pos.y < part_start_y) {
            part_start_y = placement.part_pos.y;
        }
        if (placement.part_pos.z < part_start_z) {
            part_start_z = placement.part_pos.z;
        }
    }
    let width = Math.abs(part_max_x-part_start_x)
    let length = Math.abs(part_max_y-part_start_y)
    let height = Math.abs(part_max_z-part_start_z)
    prefab.matrix = generate3dMatrix(width,length,height,0)

    //loop over each part and copy it's array contents to the 3d array
    for (let placement of placements) {
        let part_matrix_iterator = iterateOver3dMatrix(placement.part.matrix)
        for(let grid_pos of part_matrix_iterator){
            let x = part_start_x+grid_pos.x
            let y = part_start_y+grid_pos.y
            let z = part_start_z+grid_pos.z
        }
    }

    //add each feature from each part into the prefab
    let feature_collections = ["ground_features", "wall_features"];
    for (let feature_collection_name of feature_collections) {
        for (let placement of placements) {
            let part = placement.part;
            for (let feature of part[feature_collection_name]) {
                let x = placement.part_pos.x + feature.x;
                let y = placement.part_pos.y + feature.y;
                let z = placement.part_pos.z + feature.z;
                prefab.AddFeature(feature_collection_name, x, y, z, feature.properties);
            }
        }
    }
}

function place_part(part, part_pos, placed_features, placements) {
    console.log(`placing part at ${part_pos.x}, ${part_pos.y}, ${part_pos.z}`);
    let placement = {
        part,
        part_pos,
    };

    //update list of all female connectors
    placed_features.arr_female_connectors = placed_features.arr_female_connectors.concat(part.female_connectors);
    placed_features.ground_features += part.ground_features.length;
    placed_features.wall_features += part.wall_features.length;

    //add placement to list of placements
    placements.push(placement);
}

function find_placement(partA, placements, placed_features) {
    console.log(`finding placement for`, partA.name);
    let partA_pos = {
        x: 0,
        y: 0,
        z: 0,
    };

    let female_connectors = placed_features.arr_female_connectors;

    //If no other parts are placed yet, just place this one
    if (placements.length == 0) {
        return partA_pos;
    }

    //first naive approach, just connect first male+female connector pair that works without collisions
    for (let male_connector of partA.male_connectors) {
        for (let female_connector of female_connectors) {
            partA_pos.x = female_connector.x - male_connector.x;
            partA_pos.y = female_connector.y - male_connector.y;
            partA_pos.z = female_connector.z - male_connector.z;
            if (!does_part_at_position_overlap_placed_part(partA, partA_pos, placements)) {
                return partA_pos;
            }
        }
    }
    console.warn(`no placement found for part`);
    return null;
}

function does_part_at_position_overlap_placed_part(partA, partA_pos, placements) {
    for (let placement of placements) {
        let partB = placement.part;
        let partB_pos = placement.part_pos;

        let z_overlap = partA_pos.z < partB_pos.z + partB.height && partA_pos.z + partA.height > partB_pos.z;
        let y_overlap = partA_pos.y < partB_pos.y + partB.length && partA_pos.y + partA.length > partB_pos.y;
        let x_overlap = partA_pos.x < partB_pos.z + partB.width && partA_pos.x + partA.width > partB_pos.x;

        if (z_overlap && y_overlap && x_overlap) {
            return true;
        }
    }
    return false;
}

module.exports = GenerateForRequirements
