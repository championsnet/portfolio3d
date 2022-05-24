import * as THREE from 'three';
import Manager from './manager.js';

export default class Renderer
{
    constructor()
    {
        this.manager = new Manager();
        this.canvas = this.manager.canvas;
        this.sizes = this.manager.sizes;
        this.scene = this.manager.scene;
        this.camera = this.manager.camera;

        this.setInstance();
    }

    setInstance()
    {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            premultipliedAlpha: false,
            antialias: this.manager.config.antiAliasing,
            powerPreference: "high-performance"
        });
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
        this.instance.outputEncoding = THREE.sRGBEncoding;
        this.instance.shadowMap.enabled = true;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap; 
    
    }

    resize()
    {
        this.instance.setSize(this.sizes.width, this.sizes.height);
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
    }

    update() {
        this.instance.render(this.scene, this.camera.instance);
    }
}