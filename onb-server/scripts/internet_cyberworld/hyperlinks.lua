local json = require('scripts/ezlibs-scripts/json')
local ezlisteners = require('scripts/ezlibs-scripts/ezlisteners')

local currently_generating = {}
local player_last_warp_info = {}
local existing_areas = Net.list_areas()
for index, value in ipairs(existing_areas) do
    print("existing area", index, value)
end

local lib = {}

function lib.handle_object_interaction(player_id, object_id, button)
    print('player interacted', player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local link_object = Net.get_object_by_id(area_id, object_id)
    --Only check 'link' interactions
    if link_object.type == "link" or link_object.type == "back_link" then
        on_link_interaction(player_id, link_object)
    end
end

function map_is_already_loaded(map_id)
    Net.has_asset(server_path)
end

function on_link_interaction(player_id, link_object)
    --TODO insert check here to see if the map is already loaded
    local current_area_id = Net.get_player_area(player_id)

    --check if map is already being generated
    if currently_generating[link_object.id] then
        print("[hyperlinks] already generating this area....")
        Net.message_player(player_id, link_object.custom_properties.text .. " is being generated...")
        return
    end
    currently_generating[link_object.id] = true

    --get link details
    local link = link_object.custom_properties.link
    local text = link_object.custom_properties.text

    --If it is a back link, overwrite destination link to previous url the player was at
    if link_object.type == "back_link" then
        local last_warp_info = player_last_warp_info[current_area_id][player_id]
        currently_generating[link_object.id] = false
        transfer_player_from_warp_to_warp(player_id, current_area_id, last_warp_info.area_id, link_object.id, last_warp_info.warp_id, true)
        return
    end

    --Generate a map
    Async.promisify(coroutine.create(function()
        Net.message_player(player_id, "going to " .. link_object.custom_properties.text)
        local generate_map_promise = generate_linked_map(player_id, link, text)
        local area_info = Async.await(generate_map_promise)
        if area_info.status ~= "ok" then
            print('[hyperlinks] map generation failed')
            Net.message_player(player_id, link_object.custom_properties.text .. " failed to generate")
            currently_generating[link_object.id] = nil
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
            warp_active_texture_server_path = string.sub(n_area_properties["Background Texture"], 0, string.len(n_area_properties["Background Texture"]) - end_characters)
            warp_active_texture_server_path = warp_active_texture_server_path .."warp_active.png"
            local background_texture_relative_path = n_area_properties["Background Texture"]:gsub("/server/", "./")
            local background_animation_relative_path = n_area_properties["Background Animation"]:gsub("/server/", "./")

            local warp_active_texture_relative_path = warp_active_texture_server_path:gsub("/server/", "./")

            print("warp active path = " .. warp_active_texture_server_path)
            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(background_texture_relative_path)
            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(background_animation_relative_path)
            tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(warp_active_texture_relative_path)
            for index, value in ipairs(area_info.assets) do
                tilesheet_promises[#tilesheet_promises + 1] = load_asset_promise(value)
            end
            Async.await_all(tilesheet_promises)
            print("[hyperlinks] loaded all assets!")
            currently_generating[link_object.id] = nil
            ezlisteners.broadcast_event('new_area_added', area_info.area_id)
            spawn_warp_active_overlay_bot(current_area_id, link_object, link, warp_active_texture_server_path)
        else
            currently_generating[link_object.id] = nil
            print('[hyperlinks] area already existed, transfering right away ' .. area_info.area_path)
        end
        local n_area_properties = Net.get_area_custom_properties(area_info.area_id)
        transfer_player_from_warp_to_warp(player_id, current_area_id, area_info.area_id, link_object.id, n_area_properties.entry_warp_id, false)
    end))
end

function spawn_warp_active_overlay_bot(area_id, link_object, link_url, warp_overlay_texture_path)
    local bot_name = link_url
    local static_anim_path = '/server/assets/shared/objects/link_overlay_bot.animation'
    local bot_info = { name=bot_name, area_id=area_id, warp_in=false, texture_path=warp_overlay_texture_path, animation_path=static_anim_path, x=link_object.x, y=link_object.y, z=link_object.z}
    print(bot_info.name)
    print(bot_info.area_id)
    print(bot_info.warp_in)
    print(bot_info.texture_path)
    print(bot_info.animation_path)
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

function generate_linked_map(player_id, link, text)
    local url = "http://localhost:3000"
    local headers = {}
    headers["Content-Type"] = "application/json"
    local body = {
        player_id = player_id,
        link = link,
        text = text
    }

    local request_promise = Async.request(url, {
        method = "post",
        headers = headers,
        body = json.encode(body)
    })

    -- Create coroutine which awaits request response
    local co = coroutine.create(function()
        print('requesting')
        local response = Async.await(request_promise)
        print('got response')
        print(response.body)
        local data = json.decode(response.body)
        return data
    end)
    return Async.promisify(co)
end

return lib
