import type { GameInfo } from "../../data/games";
import { attachBreakSession } from "./session";
import "./style.css";

const escape = (value: string) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c]!));

export function mountImportedGame(root: HTMLElement, game: GameInfo) {
  if (!game.sourcePath || !/^collection\/games\/[a-z0-9-]+\/[a-z0-9-]+\/index\.html$/.test(game.sourcePath)) throw new Error("Invalid collection entry");
  let frame: HTMLIFrameElement | null = null;
  let disposed = false, manualPaused = false, sessionPaused = false, failed = false;
  root.innerHTML = `<section class="imported-shell">
    <header class="imported-header"><div><span class="puzzle-brand">LITTLE PUZZLES · COLLECTION</span><h2>${escape(game.title)}</h2></div><div class="imported-tools"><span data-clock>30:00 break</span><button data-pause disabled>Pause</button><button data-restart disabled>Restart</button><button data-fullscreen disabled>Fullscreen</button></div></header>
    <details class="imported-rules" open><summary>How to play</summary><p>${escape(game.instructions)}</p><p>Use the mouse and the keyboard controls shown inside the game. Restart reloads this game's original setup. Its menus, scoring and level progression are preserved.</p></details>
    <p class="imported-status" data-status role="status">Ready to play · ${escape(game.category || game.kind)}</p>
    <div class="imported-stage"><div class="imported-start" data-start-panel><button class="puzzle-next" data-start>Start playing →</button><p>Original game code and artwork from the Games Hub collection.</p></div><div class="imported-cover" data-cover hidden><strong>Paused</strong><button data-resume>Resume play</button></div></div>
    <footer class="imported-footer"><span>Mouse and keyboard · Escape closes</span><a href="${import.meta.env.BASE_URL}collection/LICENSE.txt" target="_blank" rel="noopener">Games Hub · MIT license</a></footer>
    <div class="puzzle-notice" data-break hidden role="dialog" aria-modal="true"><div class="notice-card"><span class="notice-kicker">TIME TO RESET</span><h3>Take a short break</h3><p>You’ve played for 30 minutes. Step away and get back to your day.</p><div class="notice-actions"><button data-return>Back to work</button><button data-snooze>Snooze 15 minutes</button></div></div></div>
    <div class="puzzle-notice" data-lock hidden role="alertdialog" aria-modal="true"><div class="notice-card"><span class="notice-kicker">BREAK WINDOW</span><h3>Play time is paused</h3><p>You’ve reached 90 minutes. This browser unlocks after a two-hour break.</p><strong data-unlock-time></strong></div></div>
  </section>`;
  const stage = root.querySelector<HTMLElement>(".imported-stage")!;
  const status = root.querySelector<HTMLElement>("[data-status]")!;
  const pauseButton = root.querySelector<HTMLButtonElement>("[data-pause]")!;
  const startPanel = root.querySelector<HTMLElement>("[data-start-panel]")!;
  const cover = root.querySelector<HTMLElement>("[data-cover]")!;
  const shell = root.querySelector<HTMLElement>(".imported-shell")!;
  function updatePause() {
    const paused = manualPaused || sessionPaused || failed;
    frame?.contentWindow?.postMessage({type:"little-puzzles:pause", paused}, location.origin);
    cover.hidden = !manualPaused || sessionPaused;
    pauseButton.textContent = manualPaused ? "Resume" : "Pause";
    pauseButton.disabled = !frame || sessionPaused || failed;
    if (!paused) frame?.focus();
  }
  const breaks = attachBreakSession(root, paused => { sessionPaused = paused; updatePause(); }, () => !!frame && !manualPaused && !failed);
  function load() {
    if (disposed || breaks.blocked()) return;
    frame?.remove();
    manualPaused = false; failed = false; startPanel.hidden = true;
    frame = document.createElement("iframe");
    frame.className = "imported-frame"; frame.title = game.title;
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
    frame.allow = "autoplay; fullscreen";
    frame.src = `${import.meta.env.BASE_URL}${game.sourcePath}`;
    frame.addEventListener("load", () => { if (disposed) return; updatePause(); });
    stage.prepend(frame);
    status.textContent = "Loading game…";
    root.querySelector<HTMLButtonElement>("[data-restart]")!.disabled = false;
    root.querySelector<HTMLButtonElement>("[data-fullscreen]")!.disabled = false;
    root.querySelector<HTMLDetailsElement>(".imported-rules")!.open = false;
    breaks.start(); updatePause();
  }
  function messages(event: MessageEvent) {
    if (disposed || event.source !== frame?.contentWindow || event.origin !== location.origin) return;
    let data = event.data;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch { return; } }
    if (!data || typeof data !== "object") return;
    if (data.type === "little-puzzles:close") { root.closest<HTMLDialogElement>("dialog")?.close(); return; }
    if (data.type === "little-puzzles:ready") { if (!failed) status.textContent = "Game loaded · follow the instructions on the board"; updatePause(); }
    if (data.type === "little-puzzles:error") { failed = true; status.textContent = "This game reported a loading error. Check your connection, then use Restart. Some source games load their engine from a CDN."; updatePause(); }
    if (data.type === "orientation") { stage.classList.toggle("landscape", data.value === "landscape"); }
    if (data.type === "sceneComplete") { status.textContent = data.result === "win" ? "Challenge complete · use the game’s replay controls or Restart" : "Round finished · use the game’s replay controls"; }
  }
  const start = () => { if (!window.matchMedia("(pointer: fine) and (hover: hover)").matches) { status.textContent = "Open this game on a desktop or laptop with a mouse and keyboard."; return; } load(); };
  root.querySelector("[data-start]")!.addEventListener("click", start);
  root.querySelector("[data-restart]")!.addEventListener("click", load);
  const toggle = () => { if (!frame || sessionPaused || failed) return; manualPaused = !manualPaused; updatePause(); };
  pauseButton.addEventListener("click", toggle);
  root.querySelector("[data-resume]")!.addEventListener("click", toggle);
  root.querySelector("[data-fullscreen]")!.addEventListener("click", async () => {
    try { if (document.fullscreenElement === shell) await document.exitFullscreen(); else await shell.requestFullscreen(); }
    catch { status.textContent = "Fullscreen is unavailable in this browser. You can still play in the game panel."; }
  });
  const visibility = () => { if (document.hidden && frame) { manualPaused = true; updatePause(); } };
  window.addEventListener("message", messages);
  document.addEventListener("visibilitychange", visibility);
  return () => { if (disposed) return; disposed = true; breaks.destroy(); window.removeEventListener("message", messages); document.removeEventListener("visibilitychange", visibility); frame?.remove(); frame = null; root.replaceChildren(); };
}
