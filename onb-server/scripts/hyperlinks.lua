local json = require('scripts/libs/json')

local currently_generating = {}
local player_last_area_url = {}

function handle_object_interaction(player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local object = Net.get_object_by_id(area_id, object_id)
    --Only check 'link' interactions
    if object.type ~= "link" and object.type ~= "backlink" then
        return
    end

    local web_link = object.custom_properties.link

    --TODO insert check here to see if the map is already loaded
    if currently_generating[web_link] then
        print("[hyperlinks] already generating this area....")
        return
    end

    --get link details
    local link = object.custom_properties.link
    local text = object.custom_properties.text

    if object.type == "backlink" then
        --If the player has not been anywhere before here
        if ~player_last_area_url[player_id] then
            return
        end
        --TODO get area URL from tiled map player_metadata 
        link = player_last_area_url[player_id]
    end

    --Generate a map
    local generate_map_promise = generate_linked_map(player_id, link, text)
    generate_map_promise.and_then(function (area_info)

        --Read new generated map file
        local read_file_promise = Async.read_file(area_info.area_path)
        read_file_promise.and_then(function (area_data)

            currently_generating[web_link] = nil

            --Add area to server
            Net.update_area(area_info.area_id, area_data)
            print("[hyperlinks] added area "..area_info.area_id)

            --Transfer player there
            Net.transfer_player(player_id, area_info.area_id)
            --Record the last area the player was in
            --TODO get area URL from tiled map custom_properties (once konst adds this feature)
            player_last_area_url[player_id] = nil
        end)

    end)

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
        if response.status ~= 200 then
            return nil
        end
        return data
    end)
    return Async.promisify(co)
end