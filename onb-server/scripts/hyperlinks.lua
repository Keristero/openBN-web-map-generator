local json = require('scripts/libs/json')


local tasks = {}

function handle_object_interaction(player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local object = Net.get_object_by_id(area_id, object_id)
    if object.type ~= "link" then
        return
    end
    local url = object.custom_properties.url

end
