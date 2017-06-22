/**
 * Created by Goga- on 21-Jun-17.
 */
const cfg = require('../cfg');
const robot = require('robotjs');
const EE = require('events');

class UserBehavior {

    constructor(opts) {
        this.ee = new EE();

        this.on = false;
        this.x = 0;
        this.y = 0;
        this.delay = 1000;
        this.timeout = 0;
        this.maxTimeout = 30000;

        if(opts) {
            if (opts.delay) this.delay = opts.delay;
            if (opts.maxTimeout) this.maxTimeout = opts.maxTimeout * 60000;
        }
    }

    switchCheck(on){
        this.on = on;
        if(this.on) this.checkActivity();
    }
    checkActivity(){
        let result = robot.getMousePos();
        if(this.x === result.x && this.y === result.y) this.timeout += this.delay;
        else this.timeout = 0;
        // if(cfg.debug) console.log('Mouse timeout: ' + this.timeout);
        if(this.timeout >= this.maxTimeout) {
            if(cfg.debug) console.log('Mouse timeout reached: ' + this.timeout);
            this.ee.emit('maxTimeoutReached');
        }
        this.x = result.x;
        this.y = result.y;
        // console.log('Mouse X = ' + this.x + ' Y = ' + this.y);
        if(this.on){
            let that = this;
            setTimeout(function () {
                that.checkActivity();
            }, this.delay)
        }
    }
}

// expose the class
module.exports = UserBehavior;