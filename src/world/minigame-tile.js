import Tile from "./tile.js";

export default class MinigameTile extends Tile {
    constructor(_vector, _id, _geometry, _material) {
        super(_vector, _id, _geometry, _material);
        this.base = _vector;

        // 0 = Normal, 1 = Horizontal
        this.mode = this.findRandom(0, 1);
        this.rotator = false;
        if ((_id+1) % 7 == 0 || (_id) % 7 == 0) {
            this.mode = 0;
            this.rotator = true;
        }
        this.speed = this.findRandom(1, 2 + Math.floor(_id/10));
        this.variation = this.findRandom(5, 5 + Math.floor(_id/2));

        this.rotation = "right";
        this.recordedSpeed = 0;


        this.delta = {};
        this.delta.x = 0;
        this.delta.y = 0;
        this.delta.z = 0;
    }

    findRandom(min, max) {
        const random = Math.floor(min + Math.random() * (max+1)) //Finds number between 0 - max
        return random;
    }
    
}