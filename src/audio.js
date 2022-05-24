import * as THREE from 'three';
import Manager from './manager.js';

export default class Audio {
    
    constructor() {

        this.manager = new Manager();
        this.resources = this.manager.resources;
    }

    setAudio() {
        this.listener = new THREE.AudioListener();

        this.jump = new THREE.Audio(this.listener);
        this.jump.setBuffer(this.resources.items.jump);
        this.jump.setVolume(0.5);
        this.jump.detune = 1200;

        this.soundtrack = new THREE.Audio(this.listener);
        this.soundtrack.setBuffer(this.resources.items.soundtrack);
        this.soundtrack.setLoop(true);
        this.soundtrack.setVolume(0.05);

        // START & STOP SOUNDTRACK BASED ON TAB FOCUS
        window.onfocus = () => {
            this.soundtrack.play();
        };
        window.onblur = () => {
            this.soundtrack.pause();
        };

    }
}