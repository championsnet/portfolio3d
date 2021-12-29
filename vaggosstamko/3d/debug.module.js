
class ClearingLogger {
    constructor(elem) {
      this.elem = elem;
      this.lines = [];
    }
    log(...args) {
      this.lines.push([...args].join(' '));
    }
    render() {
      this.elem.textContent = this.lines.join('\n');
      this.lines = [];
    }
}

export default ClearingLogger;
