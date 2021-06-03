local eznpcs = {}

npc_asset_folder = '/server/assets/shared/ez_npc'
generic_npc_animation_path = npc_asset_folder..'/sheet/npc.animation'
lastBotId = 0
npcs = {}
npc_required_properties = {"Direction","npc_asset_name","npc_type"}

function CreateBotFromObject(area_id,object_id)
    local placeholder_object = Net.get_object_by_id(area_id, object_id)
    x = placeholder_object.x
    y = placeholder_object.y
    z = placeholder_object.z

    for i, prop_name in pairs(npc_required_properties) do
        if not placeholder_object.custom_properties[prop_name] then
            print('[eznpcs] NPC objects require the custom property '..prop_name)
            return false
        end
    end  

    npc_asset_name = placeholder_object.custom_properties.npc_asset_name
    direction = placeholder_object.custom_properties.Direction

    CreateBot(area_id,npc_asset_name,x,y,z,direction)
end

function CreateBot(area_id,asset_name,x,y,z,direction,is_solid,bot_name)
    lastBotId = lastBotId + 1
    texture_path = npc_asset_folder.."/sheet/"..asset_name..".png"
    animation_path = npc_animation_file or generic_npc_animation_path
    print('texture path: '..texture_path)
    name = bot_name or nil
    solid = is_solid or true
    bot_options = { name, area_id, texture_path, animation_path, x, y, z, direction, solid }
    Net.create_bot(lastBotId, bot_options)
    npcs[lastBotId] = {bot_id=lastBotId}
    print('[eznpcs] created npc at ('..x..','..y..','..z..')')
end

--Interface
function eznpcs.create_bot_from_object(area_id,object_id)
    return ( CreateBotFromObject(area_id,object_id) )
end
function eznpcs.create_bot(area_id,asset_name,x,y,z,direction,is_solid,bot_name)
    return ( CreateBot(area_id,asset_name,x,y,z,direction,is_solid,bot_name) )
end

return eznpcs