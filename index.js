import { EventEmitter } from 'eventemitter3';

const addListenerFn = 'addEventListener';
const removeListenerFn = 'removeEventListener';

export default class WS extends EventEmitter {
  constructor(url, opt  = {}) {
    super();

    const dispose = () => {
      this._ws[removeListenerFn]('open', onopen);
      this._ws[removeListenerFn]('close', onclose);
      this._ws[removeListenerFn]('error', onerror);
      this._ws[removeListenerFn]('message', onmessage);
      delete this._ws;
    };

    const onopen = () => {
      this._ready = true;
      this.emit('open');
    };

    const onclose = () => {
      this._ready = false;
      dispose();
      this.emit('close');
      if (this.autoReconnect) connect();
    };

    const onerror = (error) => {
      this._ready = false;
      dispose();
      this.emit('error', error);
      if (this.autoReconnect) connect();
    };

    const onmessage = (msg) => {
      this.emit('message', msg);
    };

    const connect = () => {
      this._ws = new WebSocket(url, opt.options);
      this._ws[addListenerFn]('open', onopen);
      this._ws[addListenerFn]('close', onclose);
      this._ws[addListenerFn]('error', onerror);
      this._ws[addListenerFn]('message', onmessage);

      if (opt.binaryType) {
        this._ws.binaryType = opt.binaryType;
      }
    };

    this.autoReconnect = opt.autoReconnect !== false;
    this._connect = connect;

    if (this.autoReconnect) {
      connect();
    }
  }

  async send(data) {
    await this.ready();
    this._ws.send(data);
  }

  async close(code = 1000, reason = '') {
    if (!this._closing && this._ws) {
      this._closing = true;
      this._ws.close(code, reason);
      await new Promise(resolve => this.once('close', resolve));
      this._closing = false;
    }
  }

  async ready() {
    if (!this._ready) {
      if (!this._ws && !this.autoReconnect) this._connect();
      await new Promise(resolve => this.once('open', resolve));
    }
  }
};
