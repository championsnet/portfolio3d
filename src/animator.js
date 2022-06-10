import { thresholdSturges } from 'd3';
import * as THREE from 'three';
import Manager from './manager';
import EventEmitter from './utils/event-emitter';

export default class Animator extends EventEmitter {

    constructor() {
        super();

        this.manager = new Manager();
        this.resources = this.manager.resources;
        this.scene = this.manager.scene;
        this.time = this.manager.time;
        this.camera = this.manager.camera;
        this.lights = this.manager.lights;

        this.resources.on('ready', () => {
            this.player = this.manager.player;
            this.model = this.manager.player.model;
            this.dopple = this.manager.player.doppleganger;
            this.playerVelocity = new THREE.Vector3(0, 0, 0);
            this.tiles = this.manager.world.tiles;
            this.jumps = this.player.jumps;
            this.jumpDuration = 0.5;
            this.jumpStartTime = 0;
            this.rotationDuration = 0.3;
            this.audio = this.manager.audio;
            this.detune = 0;
            this.onJump = false;
        });

        
    }

    elevate(target) {
        this.elevator = this.tiles[target].elevator;
        this.elevatorIntance = this.tiles[target].instance;
        let fromTile = this.elevator.start;
        let toTile = this.elevator.end;
        if (this.elevator.currently == "end") {
            fromTile = this.elevator.end;
            toTile = this.elevator.start;
        }
        this.requiredVy = (toTile.y - fromTile.y) / 15 * 10;
        this.requiredVz = (toTile.z - fromTile.z) / 15 * 10;
        this.requiredVx = (toTile.x - fromTile.x) / 15 * 10;
        this.requiredVr = this.elevator.rotation / 360 * 2 * Math.PI / 15 * 10;

        this.rotationTracker = this.elevatorIntance.rotation.y;
        this.player.direction = "right";

        this.trackFloor = fromTile.y;
    }

    updateElevate() {

        const delta = this.time.delta * 0.001;
        let destination = this.elevator.end;
        if (this.elevator.currently === 'end') destination = this.elevator.start;

        // Check X physics
        this.elevatorIntance.position.x += this.requiredVx * delta;
        this.dopple.position.x += this.requiredVx * delta;
        if (this.requiredVx >= 0) {
            if (this.elevatorIntance.position.x >= destination.x) {
                this.elevatorIntance.position.x = destination.x;
                this.dopple.position.x = destination.x;
            }
        } else {
            if (this.elevatorIntance.position.x <= destination.x) {
                this.elevatorIntance.position.x = destination.x;
                this.dopple.position.x = destination.x;
            }
        }

        // Check Y physics
        this.elevatorIntance.position.y += this.requiredVy * delta;
        this.dopple.position.y += this.requiredVy * delta;
        if (this.requiredVy >= 0) {
            if (this.elevatorIntance.position.y >= destination.y) {
                this.elevatorIntance.position.y = destination.y;
                this.dopple.position.y = destination.y + 0.5;
            }
        } else {
            if (this.elevatorIntance.position.y <= destination.y) {
                this.elevatorIntance.position.y = destination.y;
                this.dopple.position.y = destination.y + 0.5;
            }
        }

        if (Math.abs(this.trackFloor-this.elevatorIntance.position.y) >= Math.abs(this.elevator.start.y-this.elevator.end.y)/9) {
            this.audio.playNote(this.detune);
            if (this.trackFloor < this.elevatorIntance.position.y) this.detune += 1;
            else this.detune -= 1;
            if (this.detune < 0) this.detune = 0;
            if (this.detune > 7) this.detune = 7;
            this.trackFloor = this.elevatorIntance.position.y;
        }

        // Check Z physics
        this.elevatorIntance.position.z += this.requiredVz * delta;
        this.dopple.position.z += this.requiredVz * delta;
        if (this.requiredVz >= 0) {
            if (this.elevatorIntance.position.z >= destination.z) {
                this.elevatorIntance.position.z = destination.z;
                this.dopple.position.z = destination.z;
            }
        } else {
            if (this.elevatorIntance.position.z <= destination.z) {
                this.elevatorIntance.position.z = destination.z;
                this.dopple.position.z = destination.z
            }
        }

        this.model.rotation.y -= this.requiredVr * delta;
        this.elevatorIntance.rotation.y -= this.requiredVr * delta;
        if (this.elevatorIntance.rotation.y - this.rotationTracker <= - Math.PI * this.elevator.rotation/360 * 2) {
            this.elevatorIntance.rotation.y = this.rotationTracker - Math.PI * this.elevator.rotation/360 * 2;
            this.model.rotation.y = - Math.PI/2;
            this.requiredVr = 0;
        }

        if (this.elevatorIntance.position.y == destination.y
            && this.elevatorIntance.position.z == destination.z
            && this.elevatorIntance.position.x == destination.x
            && this.elevatorIntance.rotation.y == this.rotationTracker - Math.PI * this.elevator.rotation/360 * 2) {

            
            this.trigger('elevate-end');
            if (this.elevator.currently === 'end') this.tiles[this.target].elevator.currently = 'start';
            else this.tiles[this.target].elevator.currently = 'end';
        
            setTimeout(() => {
                this.trigger('actions-ready');
            }, 50);
        }

        this.model.position.copy(this.dopple.position);
        this.lights.directional.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
        this.lights.directional.position.set(
            this.model.position.x + this.lights.lightOffset.x,
            this.model.position.y + this.lights.lightOffset.y, 
            this.model.position.z + this.lights.lightOffset.z
        ); 

    }

