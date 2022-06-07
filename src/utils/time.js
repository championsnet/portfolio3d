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

        if (hour > 6 && hour < 17) return 0xe6ffff;
        else if (hour >= 17 && hour < 22) return 0xFAD6A5;
        else return 0x3e3a52;
    }

    getHourColorFog() {
        const d = new Date();
        const hour = d.getHours();

        if (hour > 6 && hour < 17) return 0xe6ffff;
        else if (hour >= 17 && hour < 22) return 0xdba579;
        else return 0x080429;
    }
}