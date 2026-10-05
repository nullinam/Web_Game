import type { GameController } from "../controller";
import type { Run, ArcadeStats } from "../phaser/run";
import "./style.css";

/** Isolates the supplied vanilla engine's globals, input listeners, and canvas. */
export function mountCosmic(parent: HTMLElement, initial: Run): GameController {
  const frame = document.createElement("iframe");
  frame.className = "shooter-frame";
  frame.title = "Cosmic Strike combat area";
  frame.src = `${(import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL}games/cosmic-strike/index.html`;
  let run = initial, ready = false, paused = false, score = 0, completed = false;
  const send = (action: string, extra = {}) => frame.contentWindow?.postMessage({ channel: "little-cosmic", action, ...extra }, location.origin);
  const start = () => { score = 0; completed = false; send("start", { level: run.level, size: run.size, seed: run.seed }); if (paused) send("pause"); };
  const receive = (event: MessageEvent) => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow || event.data?.channel !== "little-cosmic") return;
    const data = event.data;
    if (data.action === "ready") { ready = true; start(); }
    if (data.action === "stats" && data.seed === run.seed) {
      const stats = data.stats as ArcadeStats;
      score = Number(stats.score) || 0;
      run.onStats?.(stats);
    }
    if (data.action === "solved" && data.seed === run.seed && !completed) { completed = true; run.onSolved?.(score); }
    if (data.action === "restart" && !paused) run.onRestart?.();
  };
  window.addEventListener("message", receive);
  parent.append(frame);
  return {
    restart(next) { run = next; if (ready) start(); },
    pause() { paused = true; if (ready) send("pause"); },
    resume() { paused = false; if (ready) send("resume"); },
    hint() { send("hint"); frame.focus(); },
    lifeline() { send("shield"); frame.focus(); },
    getScore: () => score,
    destroy() { window.removeEventListener("message", receive); send("destroy"); frame.remove(); },
  };
}
