import * as THREE from 'three';
import Manager from './manager.js';

export default class Lights {

    constructor() {
        this.manager = new Manager();
        this.debug = this.manager.debug;
        this.scene = this.manager.scene;
        this.time = this.manager.time;

        this.directionalColor = 0xFFFF99;
        
        this.directionalIntensity = 1;
        this.lightOffset = new THREE.Vector3(-8, 20, -10);
        this.frustum = 15;
        this.resolution = 512;
        this.near = 0.5;
        this.far = 100;

        this.ambientColor = 0xffffff;
        this.ambientIntensity = 0.75;
        this.ambientColor = this.time.getHourColor();

        this.setupDirectional();
        this.setupAmbient();
    }

    setupDirectional() {
        this.directional = new THREE.DirectionalLight(this.directionalColor, this.directionalIntensity);
        this.directional.position.set(this.lightOffset.x, this.lightOffset.y, this.lightOffset.z);

        // Setup Directional Light Shadow
        this.directional.castShadow = true;
        this.directional.shadow.camera.left = - this.frustum;
        this.directional.shadow.camera.right = this.frustum;
        this.directional.shadow.camera.top = this.frustum;
        this.directional.shadow.camera.bottom = - this.frustum;
        this.directional.shadow.mapSize.width = this.resolution; // default
        this.directional.shadow.mapSize.height = this.resolution; // default
        this.directional.shadow.camera.near = this.near; // default
        this.directional.shadow.camera.far = this.far; // default

        this.scene.add(this.directional);
    }

    setupAmbient() {
        // Setup Ambient Light
        this.ambient = new THREE.AmbientLight( this.ambientColor, this.ambientIntensity); // soft white light
        this.scene.add(this.ambient);  
    }
}