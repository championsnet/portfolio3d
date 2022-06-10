import * as THREE from 'three';
import Manager from './manager.js';
import EventEmitter from './utils/event-emitter.js';

export default class Player extends EventEmitter {

    constructor() {
        super();
        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.time = this.manager.time;
        this.resources = this.manager.resources;

        // Wait for resources
        this.resources.on('ready', () => {
            this.setPlayer();
            this.setDoppleganger();
            this.setAnimations();
        });

        // Time tick event
        this.time.on('tick', () =>
        {
            this.update();
        });
    }

    update() {
        if ( this.mixer ) this.mixer.update(this.time.delta * 0.001);
    }

    setPlayer() {
        this.resource = this.resources.items.alien;
        this.model = this.resource.scene;
        this.location = 0;
        this.direction = 'front';

        // Cast shadow
        this.model.traverse( function ( object ) {
            if ( object.isMesh ) {
              object.castShadow = true;
            }
        });

        this.scene.add(this.model);
        this.model.position.set(0, 0.5+this.randomOffsetVal(), 0);
    }

    setDoppleganger() {
        this.geometry = new THREE.BoxGeometry(1, 0.001, 1);
        this.material = new THREE.MeshPhongMaterial();
        this.doppleganger = new THREE.Mesh(this.geometry, this.material);
        this.doppleganger.visible = false;
        this.doppleganger.position.set(0, 0.5, 0);
        this.scene.add(this.doppleganger);
    }

    setAnimations() {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.animations = [];
        this.jumps = [];
        for (let i = 0; i<this.resource.animations.length; i++) {
            const animation = this.mixer.clipAction(this.resource.animations[i]);
            animation.clampWhenFinished = true;
            animation.setLoop(THREE.LoopOnce);
            this.animations.push(animation);
            if (this.resource.animations[i].name.startsWith("Death")) this.deathAnimation = animation;
            if (this.resource.animations[i].name.startsWith("Jump")) this.jumps.push(animation);
            if (this.resource.animations[i].name.startsWith("RotateL")) this.leftAnimation = animation;
            if (this.resource.animations[i].name.startsWith("RotateR")) this.rightAnimation = animation;
            if (this.resource.animations[i].name.startsWith("Victory")) this.victoryAnimation = animation;
        } 

        this.mixer.addEventListener('finished', (e) => { 
            if (e.action.getClip().name.startsWith("Jump")) {
                e.action.reset();
                e.action.stop();
                this.trigger('finished');
            }
            if (e.action.getClip().name.startsWith("Victory")) {
                this.trigger('victory-finished');
            }
        });
    }

    randomOffsetVal() {
        return Math.floor(Math.random() * 10000) * 0.000001;
    }
}