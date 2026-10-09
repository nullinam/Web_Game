(() => {
  if (window.HTMLMediaElement) {
    document.querySelectorAll('audio,video').forEach(media => { media.muted = true; media.volume = 0; media.pause(); });
    window.HTMLMediaElement.prototype.play = function () { this.pause(); return Promise.resolve(); };
  }
  if (!window.AudioNode || !(window.AudioContext || window.webkitAudioContext)) return;
  const connect = window.AudioNode.prototype.connect;
  const buses = new WeakMap();
  window.AudioNode.prototype.connect = function (destination, ...args) {
    const context = this.context;
    if (context && destination === context.destination) {
      let bus = buses.get(context);
      if (!bus) {
        bus = context.createGain();
        bus.gain.value = 0;
        connect.call(bus, context.destination);
        buses.set(context, bus);
      }
      destination = bus;
    }
    return connect.call(this, destination, ...args);
  };
})();
