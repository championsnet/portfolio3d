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
        this.items.xylo = [];
    }

    startLoading() {
        for (const source of this.sources) {
            // Load GLTF types
            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) => {
                        this.items[source.name] = file;
                        this.sourceLoaded();
                    }
                );
            }

            // Load JSON types
            if (source.type === 'json') {
                this.loaders.d3.json(source.path).then((data) => {
                    this.items[source.name] = data;
                    this.sourceLoaded();    
                });
            }

            // Load Audio types
            if (source.type === 'audio') {
                this.loaders.audioLoader.load(
                    source.path,
                    (file) => {
                        this.items[source.name] = file;
                        this.sourceLoaded();
                    }
                );
            }

            // Load Piano folder
            if (source.type === 'audio-note') {
                this.loaders.audioLoader.load(
                    source.path,
                    (file) => {
                        file.name = source.name;
                        this.items.xylo.push(file);
                        this.sourceLoaded();
                    }
                );
            }
        }
    }

    sourceLoaded() {
        this.trigger('itemLoaded');
        this.loaded++;

        if (this.loaded === this.toLoad) {
            this.trigger('ready');
        }
    }
}