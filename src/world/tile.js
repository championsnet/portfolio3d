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
        this.elevator = null;

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

    setElevator(data, material) {
        this.elevator = {};
        this.elevator.start = {};
        this.elevator.start.x = data.x;
        this.elevator.start.y = data.y;
        this.elevator.start.z = data.z;
        // TODO for every possible direction
        this.elevator.start.right = data.right;

        this.elevator.end = {};
        this.elevator.end.x = data.elevator.x;
        this.elevator.end.y = data.elevator.y;
        this.elevator.end.z = data.elevator.z;
        // TODO for every possible direction
        this.elevator.end.right = data.elevator.right;

        this.elevator.rotation = data.elevator.rotate;

        this.elevator.currently = 'start';
        this.instance.material = material;
    }
}