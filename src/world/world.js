import * as THREE from 'three';

import Manager from '../manager.js';
import Tile from './tile.js';
import Panel from './panel.js';

export default class World {

    constructor() {

        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.resources = this.manager.resources;

        this.tileWidth = 9;
        this.tileHeight = 1;
        this.tileDepth = 9;
        this.tileColor = 0xa1811a;
        this.elevatorColor = 0xFF5733;
        this.tileGeometry = new THREE.BoxGeometry(this.tileWidth, this.tileHeight, this.tileDepth);
        this.tileMaterial = new THREE.MeshPhongMaterial({color: this.tileColor});
        this.elevatorMaterial = new THREE.MeshPhongMaterial({color: this.elevatorColor});
        this.tiles = [];
        
        // Wait for resources
        this.resources.on('ready', () => {
            this.createTiles();
            this.createHills();
        });
    }

    createTiles() {
        let i = 0;
        for (const tileMap of this.resources.items.tiles) {
            const vector = new THREE.Vector3(tileMap.x, tileMap.y, tileMap.z);
            const tile = new Tile(vector, i, this.tileGeometry, this.tileMaterial);
            if ("elevator" in tileMap) {
                tile.setElevator(tileMap, this.elevatorMaterial);
            }
            if ("panel" in tileMap) {
                // This whole if is for responsive panels, 'd' for desktop and 'm' for mobile
                if ('responsive' in tileMap.panel) {
                    
                    if (this.manager.config.vertical) {
                        tileMap.panel.name += 'm';
                        const panel = new Panel(tileMap.panel.position, tileMap.panel.name);
                        tile.setPanel(panel);
                    }
                    else {
                        tileMap.panel.name += 'd';
                        const panel = new Panel(tileMap.panel.position, tileMap.panel.name);
                        tile.setPanel(panel);
                    }
                }
                // If no responsiveness setting then just go on
                else {
                    const panel = new Panel(tileMap.panel.position, tileMap.panel.name);
                    tile.setPanel(panel);
                }
            }
            this.tiles.push(tile);
            i++;
        }
    }

    createHills() {
        this.hillsResource = this.resources.items.hills;
        this.hills = this.hillsResource.scene;
        this.scene.add(this.hills);
        this.hills.position.set(0, -20, 30);
        this.hills.scale.set(30, 30, 30);
    }
}