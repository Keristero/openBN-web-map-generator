--Logic specific to internet_cyberworld
local ezlisteners = require('scripts/ezlibs-scripts/ezlisteners')
local eznpcs = require('scripts/ezlibs-scripts/eznpcs/eznpcs')
local hyperlinks = require('scripts/internet_cyberworld/hyperlinks')

local internet_cyberworld = {}

ezlisteners.add_listener('new_area_added', function(area_id)
    --add npcs to areas added while server is running
    eznpcs.add_npcs_to_area(area_id)
end)

-- color bots on transfer
local bot_color = { r = 50, g = 248, b = 109, a = 255 }

function internet_cyberworld.handle_player_transfer(player_id)
    local area_id = Net.get_player_area(player_id)

    for _, bot_id in ipairs(Net.list_bots(area_id)) do
        Net.set_bot_minimap_color(bot_id, bot_color)
    end
end

function internet_cyberworld.handle_object_interaction(player_id, object_id)
    hyperlinks.handle_object_interaction(player_id, object_id)
end

print('[internet_cyberworld] loaded')
return internet_cyberworld