    jump(target) {
        this.randomJump = this.findRandom(this.jumps.length);
        this.jumps[this.randomJump].setDuration(8*this.jumpDuration/5);
        this.jumps[this.randomJump].play();
        this.target = target;
        
        if(this.tiles[this.player.location].panel !== null) this.tiles[this.player.location].panel.playOutro(this.jumpDuration);
        if(this.tiles[target].panel !== null) this.tiles[target].panel.playIntro(this.jumpDuration*2);
        const toTile = this.tiles[target].instance;
        const fromTile = this.tiles[this.player.location].instance;
        this.requiredVy = 20 + Math.abs(toTile.position.y - fromTile.position.y);
        this.requiredVz = (toTile.position.z - fromTile.position.z) / 10 * 10;
        this.requiredVx = (toTile.position.x - fromTile.position.x) / 10 * 10;

        setTimeout(() => {
            this.playerVelocity.y = this.requiredVy * 5/this.jumpDuration/5;
            this.playerVelocity.z = this.requiredVz * 4/this.jumpDuration/5;
            this.playerVelocity.x = this.requiredVx * 4/this.jumpDuration/5;
            this.jumpStartTime = this.time.current;
            this.trigger('jump-start');
            this.audio.jump.play();
        }, this.jumpDuration/5 * 1000);
    }

    updateJump() {
        let timeCoefficient = (this.time.current - this.jumpStartTime) * 4/this.jumpDuration/5 * 0.001;
        if (timeCoefficient >= 1) timeCoefficient = 1;
        const delta = this.time.delta * 0.001;
        
        // Check Y physics
        this.dopple.position.y += this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta;
        this.camera.instance.position.y -= this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;
        if (this.playerVelocity.y > 80) 
        {
            this.camera.instance.position.y += this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;
        }
        if (this.dopple.position.y <= this.tiles[this.target].instance.position.y + 0.5) {
            this.dopple.position.y = this.tiles[this.target].instance.position.y + 0.5;
            this.camera.instance.position.y = this.camera.offset.y;
        }

        // Check Z physics
        this.dopple.position.z += this.playerVelocity.z * delta;
        if (this.playerVelocity.z >= 0) {
            if (this.dopple.position.z >= this.tiles[this.target].instance.position.z) {
                this.dopple.position.z = this.tiles[this.target].instance.position.z;
            }
        } else {
            if (this.dopple.position.z <= this.tiles[this.target].instance.position.z) {
            this.dopple.position.z = this.tiles[this.target].instance.position.z;
            }
        }
        
        // Check X physics
        this.dopple.position.x += this.playerVelocity.x * delta;
        if (this.playerVelocity.x >= 0) {
            if (this.dopple.position.x >= this.tiles[this.target].instance.position.x) {
                this.dopple.position.x = this.tiles[this.target].instance.position.x;
            }
        } else {
            if (this.dopple.position.x <= this.tiles[this.target].instance.position.x) {
                this.dopple.position.x = this.tiles[this.target].instance.position.x;
            }
        }
        

        if (this.dopple.position.y == this.tiles[this.target].instance.position.y + 0.5 
            && this.dopple.position.z == this.tiles[this.target].instance.position.z
            && this.dopple.position.x == this.tiles[this.target].instance.position.x) {

            
            this.player.location = this.target;
            this.playerVelocity.y = 0;
            this.playerVelocity.z = 0;
            this.playerVelocity.x = 0;
            this.trigger('jump-end');
        
            setTimeout(() => {
                this.jumps[this.randomJump].reset();
                this.jumps[this.randomJump].stop();
                this.trigger('actions-ready');
            }, 50);
        }

        this.model.position.copy(this.dopple.position);
        this.lights.directional.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
        this.lights.directional.position.set(
            this.model.position.x + this.lights.lightOffset.x,
            this.model.position.y + this.lights.lightOffset.y, 
            this.model.position.z + this.lights.lightOffset.z
        ); 

    }

