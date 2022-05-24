import * as THREE from 'three';
import Manager from './manager.js';


export default class Camera {

    constructor() {
        this.manager = new Manager();
        this.debug = this.manager.debug;
        this.sizes = this.manager.sizes;
        this.scene = this.manager.scene;
        this.canvas = this.manager.canvas;
        this.config = this.manager.config;

        this.offset = new THREE.Vector3(0, 6, -7);
        this.fov = 75;
        this.near = 1;
        this.far = 2000;
        if (this.config.vertical) {
            this.fov = 80;
            this.far = 500;
        }

        this.setInstance();

    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(this.fov, this.sizes.aspect, this.near, this.far);
        this.instance.position.set(this.offset.x, this.offset.y, this.offset.z);
        this.instance.lookAt(0, 0, 50);

        // // Set audio listener
        // this.listener = new THREE.AudioListener();
        // this.instance.add(this.listener);

        // Camera tile location
        this.location = 0;

        this.scene.add(this.instance);
    }

    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height;
        this.instance.updateProjectionMatrix();
    }

    // TODO update camera position if orbit controls is used
    update() {

    }
}