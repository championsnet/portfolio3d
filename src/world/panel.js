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
        this.lights = this.manager.lights;

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

        switch (this.position) {
            case 'front': 
                this.model.position.set(0, 2.7, this.offset);
                this.model.rotation.y = Math.PI;
                break;
            case 'right': 
                this.model.position.set(-this.offset, 2.7, 0);
                this.model.rotation.y = Math.PI/2;
                break;
            case 'back': 
                this.model.position.set(0, 2.7, -this.offset);
                break;
            case 'left':
                this.model.position.set(this.offset, 2.7, 0);
                this.model.rotation.y = -Math.PI/2;
                break;
        }
        this.model.scale.set(4.6, 4.6, 4.6);
        if (this.name === 'panel6') this.setRaycasts();
        this.setAnimations();
    }

    setLight() {
        
    }

    // If panel needs custom raycasts not embedded in the model build them here
    // That only goes for panel 6 as of now
    setRaycasts() {
        const geometry = new THREE.BoxGeometry(1.9, 0.001, 0.3);
        const material = new THREE.MeshPhongMaterial();
        this.ray1 = new THREE.Mesh(geometry, material);
        this.ray1.name = 'NFC';
        this.model.add(this.ray1);
        this.ray1.rotation.x = Math.PI/2;
        this.ray1.position.y += 1.4;
        this.ray1.position.z += 0.1;
        this.ray1.visible = false;
        this.ray2 = new THREE.Mesh(geometry, material);
        this.ray2.name = 'CPAGEING';
        this.model.add(this.ray2);
        this.ray2.rotation.x = Math.PI/2;
        this.ray2.position.y += 1.06;
        this.ray2.position.z += 0.1;
        this.ray2.visible = false;
        this.ray3 = new THREE.Mesh(geometry, material);
        this.ray3.name = 'PORTFOLIO';
        this.model.add(this.ray3);
        this.ray3.rotation.x = Math.PI/2;
        this.ray3.position.y += 0.72;
        this.ray3.position.z += 0.1;
        this.ray3.visible = false;
        this.ray4 = new THREE.Mesh(geometry, material);
        this.ray4.name = 'TICTACTOE';
        this.model.add(this.ray4);
        this.ray4.rotation.x = Math.PI/2;
        this.ray4.position.y += 0.38;
        this.ray4.position.z += 0.1;
        this.ray4.visible = false;
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
                this.onOutro = false;
                for (const animation of this.introAnimations) {
                    animation.reset();
                    animation.stop();
                }
            }
            if (e.action.getClip().name.startsWith("en")) {
                this.onIntro = false;
                if (e.action.timeScale == -1) {
                    e.action.getRoot().visible = false;
                    e.action.reset();
                    e.action.stop();
                }
                for (const animation of this.outroAnimations) {
                    animation.reset();
                    animation.stop();
                }
            }
        });

    }

    playIntro(duration) {
        this.onIntro = true;
        this.onOutro = false;
        this.introStart = this.time.current;
        this.lastIntroDuration = duration * 1000;
        for (const animation of this.introAnimations) {
            animation.setDuration(duration);
            animation.play();
            animation.getRoot().visible = true;
        }
    }
    playOutro(duration) {
        for (const animation of this.introAnimations) {
            if (animation.isRunning()) animation.timeScale = -1;
        }
        for (const animation of this.outroAnimations) {
            animation.setDuration(duration);
            animation.play();          
        }
        this.onIntro = false;
        this.onOutro = true;
    }
}