    deathJump() {
        this.onDeath = true;
        this.randomJump = this.findRandom(this.jumps.length);
        this.jumps[this.randomJump].setDuration(6*this.jumpDuration/5);
        this.jumps[this.randomJump].play();
        this.player.on("finished", () => {
            if (!this.onDeath) return;
            this.player.deathAnimation.play();
            if (this.audio.drop.isPlaying) this.audio.drop.stop();
            this.audio.drop.play();
            this.audio.soundtrack.pause();
        }, {once: true});

        this.target = 9999;
        const fromTile = this.tiles[this.player.location].instance;
        const toTile = new THREE.Vector3(-10, fromTile.position.y, 0);
        
        this.deathLightStep = 0.02;
        const direction = this.player.direction;
        switch (direction) {
            case 'front': 
                toTile.x = fromTile.position.x;
                toTile.z = fromTile.position.z + 10;
                break;
            case 'right': 
                toTile.x = fromTile.position.x - 10;
                toTile.z = fromTile.position.z;
                break;
            case 'back': 
                toTile.x = fromTile.position.x;
                toTile.z = fromTile.position.z - 10;
                break;
            case 'left':
                toTile.x = fromTile.position.x + 10;
                toTile.z = fromTile.position.z;
                break;
        }
        this.requiredVy = 20 + Math.abs(toTile.y - fromTile.position.y);
        this.requiredVz = (toTile.z - fromTile.position.z) / 10 * 10;
        this.requiredVx = (toTile.x - fromTile.position.x) / 10 * 10;
        this.animationSpeed = 1;

        setTimeout(() => {
            this.playerVelocity.y = this.requiredVy * 5/this.jumpDuration/5;
            this.playerVelocity.z = this.requiredVz * 4/this.jumpDuration/5;
            this.playerVelocity.x = this.requiredVx * 4/this.jumpDuration/5;
            this.jumpStartTime = this.time.current;
            this.trigger('death-start');
            this.audio.jump.play();
        }, this.jumpDuration/5 * 500);

    }

    updateDeathJump() {
        let timeCoefficient = (this.time.current - this.jumpStartTime) * 4/this.jumpDuration/5 * 0.001;
        if (timeCoefficient >= 1) timeCoefficient = 1;
        const delta = this.time.delta * 0.001 * this.animationSpeed;
        this.player.deathAnimation.timeScale = this.animationSpeed;
        // Slow motion gets on if we want it (for now we dont)
        this.animationSpeed *= 1;

        this.dopple.position.y += this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta;
        this.dopple.position.z += this.playerVelocity.z * delta;
        this.dopple.position.x += this.playerVelocity.x * delta;

        if (this.dopple.position.y <= this.tiles[this.player.location].instance.position.y - 20) {
            if (this.lights.ambient.intensity - this.deathLightStep < 0) this.lights.ambient.intensity = 0;
            else this.lights.ambient.intensity -= this.deathLightStep;
            if (this.lights.directional.intensity - this.deathLightStep < 0) this.lights.directional.intensity = 0;
            else this.lights.directional.intensity -= this.deathLightStep;
        }

        if (this.lights.ambient.intensity == 0 && this.lights.directional.intensity == 0) {
            this.deathLightStep = 0;

            setTimeout(() => {
                this.camera.instance.position.y = this.camera.offset.y;
                this.trigger('death-end');
                this.playerVelocity.y = 0;
                this.playerVelocity.z = 0;
                this.playerVelocity.x = 0;
                this.dopple.position.x = this.tiles[this.player.location].instance.position.x;
                this.dopple.position.y = this.tiles[this.player.location].instance.position.y + 0.5;
                this.dopple.position.z = this.tiles[this.player.location].instance.position.z;
                this.lights.directional.intensity = this.lights.directionalIntensity;
                this.lights.ambient.intensity = this.lights.ambientIntensity;
        
                this.trigger('actions-ready');
                this.jumps[this.randomJump].setLoop(THREE.LoopOnce);
                this.jumps[this.randomJump].reset();
                this.jumps[this.randomJump].stop();
                this.player.deathAnimation.reset();
                this.player.deathAnimation.stop();
                if (!this.audio.soundtrack.isPlaying) this.audio.soundtrack.play();
                this.onDeath = false;
        
                this.model.position.copy(this.dopple.position);
            }, 50);
        }

        this.model.position.copy(this.dopple.position);


    }

