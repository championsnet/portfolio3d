import Manager from './manager.js';
import EventEmitter from './utils/event-emitter.js';

export default class LoaderUI extends EventEmitter {
    
    constructor() {
        super();

        this.manager = new Manager();
        this.scene = this.manager.scene;
        this.audio = this.manager.audio;
        this.resources = this.manager.resources;
        this.sizes = this.manager.sizes;
        this.loader = document.querySelector('#loader');
        this.progress = document.querySelector('#progress');
        this.startButton = document.querySelector('#start');

        // Progress
        this.resources.on('itemLoaded', () =>
        {
            this.progressRatio = (this.resources.loaded + 1)/ this.resources.toLoad;
            
            this.progress.innerHTML = Math.trunc(this.progressRatio * 100);
        });

        //Loaded
        this.resources.on('ready', () =>
        {

            // window.setTimeout(() =>
            // {
            //     this.cooking.classList.add('fade')
            // }, 1500)

            window.setTimeout(() =>
            {
                this.readyScreen();
            }, 100);
        });
    }

    readyScreen() {
        this.startButton.style.opacity = 1;
        const toChange = document.getElementsByTagName('polyline');
  
        for (let i=0; i<toChange.length; i++) {
            toChange[i].classList.remove("stroke-animation");
            toChange[i].style.stroke = '#aa8844';
        }

        this.loader.addEventListener("click", async () => {
            this.loader.classList.add('hidden');
            this.audio.setAudio();
            this.audio.soundtrack.play();

            // Some browsers need it
            this.sizes.resize();

            // Emit Start Event
            this.trigger('start');

        },{ once: true });
    }

    sleep(ms) 
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}