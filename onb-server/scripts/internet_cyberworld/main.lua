local ezevents = require('scripts/libs/ezevents')
local eznpcs = require('scripts/libs/eznpc')
local hyperlinks = require('scripts/internet_cyberworld/hyperlinks')

--Process each area on startup
local areas = Net.list_areas()
for i, area_id in next, areas do
    local objects = Net.list_objects(area_id)
    for i, object_id in next, objects do
        local object = Net.get_object_by_id(area_id, object_id)
        if object.type == "NPC" then
            eznpcs.create_bot_from_object(area_id, object_id)
        end
    end
end

ezevents.add_listener('hyperlinks_added_area',function ()
    --do things after a new area is generated
end)