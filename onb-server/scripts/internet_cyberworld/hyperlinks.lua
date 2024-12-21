local json = require('scripts/ezlibs-scripts/json')

local player_last_warp_info = {}
local area_warps_active = {}
local link_to_tmx = {}
local existing_areas = Net.list_areas()
for index, value in ipairs(existing_areas) do
    print("existing area", index, value)
end

local websites_being_generated = {}
local website_generation_queue = {}
local max_generated_at_time = 10

local lib = {}

function lib.handle_custom_warp(player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local link_object = Net.get_object_by_id(area_id, object_id)
    local url = link_object.custom_properties['link']
    local is_back_link = link_object.custom_properties['is_back_link']
    if is_back_link then
        local last_warp_info = player_last_warp_info[area_id][player_id]
        transfer_player_from_warp_to_warp(player_id, area_id, last_warp_info.area_id, link_object.id, last_warp_info.warp_id, true)
        return
    end
    if url then
        --if the warp is inactive, warp the player back to where they were
        if not area_warps_active[area_id] or not area_warps_active[area_id][link_object.id] then
            print("[hyperlinks] warp not active yet")
            Net.message_player(player_id, "The next area is offline")
            local direction = link_object.custom_properties['Direction']
            Net.transfer_player(player_id, area_id, true, link_object.x, link_object.y, link_object.z, direction)
            return
        end

        --get link details
        local target_area_id = area_warps_active[area_id][link_object.id]

        --transfer player
        local target_area_properties = Net.get_area_custom_properties(target_area_id)
        transfer_player_from_warp_to_warp(player_id, area_id, target_area_id, link_object.id, target_area_properties.entry_warp_id, false)
    end
end

function lib.handle_player_transfer(player_id)
    print('[hyperlinks] handle player transfer',player_id)
    local area_id = Net.get_player_area(player_id)
    prepare_all_warps_in_area(area_id)
end

function lib.handle_player_join(player_id)
    print('[hyperlinks] handle player join',player_id)
    local area_id = Net.get_player_area(player_id)
    prepare_all_warps_in_area(area_id)
end


function prepare_all_warps_in_area(area_id)
    local objects = Net.list_objects(area_id)
    for index, object_id in pairs(objects) do
        local object = Net.get_object_by_id(area_id, object_id)
        if object.custom_properties.link and object.custom_properties.text then
            queue_hyperlink_preperation(area_id,object)
        end
    end
end

function tablelength(T)
    local count = 0
    for _ in pairs(T) do count = count + 1 end
    return count
end

function map_is_already_loaded(asset_path)
    return Net.has_asset(asset_path)
end

function queue_hyperlink_preperation(area_id,object)
    table.insert(website_generation_queue,1,{area_id=area_id,object=object})
    try_prepare_next_hyperlink_from_queue()
end

function try_prepare_next_hyperlink_from_queue()
    local generating_currently = tablelength(websites_being_generated)
    local queue_length = tablelength(website_generation_queue)
    print('generating '..generating_currently..' / '..max_generated_at_time..' maps, '..queue_length..' in queue')
    if generating_currently < max_generated_at_time then
        local next_item = table.remove(website_generation_queue,1)
        if next_item then
            prepare_hyperlink(next_item.area_id,next_item.object)
        end
    end
end

Net:on("new_area_added", function(event)
    --add npcs to areas added while server is running
    try_prepare_next_hyperlink_from_queue()
end)

function prepare_hyperlink(area_id,link_object)
    --get link details
    local link = link_object.custom_properties.link
    local text = link_object.custom_properties.text
    --Generate a map
    if websites_being_generated[link] then
        print('[hyperlinks] '..link..' is already being generated...')
        return
    end
    websites_being_generated[link] = true
    Async.promisify(coroutine.create(function()
        local generate_map_promise = generate_linked_map(link, text)
        local area_info = Async.await(generate_map_promise)
        if area_info.status ~= "ok" then
            print('[hyperlinks] map generation failed'..link)
            return
        end
        print('[hyperlinks] received map info ' .. area_info.area_path)

        if area_info.fresh then
            print('[hyperlinks] new map was generated ' .. area_info.area_path)
            --If the map was just generated

            --Read new generated map file
            local read_file_promise = Async.read_file(area_info.area_path)
            local area_data = Async.await(read_file_promise)
            --Add area to server
            print("[hyperlinks] read tmx, updating area " .. area_info.area_id)
            Net.update_area(area_info.area_id, area_data)
            print("[hyperlinks] updated area " .. area_info.area_id)

            local n_area_properties = Net.get_area_custom_properties(area_info.area_id)


            print("[hyperlinks] loading assets...")
            local tilesheet_promises = {}

            local end_characters = string.len("background.png")
            local warp_active_texture_server_path = string.sub(n_area_properties["Background Texture"], 0, string.len(n_area_properties["Background Texture"]) - end_characters)
            warp_active_texture_server_path = warp_active_texture_server_path .."warp_active.png"
            local background_texture_relative_path = n_area_properties["Background Texture"]:gsub("/server/", "./")
            local background_animation_relative_path = n_area_properties["Background Animation"]:gsub("/server/", "./")

            local warp_active_texture_relative_path = warp_active_texture_server_path:gsub("/server/", "./")

            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(background_texture_relative_path)
            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(background_animation_relative_path)
            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(warp_active_texture_relative_path)
            for index, value in ipairs(area_info.assets) do
                tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(value)
            end
            Async.await_all(tilesheet_promises)
            print("[hyperlinks] loaded all assets!")
            Net:emit('new_area_added',area_info.area_id)
        else
            print('[hyperlinks] area already existed' .. area_info.area_path)
        end
        if not area_warps_active[area_id] then
            area_warps_active[area_id] = {}
        end
        websites_being_generated[link] = nil
        --if the warp is not already active, spawn a bot and activate it
        if not area_warps_active[area_id][link_object.id] then
            --link to area mapping, 
            local n_area_properties = Net.get_area_custom_properties(area_info.area_id)
            local end_characters = string.len("background.png")
            local warp_active_texture_server_path = string.sub(n_area_properties["Background Texture"], 0, string.len(n_area_properties["Background Texture"]) - end_characters)
            warp_active_texture_server_path = warp_active_texture_server_path .."warp_active.png"
            area_warps_active[area_id][link_object.id] = area_info.area_id
            spawn_warp_active_overlay_bot(area_id, link_object, link, warp_active_texture_server_path)
        end
    end))
end

function spawn_warp_active_overlay_bot(area_id, link_object, link_url, warp_overlay_texture_path)
    local bot_name = link_url
    local static_anim_path = '/server/assets/shared/objects/link_overlay_bot.animation'
    local offset_to_fix_sorting = 1/32
    local bot_info = { name=bot_name, area_id=area_id, warp_in=false, texture_path=warp_overlay_texture_path, animation_path=static_anim_path, x=link_object.x+offset_to_fix_sorting, y=link_object.y+offset_to_fix_sorting, z=link_object.z}
    Net.create_bot(bot_info) -- bot_id
end

function load_asset_promise(system_asset_path)
    local co = coroutine.create(function()
        if not Net.has_asset(system_asset_path) then
            print("[hyperlinks] loading new asset " .. system_asset_path)
            local read_asset_promise = Async.read_file(system_asset_path)
            local asset_data = Async.await(read_asset_promise)

            local server_asset_path = system_asset_path:gsub("%./", "/server/")
            print("[hyperlinks] new asset name (server) " .. server_asset_path)
            Net.update_asset(server_asset_path, asset_data)
        else
            print("[hyperlinks] asset already exists " .. server_asset_path)
        end
    end)
    return Async.promisify(co)
end

function transfer_player_from_warp_to_warp(player_id, from_area_id, to_area_id, from_warp_id, to_warp_id, used_back_link)
    print('[hyperlinks] transfering player to ' .. to_area_id)
    local destination_warp = Net.get_object_by_id(to_area_id, to_warp_id)
    if not player_last_warp_info[to_area_id] then
        player_last_warp_info[to_area_id] = {}
    end
    if not used_back_link then
        player_last_warp_info[to_area_id][player_id] = { area_id = from_area_id, warp_id = from_warp_id }
    end
    Net.transfer_player(player_id, to_area_id, true, destination_warp.x, destination_warp.y, destination_warp.z, destination_warp.custom_properties.Direction)
end

function generate_linked_map(link, text)
    return async(function()
        print('generating '..link)
        local url = "http://localhost:3000"
        local headers = {}
        headers["Content-Type"] = "application/json"
        local body = {
            link = link,
            text = text
        }
        local response = await(Async.request(url, {
            method = "POST",
            headers = headers,
            body = json.encode(body)
        }))
        local data = json.decode(response.body)
        return data
    end)
end

print('[hyperlinks] loaded')

return lib
