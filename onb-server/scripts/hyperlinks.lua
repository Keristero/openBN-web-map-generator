local json = require('scripts/libs/json')

local promises = {}

function handle_object_interaction(player_id, object_id)
    local area_id = Net.get_player_area(player_id)
    local object = Net.get_object_by_id(area_id, object_id)
    --Only check 'link' interactions
    if object.type ~= "link" then
        return
    end

    --TODO insert check here to see if the map is already loaded

    if promises[area_id..object_id] then
        print("[hyperlinks] already generating this area....")
        return
    end

    --Geneate a map
    local generate_map_promise = generate_linked_map(player_id, object_id, object)
    promises[area_id..object_id] = generate_map_promise

    generate_map_promise.after = function (area_info)
        --Read new generated map file
        local read_file_promise = Async.read_file(area_info.area_path)
        promises[area_info.area_path] = read_file_promise

        read_file_promise.after = function (area_data)
            --Add area to server, transfer player there
            Net.update_area(area_info.area_id, area_data)
            print("[hyperlinks] added area "..area_info.area_id)
            Net.transfer_player(player_id, area_info.area_id)
        end

    end

end

function generate_linked_map(player_id, object_id, object)
    local url = "http://localhost:3000"
    local headers = {}
    headers["Content-Type"] = "application/json"
    local body = {
        player_id = player_id,
        object_id = object_id,
        link = object.custom_properties.link,
        text = object.custom_properties.text
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

function tick()
    for promise_id, promise in pairs(promises) do
        if promise.is_ready() then
            if promise.after ~= nil then
                promise.after(promise.get_value())
            end
            promises[promise_id] = nil
        end
    end
end
