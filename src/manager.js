import * as THREE from 'three';
import Debug from './utils/debug.js';
import Sizes from './utils/sizes.js';
import Time from './utils/time.js';
import Camera from './camera.js';
import Renderer from './renderer.js';
import Lights from './lights.js';
import World from './world/world.js';
import Player from './player.js';
import Resources from './utils/resources.js';
import sources from './sources.js';
import Audio from './audio.js';
import LoaderUI from './loader-ui.js';
import Animator from './animator.js';
import Controller from './controller.js';
import Raycaster from './raycaster.js';

let instance = null;

export default class Manager
{
    constructor(_canvas)
    {
        // Singleton
        if(instance)
        {
            return instance;
        }
        instance = this;
        

        // Global access
        window.manager = this;

        // Options
        this.canvas = _canvas;

        // Configuration
        this.config = {};
        this.config.touch = false;

        // If touch is made once then use touch config globally
        window.addEventListener('ontouchstart', () => {
            this.config.touch = true;
        }, {once: true});

        // Setup
        this.debug = new Debug();
        this.time = new Time();
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( this.time.getHourColor() );
        this.scene.fog = new THREE.FogExp2( this.time.getHourColorFog(), 0.0025 );
        this.sizes = new Sizes();
        if (this.sizes.width / this.sizes.height > 1) {this.config.vertical = false}
        else {this.config.vertical = true}

        this.config.antiAliasing = true;
        if (this.sizes.pixelRatio > 1) {
            this.config.antiAliasing = false;
        }


        this.camera = new Camera();
        this.renderer = new Renderer();
        this.lights = new Lights();   
        this.resources = new Resources(sources);
        // this.performance = new Performance();
        
        this.world = new World();
        this.player = new Player();
        this.audio = new Audio();
        this.loaderUI = new LoaderUI();
        this.animator = new Animator();
        // this.materials = new Materials()
        // this.animations = new Animations();
        // this.postProcessing = new PostProcessing();
        this.controller = new Controller();
        this.raycaster = new Raycaster();

        

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.resize();
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            this.update();
        })
    }

    resize()
    {
        this.camera.resize();
        this.renderer.resize();
        // this.postProcessing.resize();
    }

    update()
    {
        this.renderer.update();
        this.controller.update();
        // this.camera.update();
        // this.world.update();
        // this.postProcessing.update();
        // this.animations.update();
        // this.performance.update();
    }
}