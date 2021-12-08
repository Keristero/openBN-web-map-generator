--eznpcs main.lua
local eznpcs = require('scripts/libs/eznpcs')

function add_npcs_to_area(area_id)
    local objects = Net.list_objects(area_id)
    for i, object_id in next, objects do
        local object = Net.get_object_by_id(area_id, object_id)
        if object.type == "NPC" then
            eznpcs.create_npc_from_object(area_id, object_id)
        end
    end
end

--Process each area on startup
local areas = Net.list_areas()
for i, area_id in next, areas do
    --Add npcs to existing areas on startup
    add_npcs_to_area(area_id)
end

function handle_actor_interaction(player_id, actor_id)
    --handle interactions with NPCs
    eznpcs.on_actor_interaction(player_id,actor_id)
end

function tick(delta_time)
    --handle on tick behaviours for NPCs
    eznpcs.on_tick(delta_time)
end

--Logic specific to internet_cyberworld
local ezevents = require('scripts/libs/ezevents')
local hyperlinks = require('scripts/internet_cyberworld/hyperlinks')

ezevents.add_listener('new_area_added',function (area_id)
    --add npcs to areas added while server is running
    add_npcs_to_area(area_id)
end)

-- color bots on transfer
local bot_color = { r = 50, g = 248, b = 109, a = 255 }

function handle_player_transfer(player_id)
  local area_id = Net.get_player_area(player_id)

  for _, bot_id in ipairs(Net.list_bots(area_id)) do
    Net.set_bot_minimap_color(bot_id, bot_color)
  end
end