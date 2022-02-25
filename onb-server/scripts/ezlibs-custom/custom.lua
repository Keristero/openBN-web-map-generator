local ezweather = require('scripts/ezlibs-scripts/ezweather')

local areas = Net.list_areas()
for index, area_id in ipairs(areas) do
    ezweather.start_fog_in_area(area_id)
end