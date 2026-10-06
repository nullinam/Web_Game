/* Little Puzzles lifecycle bridge. Loaded before each original game engine. */
(() => {
  "use strict";
  const native = {
    timeout: window.setTimeout.bind(window), clear: window.clearTimeout.bind(window),
    raf: window.requestAnimationFrame.bind(window), cancel: window.cancelAnimationFrame.bind(window),
    now: performance.now.bind(performance), date: Date.now.bind(Date),
  };
  let paused = false, pauseStart = 0, pausedMs = 0, nextId = 1;
  const timers = new Map(), frames = new Map(), contexts = new Set(), playingMedia = new Set();
  const now = () => native.now() - pausedMs - (paused ? native.now() - pauseStart : 0);
  // Keep game time stationary while the parent presents a break or pause panel.
  try { Object.defineProperty(performance, "now", {value:now, configurable:true}); } catch {}
  Date.now = () => native.date() - pausedMs - (paused ? native.now() - pauseStart : 0);
  function arm(record) {
    if (paused) return;
    record.due = native.now() + record.remaining;
    record.nativeId = native.timeout(() => {
      if (paused || !timers.has(record.id)) return;
      if (!record.repeat) timers.delete(record.id);
      try { if (typeof record.callback === "function") record.callback(...record.args); else (0, eval)(String(record.callback)); }
      finally { if (record.repeat && timers.has(record.id)) { record.remaining = record.delay; arm(record); } }
    }, record.remaining);
  }
  function timer(callback, delay, args, repeat) {
    const id = nextId++, ms = Math.max(repeat ? 1 : 0, Number(delay) || 0);
    const record = {id, callback, args, delay:ms, remaining:ms, repeat, nativeId:0, due:0};
    timers.set(id,record); arm(record); return id;
  }
  window.setTimeout = (callback, delay, ...args) => timer(callback,delay,args,false);
  window.setInterval = (callback, delay, ...args) => timer(callback,delay,args,true);
  window.clearTimeout = window.clearInterval = id => { const record = timers.get(id); if (record) { native.clear(record.nativeId); timers.delete(id); } };
  function armFrame(record) {
    if (paused) return;
    record.nativeId = native.raf(() => { if (paused || !frames.has(record.id)) return; frames.delete(record.id); record.callback(now()); });
  }
  window.requestAnimationFrame = callback => { const record = {id:nextId++, callback, nativeId:0}; frames.set(record.id,record); armFrame(record); return record.id; };
  window.cancelAnimationFrame = id => { const record = frames.get(id); if (record) { native.cancel(record.nativeId); frames.delete(id); } };
  for (const name of ["AudioContext", "webkitAudioContext"]) {
    const Base = window[name]; if (!Base) continue;
    const Wrapped = function(...args) { const context = new Base(...args); contexts.add(context); if (paused) context.suspend().catch(() => {}); return context; };
    Wrapped.prototype = Base.prototype; Object.setPrototypeOf(Wrapped,Base); window[name] = Wrapped;
  }
  function setPaused(value) {
    if (paused === value) return;
    if (value) {
      pauseStart = native.now(); paused = true;
      for (const t of timers.values()) { t.remaining = Math.max(0,t.due-native.now()); native.clear(t.nativeId); }
      for (const f of frames.values()) native.cancel(f.nativeId);
      for (const c of contexts) if (c.state === "running") { c.__resumeAfterBreak = true; c.suspend().catch(() => {}); }
      document.querySelectorAll("audio,video").forEach(media => { if (!media.paused) { playingMedia.add(media); media.pause(); } });
    } else {
      pausedMs += native.now()-pauseStart; paused = false;
      for (const t of timers.values()) arm(t);
      for (const f of frames.values()) armFrame(f);
      for (const c of contexts) if (c.__resumeAfterBreak) { c.__resumeAfterBreak = false; c.resume().catch(() => {}); }
      for (const media of playingMedia) media.play().catch(() => {}); playingMedia.clear();
    }
  }
  window.addEventListener("message", event => { if (event.source !== parent || event.origin !== location.origin || event.data?.type !== "little-puzzles:pause") return; setPaused(event.data.paused === true); });
  // Prevent game listeners receiving input while timers/rendering are suspended.
  for (const name of ["keydown","keyup","pointerdown","pointerup","mousedown","mouseup","click"]) window.addEventListener(name,event => { if (paused) { event.preventDefault(); event.stopImmediatePropagation(); } },true);
  const send = payload => { if (parent !== window) parent.postMessage(payload,location.origin); };
  let errorSent = false;
  function report() { if (!errorSent) { errorSent = true; send({type:"little-puzzles:error"}); } }
  // Font/media failures are often optional in the original games; report engine failures.
  window.addEventListener("error", event => { if (event instanceof ErrorEvent || event.target?.tagName === "SCRIPT") report(); }, true);
  window.addEventListener("unhandledrejection", report);
  document.addEventListener("DOMContentLoaded", () => send({type:"little-puzzles:ready"}), {once:true});
  document.addEventListener("keydown", event => { if (event.key === "Escape") send({type:"little-puzzles:close"}); });
})();
