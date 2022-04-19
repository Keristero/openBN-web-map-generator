local helpers = require('scripts/ezlibs-scripts/helpers')
local internet_cyberworld = require('scripts/internet_cyberworld/internet_cyberworld')
local image_boards        = require('scripts/internet_cyberworld/image_boards')
local hyperlinks          = require('scripts/internet_cyberworld/hyperlinks')

local custom_plugins = {image_boards,internet_cyberworld,hyperlinks}

local custom = {}

function custom.handle_battle_results(player_id, stats)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_battle_results then
            plugin.handle_battle_results(player_id, stats)
        end
    end
end

function custom.handle_shop_purchase(player_id, item_name)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_shop_purchase then
            plugin.handle_shop_purchase(player_id, item_name)
        end
    end
end

function custom.handle_shop_close(player_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_shop_close then
            plugin.handle_shop_close(player_id)
        end
    end
end

function custom.handle_custom_warp(player_id, object_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_custom_warp then
            plugin.handle_custom_warp(player_id, object_id)
        end
    end
end

function custom.handle_player_move(player_id, x, y, z)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_move then
            plugin.handle_player_move(player_id, x, y, z)
        end
    end
end

function custom.handle_player_request(player_id, data)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_request then
            plugin.handle_player_request(player_id, data)
        end
    end
end

--Pass handlers on to all the libraries we are using
function custom.handle_tile_interaction(player_id, x, y, z, button)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_tile_interaction then
            plugin.handle_tile_interaction(player_id, x, y, z, button)
        end
    end
end

function custom.handle_post_selection(player_id, post_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_post_selection then
            plugin.handle_post_selection(player_id, post_id)
        end
    end
end

function custom.handle_board_close(player_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_board_close then
            plugin.handle_board_close(player_id)
        end
    end
end

function custom.handle_player_avatar_change(player_id, details)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_avatar_change then
            plugin.handle_player_avatar_change(player_id, details)
        end
    end
end

function custom.handle_player_join(player_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_join then
            plugin.handle_player_join(player_id)
        end
    end
end

function custom.handle_actor_interaction(player_id, actor_id, button)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_actor_interaction then
            plugin.handle_actor_interaction(player_id,actor_id, button)
        end
    end
end

function custom.tick(delta_time)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.on_tick then
            plugin.on_tick(delta_time)
        end
    end
end

function custom.handle_player_disconnect(player_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_disconnect then
            plugin.handle_player_disconnect(player_id)
        end
    end
end
function custom.handle_object_interaction(player_id, object_id, button)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_object_interaction then
            plugin.handle_object_interaction(player_id,object_id, button)
        end
    end
end
function custom.handle_player_transfer(player_id)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_player_transfer then
            plugin.handle_player_transfer(player_id)
        end
    end
end
function custom.handle_textbox_response(player_id, response)
    for i,plugin in ipairs(custom_plugins)do
        if plugin.handle_textbox_response then
            plugin.handle_textbox_response(player_id,response)
        end
    end
end

return custom