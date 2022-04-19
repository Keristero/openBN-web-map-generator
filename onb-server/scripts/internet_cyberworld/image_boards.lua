local lib = {}

lib.handle_object_interaction = function(player_id,object_id, button)
    local area_id = Net.get_player_area(player_id)
    local image_object = Net.get_object_by_id(area_id, object_id)
    --Only check 'link' interactions
    if image_object.type ~= "image" or not image_object.custom_properties.text then
        return
    end
    Net.message_player(player_id,image_object.custom_properties.text)
end
print('[image_boards] loaded')
return lib