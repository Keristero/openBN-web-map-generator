--To use this script, import it from a module.
--It can only be used within the module, you cant share events between modules.

local listeners = {}

local ezevents = {}

function AddListener(eventName,handler)
    if not listeners[eventName] then
        listeners[eventName] = {}
    end
    table.insert(listeners[eventName],handler)
end

function BroadcastEvent(eventName,eventData)
    if listeners[eventName] then
        --print(eventName,eventData)
        for i, handler in pairs(listeners[eventName]) do
            handler(eventData)
        end  
    end
end

--Interface
function ezevents.add_listener(eventName,handler)
    return ( AddListener(eventName,handler) )
end
function ezevents.broadcast_event(eventName,eventData)
    return ( BroadcastEvent(eventName,eventData) )
end

return ezevents