    minigameJump() {
        console.log("Started Minigame Jump");
        this.randomJump = this.findRandom(this.jumps.length);
        this.jumps[this.randomJump].setDuration(6*this.jumpDuration/5);
        this.jumps[this.randomJump].play();
        const minigame = this.minigame;
        this.target = minigame.location + 1;
        
        if (this.target >= minigame.tiles.length) {
            // TODO
            minigameDeath();
            return;
        }


        setTimeout(() => {

            const toTile = minigame.tiles[this.target].base;
            let fromTile = minigame.startTile.instance.position;
            if (minigame.location != -1) fromTile = minigame.tiles[minigame.location].instance.position;

            this.requiredVy = 20 + Math.abs(toTile.y - fromTile.y);
            if (this.player.direction === "right" || this.player.direction === "left") {
                this.requiredVz = 0;
                this.requiredVx = (toTile.x - fromTile.x) / 10 * 10;
            }
            else {
                this.requiredVz = (toTile.z - fromTile.z) / 10 * 10;
                this.requiredVx = 0;
            }

            this.playerVelocity.y = this.requiredVy * 5/this.jumpDuration/5;
            this.playerVelocity.z = this.requiredVz * 4/this.jumpDuration/5;
            this.playerVelocity.x = this.requiredVx * 4/this.jumpDuration/5;
            this.jumpStartTime = this.time.current;
            this.audio.jump.play();
            this.trigger('minijump-start');
            this.onJump = true;
        }, this.jumpDuration/5 * 1000);

    }

    updateMinigameJump() {
        let timeCoefficient = (this.time.current - this.jumpStartTime) * 4/this.jumpDuration/5 * 0.001;
        if (timeCoefficient >= 1) timeCoefficient = 1;
        const delta = this.time.delta * 0.001;

        this.dopple.position.y += this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta;
        this.camera.instance.position.y -= this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;

        this.dopple.position.x += this.playerVelocity.x * delta;
        this.dopple.position.z += this.playerVelocity.z * delta;

        // Check Y physics
        if (this.playerVelocity.y > 80) 
        {
            this.camera.instance.position.y += this.playerVelocity.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;
        }
        if (this.dopple.position.y <= this.minigame.tiles[this.target].base.y + 0.5) {
            this.dopple.position.y = this.minigame.tiles[this.target].base.y + 0.5;
            this.camera.instance.position.y = this.camera.offset.y;
        }

        // Check Z physics
        if (this.player.direction === "front" || this.player.direction === "back") {
            if (this.playerVelocity.z >= 0) {
                if (this.dopple.position.z >= this.minigame.tiles[this.target].base.z) {
                    this.dopple.position.z = this.minigame.tiles[this.target].base.z;
                }
            } else {
                if (this.dopple.position.z <= this.minigame.tiles[this.target].base.z) {
                this.dopple.position.z = this.minigame.tiles[this.target].base.z;
                }
            }
        }

        // Check X physics
        if (this.player.direction === "right" || this.player.direction === "left") {
            if (this.playerVelocity.x >= 0) {
                if (this.dopple.position.x >= this.minigame.tiles[this.target].base.x) {
                    this.dopple.position.x = this.minigame.tiles[this.target].base.x;
                }
            } else {
                if (this.dopple.position.x <= this.minigame.tiles[this.target].base.x) {
                    this.dopple.position.x = this.minigame.tiles[this.target].base.x;
                }
            }
        }

        let axisCheck;
        if (this.player.direction === "right" || this.player.direction === "left") {
            axisCheck = this.dopple.position.x == this.minigame.tiles[this.target].base.x;
        }
        else {
            axisCheck = this.dopple.position.z == this.minigame.tiles[this.target].base.z;
        }

        if (this.dopple.position.y == this.minigame.tiles[this.target].base.y + 0.5
            && axisCheck) {

            this.playerVelocity.y = 0;
            this.playerVelocity.z = 0;
            this.playerVelocity.x = 0;

            console.log("Jump landed correctly: " + this.validateMiniJump());
            
            if (this.validateMiniJump()) {
                this.minigame.location = this.target;
                if(this.player.direction === "right" || this.player.direction === "left") {
                    this.minigame.offset.z = this.dopple.position.z - this.minigame.tiles[this.target].instance.position.z;
                }
                else {
                    this.minigame.offset.x = this.dopple.position.x - this.minigame.tiles[this.target].instance.position.x;
                }
                this.onJump = false;
                this.minigame.rotation = this.minigame.tiles[this.target].rotation;
                this.minigame.updateScore();
                setTimeout(() => {
                    this.jumps[this.randomJump].reset();
                    this.jumps[this.randomJump].stop();
                    if (this.target == this.minigame.totalTiles - 1) this.minigameVictory();
                    else this.trigger('actions-ready');
                }, 50);
            }
            else {
                this.minigameDeath();
            }

            this.trigger('minijump-end');
        
        }

        this.model.position.copy(this.dopple.position);
        this.lights.directional.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
        this.lights.directional.position.set(
            this.model.position.x + this.lights.lightOffset.x,
            this.model.position.y + this.lights.lightOffset.y, 
            this.model.position.z + this.lights.lightOffset.z
        ); 
    }

