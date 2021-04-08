class RNG{
    constructor(startingSeed){
        this.seed = startingSeed
    }
    Bool(){
        return Math.random() > 0.5
    }
    Float() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
    Integer(min,max){
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
    }
    RandomPositionOnCircumference(radius) {
        var angle = this.Float() * Math.PI * 2;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
        }
    }
}

module.exports = RNG