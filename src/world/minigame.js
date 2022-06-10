import * as THREE from 'three';
import Manager from "../manager.js";
import MinigameTile from "./minigame-tile.js";

export default class Minigame {

    constructor(_startTile) {

        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.time = this.manager.time;

        this.startTile = _startTile;

        this.tileWidth = 9;
        this.tileHeight = 1;
        this.tileDepth = 9;
        this.tileGeometry = new THREE.BoxGeometry(this.tileWidth, this.tileHeight, this.tileDepth);
        this.tileMaterial = _startTile.instance.material;

        this.tiles = [];
        this.activeTiles = [];

        this.isPlaying = false;
        this.location = -1;
        this.rotation = "right";

        this.offset = {};
        this.offset.x = 0;
        this.offset.y = 0.5;
        this.offset.z = 0;

        // How many tiles the player will always see in front of him
        this.frontTiles = 5;
        // How many tiles the player will see behind him !! TODO use it !!
        this.backTiles = 1;
        // How many tiles the minigame will hold in total
        this.totalTiles = 50;

        this.prepare();
    }

    update() {
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].mode == 1) this.updateVertical(this.tiles[i]);
        }
    }

    prepare() {
        this.createRandomMap();

        this.score = document.querySelector('.score');
    }

    createRandomMap() {
        let position = this.startTile.instance.position;
        for (let i = 1; i <= this.totalTiles; i++) {
            const vector = new THREE.Vector3(position.x, position.y, position.z);
            let rotation = "right"
            if (Math.floor(i/7) == 0) {
                vector.x -= 15;
            }
            if (Math.floor(i/7) == 1) {
                vector.z += 15;
                rotation = "front"
            }
            if (Math.floor(i/7) == 2 || Math.floor(i/7) == 3) {
                vector.x += 15;
                rotation = "left"
            }
            if (Math.floor(i/7) > 3) {
                vector.z -= 15;
                rotation = "back"
            }
            const tile = new MinigameTile(vector, i, this.tileGeometry, this.tileMaterial);
            tile.rotation = rotation;
            tile.instance.visible = false;
            this.tiles.push(tile);
            if (i <= this.frontTiles) this.activeTiles.push(tile);

            position = vector;
        }
        
    }

    start() {
        this.isPlaying = true;
        this.startTime = this.time.current;
        this.score.style.visibility = "visible";
        this.updateScore();
    }

    stop() {
        this.isPlaying = false;
    }

    hide() {
        this.stop();
        this.score.style.visibility = "hidden";
        for (let i = 0; i < this.activeTiles.length; i++) this.activeTiles[i].instance.visible = false;
    }

    show() {
        for (let i = 0; i < this.activeTiles.length; i++) this.activeTiles[i].instance.visible = true;
    }

    reset() {
        this.isPlaying = false;
        this.location = -1;
        this.activeTiles = [];
        for (let i = 0; i < this.frontTiles; i++) this.activeTiles.push(this.tiles[i]);
        this.updateScore();
    }

    updateActive() {
        if (this.location + this.frontTiles < this.totalTiles) {
            this.activeTiles.push(this.tiles[this.location + this.frontTiles]);
            this.activeTiles[this.activeTiles.length-1].instance.visible = true;
        }
        if (this.location > 0) {
            const tile = this.activeTiles.shift();
            tile.instance.visible = false;
        }
    }

    updateVertical(tile) {
        const variation = tile.variation;
        const speed = 0.8 + tile.speed*0.2;
        const delta = this.time.delta * 0.001;
        const timeCoefficient = (this.time.current - this.startTime) * 0.001;
        if (tile.rotation === "right" || tile.rotation === "left") {
            tile.delta.z = variation * Math.sin(tile.id*Math.PI/5 + timeCoefficient*speed);
            tile.recordedSpeed = - (tile.instance.position.z - (tile.base.z + tile.delta.z)) / delta;
            tile.instance.position.z = tile.base.z + tile.delta.z;
        }
        else {
            tile.delta.x = variation * Math.sin(tile.id*Math.PI/5 + timeCoefficient*speed);
            tile.recordedSpeed = - (tile.instance.position.x - (tile.base.x + tile.delta.x)) / delta;
            tile.instance.position.x = tile.base.x + tile.delta.x;
        }
    }

    updateScore() {
        if (this.location == -1) {
            this.score.innerHTML = this.location + 1;
            return;
        }
        this.score.classList.remove("score-animation");
        const newScore = this.score.cloneNode(true);
        this.score.remove();
        this.score = newScore;
        this.score.innerHTML = this.location + 1;
        this.score.classList.add("score-animation");
        // let color;
        // if (this.time.getTimeOfDay == 'm') color = "#6db81d";
        // else if (this.time.getTimeOfDay == 'a') color = "#ab4614";
        // else color = "#66e5ff";
        // this.score.style.color = color;
        document.querySelector('body').append(this.score);
    }

    victory() {
        this.score.classList.remove("score-animation");
        const newScore = this.score.cloneNode(true);
        this.score.remove();
        this.score = newScore;
        this.score.innerHTML = "VICTORY!<br>" + this.totalTiles;
        this.score.classList.add("score-animation");
        document.querySelector('body').append(this.score);
    }
}