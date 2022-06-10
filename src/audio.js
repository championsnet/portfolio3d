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

        // Ensure xylo notes are in proper order from heavy to light
        this.resources.items.xylo.sort(function(a, b) {
            var textA = a.name;
            var textB = b.name;
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        this.xylo = new THREE.Audio(this.listener);
        this.xylo.setVolume(0.075);
        this.xylo.detune = -100;

        this.soundtrack = new THREE.Audio(this.listener);
        this.soundtrack.setBuffer(this.resources.items.soundtrack);
        this.soundtrack.setLoop(true);
        this.soundtrack.setVolume(0.075);

        this.minigameOst = new THREE.Audio(this.listener);
        this.minigameOst.setBuffer(this.resources.items.minigameOst);
        this.minigameOst.setLoop(true);
        this.minigameOst.setVolume(0.075);

        this.victory = new THREE.Audio(this.listener);
        this.victory.setBuffer(this.resources.items.victory);
        this.victory.setVolume(0.075);

        this.drop = new THREE.Audio(this.listener);
        this.drop.setBuffer(this.resources.items.drop);
        this.drop.setVolume(0.5);

    }

    playNote(note) {
        if (note < 0) {
            note += 8;
        }
        this.xylo.setBuffer(this.resources.items.xylo[note]);
        if (this.xylo.isPlaying) this.xylo.stop();
        this.xylo.play();
    }
}