    minigameDeath() {
        this.onDeath = true;

        this.player.deathAnimation.play();
        if (this.audio.drop.isPlaying) this.audio.drop.stop();
        this.audio.drop.play();
        this.audio.minigameOst.stop();

        this.target = 9999;
        
        this.deathLightStep = 0.02;
        this.requiredVy = 20;
        this.requiredVx = 0;
        this.requiredVz = 0;
        this.animationSpeed = 1;

        this.playerVelocity.y = this.requiredVy * 5/this.jumpDuration/5;
        this.playerVelocity.z = this.requiredVz * 4/this.jumpDuration/5;
        this.playerVelocity.x = this.requiredVx * 4/this.jumpDuration/5;
        this.jumpStartTime = this.time.current;
        this.trigger('minideath-start');
    }

    updateMinigameDeath() {
        let timeCoefficient = (this.time.current - this.jumpStartTime) * 4/this.jumpDuration/5 * 0.001;
        if (timeCoefficient >= 1) timeCoefficient = 1;
        const delta = this.time.delta * 0.001 * this.animationSpeed;
        this.player.deathAnimation.timeScale = this.animationSpeed;
        // Slow motion gets on if we want it (for now we dont)
        this.animationSpeed *= 1;

        this.dopple.position.y -= this.playerVelocity.y * delta;

        let anchor = this.minigame.startTile.instance.position.y;
        if (this.minigame.location >= 0) anchor = this.minigame.tiles[this.minigame.location].base.y
        if (this.dopple.position.y <= anchor - 20) {
            if (this.lights.ambient.intensity - this.deathLightStep < 0) this.lights.ambient.intensity = 0;
            else this.lights.ambient.intensity -= this.deathLightStep;
            if (this.lights.directional.intensity - this.deathLightStep < 0) this.lights.directional.intensity = 0;
            else this.lights.directional.intensity -= this.deathLightStep;
        }

        if (this.lights.ambient.intensity == 0 && this.lights.directional.intensity == 0) {
            this.deathLightStep = 0;
            this.trigger('minideath-end');
            setTimeout(() => {
                this.camera.instance.position.y = this.camera.offset.y;
                this.playerVelocity.y = 0;
                this.playerVelocity.z = 0;
                this.playerVelocity.x = 0;
                this.player.location -= 2;
                this.dopple.position.x = this.tiles[this.player.location].instance.position.x;
                this.dopple.position.y = this.tiles[this.player.location].instance.position.y + 0.5;
                this.dopple.position.z = this.tiles[this.player.location].instance.position.z;
                this.lights.directional.intensity = this.lights.directionalIntensity;
                this.lights.ambient.intensity = this.lights.ambientIntensity;
        
                this.trigger('actions-ready');
                this.jumps[this.randomJump].setLoop(THREE.LoopOnce);
                this.jumps[this.randomJump].reset();
                this.jumps[this.randomJump].stop();
                this.player.deathAnimation.reset();
                this.player.deathAnimation.stop();
                if (!this.audio.soundtrack.isPlaying) this.audio.soundtrack.play();
                this.onDeath = false;
                this.onJump = false;
                this.model.position.copy(this.dopple.position);
                this.lights.directional.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
                this.lights.directional.position.set(
                    this.model.position.x + this.lights.lightOffset.x,
                    this.model.position.y + this.lights.lightOffset.y, 
                    this.model.position.z + this.lights.lightOffset.z
                ); 
            }, 50);
        }

        this.model.position.copy(this.dopple.position);
    }

