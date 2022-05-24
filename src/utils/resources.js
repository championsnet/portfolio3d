import * as THREE from 'three';
import Manager from '../manager.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import EventEmitter from './event-emitter.js';
import * as d3 from "d3";

export default class Resources extends EventEmitter {

    constructor(sources) {

        super();

        this.manager = new Manager();
        this.sources = sources;

        this.items = {};
        this.toLoad = this.sources.length;
        this.loaded = 0;

        this.setLoaders();
        this.startLoading();
    }

    setLoaders() {
        this.loaders = {};
        this.loaders.gltfLoader = new GLTFLoader();
        this.loaders.d3 = d3;
        this.loaders.audioLoader = new THREE.AudioLoader();
    }

    startLoading() {
        for (const source of this.sources) {
            // Load GLTF types
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file);
                    }
                );
            }

            // Load JSON types
            if (source.type === 'json') {
                this.loaders.d3.json(source.path).then((data) => {
                    this.sourceLoaded(source, data);    
                });
            }

            // Load Audio types
            if (source.type === 'audio') {
                this.loaders.audioLoader.load(
                    source.path,
                    (file) => {
                        this.sourceLoaded(source, file);
                    }
                );
            }
        }
    }

    sourceLoaded(source, file) {
        this.trigger('itemLoaded');

        this.items[source.name] = file;
        this.loaded++;

        if (this.loaded === this.toLoad) {
            this.trigger('ready');
        }
    }
}