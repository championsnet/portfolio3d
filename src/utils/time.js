import EventEmitter from './event-emitter.js'

export default class Time extends EventEmitter
{
    constructor()
    {
        super();

        // Setup
        this.start = Date.now();
        this.current = this.start;
        this.elapsed = 0;
        this.delta = 16;

        // Morning to afternoon, afternoon to evening, evening, to morning hours
        this.m2a = 17;
        this.a2e = 22;
        this.e2m = 7;

        window.requestAnimationFrame(() =>
        {
            this.tick();
        })
    }

    tick()
    {
        const currentTime = Date.now();
        this.delta = currentTime - this.current;
        this.current = currentTime;
        this.elapsed = this.current - this.start;

        this.trigger('tick');

        window.requestAnimationFrame(() =>
        {
            this.tick();
        })
    }

    getHourColor() {
        const d = new Date();
        const hour = d.getHours();

        if (hour > this.e2m && hour < this.m2a) return 0xe6ffff;
        else if (hour >= this.m2a && hour < this.a2e) return 0xFAD6A5;
        else return 0x3e3a52;
    }

    getHourColorFog() {
        const d = new Date();
        const hour = d.getHours();

        if (hour > this.e2m && hour < this.m2a) return 0xe6ffff;
        else if (hour >= this.m2a && hour < this.a2e) return 0xdba579;
        else return 0x080429;
    }

    getTimeOfDay() {
        const d = new Date();
        const hour = d.getHours();
        
        if (hour > this.e2m && hour < this.m2a) return 'm';
        else if (hour >= this.m2a && hour < this.a2e) return 'a';
        else return 'e';
    }
}