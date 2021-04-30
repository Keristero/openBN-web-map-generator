local json = require('scripts/libs/json')

local currently_generating = {}
local player_last_area_url = {}

function handle_object_interaction(player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local area_properties = Net.get_area_custom_properties(area_id)
    local object = Net.get_object_by_id(area_id, object_id)
    --Only check 'link' interactions
    if object.type ~= "link" and object.type ~= "back_link" then
        return
    end

    local web_link = object.custom_properties.link

    --TODO insert check here to see if the map is already loaded
    if currently_generating[object_id] then
        print("[hyperlinks] already generating this area....")
        return
    end
    currently_generating[object_id] = true

    --get link details
    local link = object.custom_properties.link
    local text = object.custom_properties.text

    if object.type == "back_link" then
        --TODO get area URL from tiled map player_metadata 
        link = player_last_area_url[player_id]
        print("back_link:"..link)
    end

    --Generate a map
    local generate_map_promise = generate_linked_map(player_id, link, text)
    generate_map_promise.and_then(function (area_info)
        print('[hyperlinks] map generated')
        currently_generating[object_id] = nil

        if area_info.fresh == true then
            --If the map was just generated

            local n_area_properties = Net.get_area_custom_properties(area_info.area_id)

            load_asset(n_area_properties["Background Texture"])
            load_asset(n_area_properties["Background Animation"])
            for index, value in ipairs(area_info.assets) do
                load_asset(value)
            end

            --Read new generated map file
            local read_file_promise = Async.read_file(area_info.area_path)
            read_file_promise.and_then(function (area_data)
                --Add area to server
                Net.update_area(area_info.area_id, area_data)
                print("[hyperlinks] added area "..area_info.area_id)
                transfer_player(player_id,area_info.area_id)
            end)

        else
            transfer_player(player_id,area_info.area_id)
        end
    end)

end

function load_asset(asset_path)
    existing_asset_size = Net.get_asset_size(asset_path)
    if existing_asset_size == 0 then
        print("[hyperlinks] loading new asset "..asset_path)
        local read_background_promise = Async.read_file(n_area_properties["Background Texture"])
        read_background_promise.and_then(function (asset_data)
            Net.update_asset(asset_path, asset_data)
            print("[hyperlinks] loaded new asset "..asset_path)
        end)
    else
        print("[hyperlinks] asset already exists "..asset_path)
    end
end

function transfer_player(player_id,new_area_id)
    local current_area_id = Net.get_player_area(player_id)
    print("transfering player from "..current_area_id.." to "..new_area_id)
    local c_area_properties = Net.get_area_custom_properties(current_area_id)
    print('curentareaprops',c_area_properties)
    local n_area_properties = Net.get_area_custom_properties(new_area_id)
    print('nextareaprops',n_area_properties)

    print("entryX",n_area_properties.entryX)
    print("entryY",n_area_properties.entryY)
    print("entryZ",n_area_properties.entryZ)
    print("entryDirection",n_area_properties.entryDirection)
    
    --Record the last area the player was in
    player_last_area_url[player_id] = c_area_properties.URL
    --Transfer player there
    Net.transfer_player(player_id, new_area_id,true,n_area_properties.entryX,n_area_properties.entryY,n_area_properties.entryZ,n_area_properties.entryDirection)
end

function generate_linked_map(player_id, link, text)
    local url = "http://localhost:3000"
    local headers = {}
    headers["Content-Type"] = "application/json"
    local body = {
        player_id = player_id,
        object_id = object_id,
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