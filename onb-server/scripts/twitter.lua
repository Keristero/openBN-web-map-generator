local json = require('scripts/libs/json')

local tasks = {}
local bearer_token = nil

local Twitter = {}

function Twitter.set_token(token)
  bearer_token = token
end

function Twitter.request_tweets(account_id, params)
  local queries = {}

  for key, value in pairs(params or {}) do
    queries[#queries+1] = key .. "=" .. value
  end

  query_string = table.concat(queries, "&")

  local url = "https://api.twitter.com/2/users/" .. account_id .. "/tweets?" .. query_string
  local headers = {
    Authorization = "Bearer " .. bearer_token
  }

  local request_promise = Async.request(url, { headers = headers })
  local promise =  {
    _ready = false,
    _value = nil
  }

  function promise.is_ready() return promise._ready end
  function promise.is_pending() return not promise._ready end
  function promise.get_value() return promise._value end

  tasks[account_id] = coroutine.create(function()
    local response = Async.await(request_promise)

    if response.status ~= 200 then
      promise._ready = true
      promise._value = nil
      return
    end

    local object = json.decode(response.body)

    promise._ready = true
    promise._value = object.data
  end)

  return promise
end

function Twitter.tick()
  for account_id, task in pairs(tasks) do
    coroutine.resume(task)

    if coroutine.status(task) == "dead" then
      tasks[account_id] = nil
    end
  end
end

return Twitter