    updateMinigame() {
        if (this.minigame == null) return;
        this.minigame.update();
        if (this.minigame.location == -1) return;
        if (this.onJump) return;
        const parent = this.minigame.tiles[this.minigame.location].instance.position;
        if (this.minigame.rotation === "right" || this.minigame.rotation === "left") {
            this.dopple.position.z = parent.z + this.minigame.offset.z;
        }
        else {
            this.dopple.position.x = parent.x + this.minigame.offset.x;
        }

        this.model.position.copy(this.dopple.position);
        this.lights.directional.lookAt(this.model.position.x, this.model.position.y, this.model.position.z);
        this.lights.directional.position.set(
            this.model.position.x + this.lights.lightOffset.x,
            this.model.position.y + this.lights.lightOffset.y, 
            this.model.position.z + this.lights.lightOffset.z
        ); 
    }

    validateMiniJump() {
        const mode = this.minigame.tiles[this.target].mode;
        const targetInstance = this.minigame.tiles[this.target].instance;
        switch (mode) {
            case 0:
                if (Math.abs(this.dopple.position.x - targetInstance.position.x) > this.minigame.tileWidth/2 +0.4
                    || Math.abs(this.dopple.position.z - targetInstance.position.z) > this.minigame.tileWidth/2 +0.4) {
                    return false;
                }
                else return true;
            case 1:
                if (Math.abs(this.dopple.position.x - targetInstance.position.x) > this.minigame.tileWidth/2 + 0.4
                    || Math.abs(this.dopple.position.z - targetInstance.position.z) > this.minigame.tileWidth/2 + 0.4) {
                    return false;
                }
                else return true;
        }
    }

    minigameVictory() {
        this.minigame.victory();
    }

    rotatePlayer(direction) {
        this.rotationTracker = this.player.model.rotation.y;
        
        // If rotation is to the right
        if (direction === 'right') {
            this.player.rightAnimation.play();
            this.player.rightAnimation.setDuration(this.rotationDuration);
            switch (this.player.direction) {
                case 'front': 
                    this.player.direction = 'right';
                    break;
                case 'right': 
                    this.player.direction = 'back';
                    break;
                case 'back': 
                    this.player.direction = 'left';
                    break;
                case 'left':
                    this.player.direction = 'front';
                    break;
            }
        }

        // If rotation is to the left
        else if (direction === 'left') {
            this.player.leftAnimation.play();
            this.player.leftAnimation.setDuration(this.rotationDuration);
            switch (this.player.direction) {
                case 'front': 
                    this.player.direction = 'left';
                    break;
                case 'right': 
                    this.player.direction = 'front';
                    break;
                case 'back': 
                    this.player.direction = 'right';
                    break;
                case 'left':
                    this.player.direction = 'back';
                    break;
            }
        }
    }

    updateRightRotation() {
        const delta = this.time.delta * 0.001;
        this.model.rotation.y -= 5 * delta;
        if (this.model.rotation.y - this.rotationTracker <= -Math.PI / 2) {
            this.model.rotation.y = this.rotationTracker - Math.PI / 2;
            
            this.trigger('rotation-end');
            this.trigger('actions-ready');

            this.player.rightAnimation.reset();
            this.player.rightAnimation.stop();
        }
    }

    updateLeftRotation() {
        const delta = this.time.delta * 0.001;
        this.model.rotation.y += 5 * delta;
        if (this.model.rotation.y - this.rotationTracker >= Math.PI / 2) {
            this.model.rotation.y = this.rotationTracker + Math.PI / 2;
            
            this.trigger('rotation-end');
            this.trigger('actions-ready');

            this.player.leftAnimation.reset();
            this.player.leftAnimation.stop();
        }

    }

    findRandom(max) {
        const random = Math.floor(Math.random() * max) //Finds number between 0 - max
        return random;
    }
}