--Logic specific to internet_cyberworld
local ezevents = require('scripts/internet_cyberworld/events')
local hyperlinks = require('scripts/internet_cyberworld/hyperlinks')

function add_npcs_to_area(area_id)
    print('internet cyberworld, adding npcs to area... not implemented yet')
end

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