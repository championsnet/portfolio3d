import * as THREE from 'three';
import Manager from './manager.js';

export default class Raycaster {

    constructor() {
        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.resources = this.manager.resources;
        this.camera = this.manager.camera.instance;
        this.sizes = this.manager.sizes;
        this.loaderUI = this.manager.loaderUI;
        this.controller = this.manager.controller;
        this.config = this.manager.config;
        this.tiles = this.manager.world.tiles;
        this.logic =  this.manager.controller.logic;

        this.loaderUI.on('start', () => {
            this.config.touch = this.manager.config.touch;
            this.instance = new THREE.Raycaster();
            this.cursor = new THREE.Vector2();
            this.clickListener();
        });
    }

    clickListener() {
        window.addEventListener("click", (event) => {
            if (!this.logic.actionsAllowed) return;
            this.cursor.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.cursor.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        
            this.instance.setFromCamera( this.cursor, this.camera );
            const intersects = this.instance.intersectObjects( this.scene.children );
            for ( let i = 0; i < intersects.length; i ++ ) {
                if (intersects[ i ].object.name.includes("Tile0_0")) {
                    window.location.href = "mailto:vaggos@stamko.info";
                    break;
                }
                if (intersects[ i ].object.name.includes("Tile0_1")) {
                    window.location.href = "tel:00306977152560";
                    break;
                }
                if (intersects[ i ].object.name.includes("Tile1_0")) {
                    const url = "https://github.com/championsnet";
                    window.open(url, '_blank').focus();
                    break;
                }
                if (intersects[ i ].object.name.includes("Tile1_1")) {
                    const url = "https://www.linkedin.com/in/evan-gelos-chane";
                    window.open(url, '_blank').focus();
                    break;
                }
                if (intersects[ i ].object.name.includes("NFC")) {
                    const url = "https://stamko.info/files/elevit21.pdf";
                    window.open(url, '_blank').focus();
                    break;
                }
                if (intersects[ i ].object.name.includes("CPAGEING")) {
                    const url = "https://elearning.cpageing.eu";
                    window.open(url, '_blank').focus();
                    break;
                }
                if (intersects[ i ].object.name.includes("PORTFOLIO")) {
                    window.alert("You are here! I appreciate any feedback btw :)");
                    break;
                }
                if (intersects[ i ].object.name.includes("TICTACTOE")) {
                    // TODO SOMETHING
                    window.alert("Will do something in the future!")
                    break;
                }     
            }
        });
    }
}