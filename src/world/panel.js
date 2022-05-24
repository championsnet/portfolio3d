import * as THREE from 'three';
import Manager from '../manager.js';

export default class Panel {

    constructor(_position, _name) {

        this.manager = new Manager();
        this.resources = this.manager.resources;
        this.time = this.manager.time;
        this.position = _position;
        this.name = _name;
        this.offset = 3;

        this.setModel();

        // Time tick event
        this.time.on('tick', () =>
        {
            this.update();
        });

    }

    update() {
        if ( this.mixer ) this.mixer.update(this.time.delta * 0.001);
    }

    setModel() {
        this.resource = this.resources.items[this.name];
        this.model = this.resource.scene;

        this.model.traverse( function ( object ) {
            if ( object.isMesh ) {
              object.castShadow = true;
            }
        });

        switch (this.position) {
            case 'front': 
                this.model.position.set(0, 4, this.offset);
                this.model.rotation.y = Math.PI;
                break;
            case 'right': 
                this.model.position.set(this.offset, 4, 0);
                this.model.rotation.y = -Math.PI/2;
                break;
            case 'back': 
                this.model.position.set(0, 4, -this.offset);
                break;
            case 'left':
                this.model.position.set(-this.offset, 4, 0);
                this.model.rotation.y = Math.PI/2;
                break;
        }
        this.model.scale.set(4, 4, 4);

        this.setAnimations();
    }
    
    setAnimations() {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.introAnimations = [];
        this.outroAnimations = [];
        for (let i = 0; i<this.resource.animations.length; i++) {
            const animation = this.mixer.clipAction(this.resource.animations[i]);
            
            animation.reset();
            animation.stop();
            animation.setLoop(THREE.LoopOnce);
            animation.getRoot().visible = false;
            animation.setDuration(this.duration);
            if (this.resource.animations[i].name.startsWith("en")) {
                this.introAnimations.push(animation);
                animation.clampWhenFinished = true;
            }
            else {
                this.outroAnimations.push(animation);
                animation.clampWhenFinished = false;
            }
        }

        this.mixer.addEventListener('finished', (e) => { 
            if (e.action.getClip().name.startsWith("out")) {
                e.action.getRoot().visible = false;
                for (const animation of this.introAnimations) {
                    animation.reset();
                    animation.stop();
                }
            }
            if (e.action.getClip().name.startsWith("en")) {
                for (const animation of this.outroAnimations) {
                    animation.reset();
                    animation.stop();
                }
            }
        });

    }

    playIntro(duration) {
        for (const animation of this.introAnimations) {
            animation.setDuration(duration);
            animation.play();
            animation.getRoot().visible = true;
        }
    }
    playOutro(duration) {
        for (const animation of this.outroAnimations) {
            animation.setDuration(duration);
            animation.play();
            
        }
    }
}