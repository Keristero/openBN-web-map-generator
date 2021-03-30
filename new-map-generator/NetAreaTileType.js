class NetAreaTileType{
    constructor({id,color,draw,pathfinding_cost}){
        this.id = id
        this.color = color
        this.draw = draw
        this.pathfinding_cost = pathfinding_cost
    }
}

module.exports = {NetAreaTileType}