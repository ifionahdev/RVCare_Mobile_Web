const socket = {
  connected: false,
  connect() { this.connected = true; return this; },
  disconnect() { this.connected = false; return this; },
  on() {},
  off() {},
  emit() {},
};

export default socket;
