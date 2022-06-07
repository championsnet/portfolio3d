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
        this.progress = document.querySelector('.load-message');
        this.startButton = document.querySelector('.start');
        this.previousProgress = 0;
        this.progressRatio = 0;

        // Progress
        this.resources.on('itemLoaded', () =>
        {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = 0;
            }
            this.previousProgress = this.progressRatio;
            this.progressRatio = (this.resources.loaded + 1)/ this.resources.toLoad;
            if (this.progressRatio == 0) this.progress.innerHTML = "Connecting...";
            else if (this.progressRatio == 1) this.progress.innerHTML = "Loaded 100%";
            else {
                this.transitionRatio(this.previousProgress, this.progressRatio);
            }
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

    transitionRatio(from, to) {
        if (from != to && from < 0.99) {
            from += 0.01;
            this.progress.innerHTML = "Loading... " + Math.trunc(from * 100) + "%";
            this.timer = setTimeout(() => {
                this.transitionRatio(from, to);
            }, 200/(to-from)/100);
        }
    }

    readyScreen() {
        this.startButton.style.opacity = 1;
        const toChange = document.getElementsByTagName('polyline');
  
        for (let i=0; i<toChange.length; i++) {
            toChange[i].classList.remove("stroke-animation");
            toChange[i].style.stroke = '#ffffff';
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