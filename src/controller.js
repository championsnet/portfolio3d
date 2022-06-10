import Manager from './manager.js';
import './utils/swiped-events';

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
            this.minigame = this.manager.world.minigame;
            this.setTrioRelation();
        });

        this.loaderUI.on('start', () => {
            this.logic.actionsAllowed = true;
            this.setControls();
            this.setAudio();
        });

        this.animator.on('actions-ready', () => {
            if (!this.logic.onElevator) this.logic.actionsAllowed = true;
        });

        this.animator.on('jump-start', () => {
            this.logic.onJump = true;
        });

        this.animator.on('jump-end', () => {
            this.logic.onJump = false;
            if (this.tiles[this.player.location].elevator !== null) {
                this.prepareElevator();
            }
            if (this.tiles[this.player.location].minigame) {
                this.audio.soundtrack.pause();
                if (!this.audio.minigameOst.isPlaying) this.audio.minigameOst.play();
                this.logic.onMinigame = true;
                this.minigame.show();
                this.minigame.start();
                this.animator.minigame = this.minigame;
            }
            if (!this.tiles[this.player.location].minigame && this.logic.onMinigame) {
                if (!this.audio.soundtrack.isPlaying) this.audio.soundtrack.play();
                if (this.audio.minigameOst.isPlaying)this.audio.minigameOst.stop();
                this.logic.onMinigame = false;
                this.minigame.reset();
                this.minigame.hide();
            }
        });

        this.animator.on('death-start', () => {
            this.logic.onDeathJump = true;
        });

        this.animator.on('death-end', () => {
            this.logic.onDeathJump = false;
        });

        this.animator.on('minijump-start', () => {
            this.logic.onMiniJump = true;
        });

        this.animator.on('minijump-end', () => {
            this.logic.onMiniJump = false;
            this.minigame.updateActive();
        });

        this.animator.on('minideath-start', () => {
            this.logic.onMiniDeath = true;
        });

        this.animator.on('minideath-end', () => {
            this.logic.onMiniDeath = false;
            this.minigame.updateActive();
            this.logic.onMinigame = false;
            this.minigame.hide();
            this.minigame.reset();
        });

        this.animator.on('rotation-end', () => {
            this.logic.onLeftRotation = false;
            this.logic.onRightRotation = false;
        });

        this.animator.on('elevate-end', () => {
            this.logic.onElevator = false;
        });
        
    }

    update() {
        if (this.logic.onJump) this.animator.updateJump();
        if (this.logic.onDeathJump) this.animator.updateDeathJump();
        if (this.logic.onRightRotation) this.animator.updateRightRotation();
        if (this.logic.onLeftRotation) this.animator.updateLeftRotation();
        if (this.logic.onElevator) this.animator.updateElevate();
        if (this.logic.onMiniJump) this.animator.updateMinigameJump();
        if (this.logic.onMinigame) this.animator.updateMinigame();
        if (this.logic.onMiniDeath) this.animator.updateMinigameDeath();
    }

    setLogic() {
        this.logic = {};
        this.logic.actionsAllowed = false;
        this.logic.onJump = false;
        this.logic.onDeathJump = false;
        this.logic.onRightRotation = false;
        this.logic.onLeftRotation = false;
        this.logic.onElevator = false;
        this.logic.onMinigame = false;
        this.logic.onMiniJump = false;
    }

    // Set relationship of camera, player and directional light
    setTrioRelation() {
        this.lights.directional.target = this.player.model;
        this.player.model.add(this.camera.instance);
    }

    setControls() {
        window.addEventListener("keydown", (event) => {
            if (this.logic.actionsAllowed) {
                if (event.key == " " || event.key == "ArrowUp") this.prepareJump();
                if (event.key == "ArrowRight") this.prepareRotation('right');
                if (event.key == "ArrowLeft") this.prepareRotation('left');
            }
        });
        document.addEventListener('swiped-up', (e) => {
            if (this.logic.actionsAllowed) {
                this.prepareJump();
            }
        });
        document.addEventListener('swiped-right', (e) => {
            if (this.logic.actionsAllowed) {
                this.prepareRotation('right');
            }
        });
        document.addEventListener('swiped-left', (e) => {
            if (this.logic.actionsAllowed) {
                this.prepareRotation('left');
            }
            });
    }

    setAudio() {
        this.audio.soundtrack.play();

        // START & STOP SOUNDTRACK BASED ON TAB FOCUS
        window.onfocus = () => {
            if (!this.logic.onMinigame) this.audio.soundtrack.play();
            else this.audio.minigameOst.play();
        };
        window.onblur = () => {
            if (!this.logic.onMinigame) this.audio.soundtrack.pause();
            else this.audio.minigameOst.pause();
        };
    }

    prepareJump() {
        this.logic.actionsAllowed = false;
        if (this.isJumpAllowed()) {
            this.target = this.getTarget();
            this.animator.jump(this.target);
        }
        else if (!this.logic.onMinigame) {
            this.animator.deathJump();
        }
        else {
            if (this.player.direction != this.minigame.tiles[this.minigame.location+1].rotation) {
                this.logic.actionsAllowed = true;
                return;
            }
            this.animator.minigameJump();
        }
    }

    // Return true if there is a deathless place to jump
    isJumpAllowed() {
        if (this.logic.onMinigame) if (this.minigame.location != -1) return false; 
        if (this.player.direction in this.tilesResource[this.player.location]) {
            const target = this.tilesResource[this.player.location][this.player.direction]
            if ("elevator" in this.tilesResource[target]) {
                if (this.tiles[target].elevator.currently === "start") {
                    if (this.tiles[target].elevator.start.right == this.player.location) {
                        return true;
                    }
                }
                else {
                    if (this.tiles[target].elevator.end.right == this.player.location) {
                        return true;
                    }
                }
            }
            else return true;
        }
        return false;
    }

    getTarget() {
        // Get player target based on location and direction
        if ("elevator" in this.tilesResource[this.player.location]) {
            if (this.tiles[this.player.location].elevator.currently === "start") {
                return (this.tilesResource[this.player.location][this.player.direction]);
            }
            else return (this.tilesResource[this.player.location].elevator[this.player.direction]);
        }
        return (this.tilesResource[this.player.location][this.player.direction]);
    }

    prepareRotation(direction) {
        this.logic.actionsAllowed = false;
        if (direction === 'right') this.logic.onRightRotation = true;
        else this.logic.onLeftRotation = true;
        this.animator.rotatePlayer(direction);
    }

    prepareElevator() {
        this.logic.actionsAllowed = false;
        this.animator.elevate(this.target);
        this.logic.onElevator = true;
    }
}