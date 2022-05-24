import * as THREE from 'three';

import Manager from '../manager.js';

export default class Tile {

    constructor(_vector, _id, _geometry, _material) {

        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.loaderUI = this.manager.loaderUI;
        this.geometry = _geometry;
        this.material = _material;
        this.vector = _vector;
        this.id = _id;
        this.panel = null;

        this.makeTile();

        this.loaderUI.on('start', () => {
            if (this.panel && this.id == 0) this.panel.playIntro(1.5);
        });
    }

    makeTile() {
        this.instance = new THREE.Mesh(this.geometry, this.material);
        this.instance.position.set(this.vector.x, this.vector.y, this.vector.z);
        this.instance.receiveShadow = true;

        this.scene.add(this.instance);
    }

    setPanel(panel) {
        this.panel = panel;
        this.instance.add(panel.model);
    }
}