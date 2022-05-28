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
        this.tileGeometry = new THREE.BoxGeometry(this.tileWidth, this.tileHeight, this.tileDepth);
        this.tileMaterial = new THREE.MeshPhongMaterial({color: this.tileColor});
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
            if ("panel" in tileMap) {
                // This whole if is for responsive panels
                if ('use' in tileMap.panel) {
                    if (this.manager.config.touch && tileMap.panel.use === 'mobile') {
                        const panel = new Panel(tileMap.panel.position, tileMap.panel.name);
                        tile.setPanel(panel);
                    }
                    else if (!this.manager.config.touch && tileMap.panel.use === 'pc') {
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