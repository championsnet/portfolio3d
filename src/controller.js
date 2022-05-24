import * as THREE from 'three';
require('swiped-events');
import Manager from './manager.js';

export default class Controller {

    constructor() {
        
        this.manager = new Manager();
        this.canvas = this.manager.canvas;
        this.resources = this.manager.resources;
        this.loaderUI = this.manager.loaderUI;
        this.camera = this.manager.camera;
        this.lights = this.manager.lights;
        
        
        this.animator = this.manager.animator;
        
        this.setLogic();

        // Wait for resources
        this.resources.on('ready', () => {
            
            this.tilesResource = this.resources.items.tiles;
            this.tiles = this.manager.world.tiles;
            this.player = this.manager.player;
            this.audio = this.manager.audio;
            this.setTrioRelation();
        });

        this.loaderUI.on('start', () => {
            this.logic.actionsAllowed = true;
            this.setControls();
        });

        this.animator.on('actions-ready', () => {
            this.logic.actionsAllowed = true;
        });

        this.animator.on('jump-start', () => {
            this.logic.onJump = true;
        });

        this.animator.on('jump-end', () => {
            this.logic.onJump = false;
        });

        this.animator.on('death-start', () => {
            this.logic.onDeathJump = true;
        });

        this.animator.on('death-end', () => {
            this.logic.onDeathJump = false;
        });

        this.animator.on('rotation-end', () => {
            this.logic.onLeftRotation = false;
            this.logic.onRightRotation = false;
        });
        
    }

    update() {

        if (this.logic.onJump) this.animator.updateJump();
        if (this.logic.onDeathJump) this.animator.updateDeathJump();
        if (this.logic.onRightRotation) this.animator.updateRightRotation();
        if (this.logic.onLeftRotation) this.animator.updateLeftRotation();
    }

    setLogic() {
        this.logic = {};
        this.logic.actionsAllowed = false;
        this.logic.onJump = false;
        this.logic.onDeathJump = false;
        this.logic.onRightRotation = false;
        this.logic.onLeftRotation = false;
    }

    // Set relationship of camera, player and directional light
    setTrioRelation() {
        this.lights.directional.target = this.player.model;
        this.player.model.add(this.camera.instance);
    }

    setControls() {
        // If on mouse
        if (!this.manager.config.touch) {
            window.addEventListener("keydown", (event) => {
                if (this.logic.actionsAllowed) {
                    if (event.key == " " || event.key == "ArrowUp") this.prepareJump();
                    if (event.key == "ArrowRight") this.prepareRotation('right');
                    if (event.key == "ArrowLeft") this.prepareRotation('left');
                }
            });
        }
        else {
            window.addEventListener('swiped-up', function(e) {
                if (this.logic.actionsAllowed) {
                    this.prepareJump();
                }
            });
            window.addEventListener('swiped-right', function(e) {
                if (this.logic.actionsAllowed) {
                    this.prepareRotation('right');
                }
            });
            window.addEventListener('swiped-left', function(e) {
                if (this.logic.actionsAllowed) {
                    this.prepareRotation('left');
                }
            });
        }

    }

    prepareJump() {
        this.logic.actionsAllowed = false;
        if (this.isJumpAllowed()) {
            this.target = this.getTarget();
            this.animator.jump(this.target);
        }
        else {
            this.animator.deathJump();
        }
    }

    // Return true if there is a deathless place to jump
    isJumpAllowed() {
        return (this.player.direction in this.tilesResource[this.player.location]);
    }

    getTarget() {
        // Get player target based on location and direction
        return (this.tilesResource[this.player.location][this.player.direction]);
    }

    prepareRotation(direction) {
        this.logic.actionsAllowed = false;
        if (direction === 'right') this.logic.onRightRotation = true;
        else this.logic.onLeftRotation = true;
        this.animator.rotatePlayer(direction);
    }

}