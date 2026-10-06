// Collection games use the same browser-only break budget as the native games.
const lockKey = "little-puzzles:play-lock-until";
const timeKey = "little-puzzles:play-minutes";
const dueKey = "little-puzzles:break-due";
const minutes = (n: number) => n * 60 * 1000;
export function attachBreakSession(root: HTMLElement, pause: (paused: boolean) => void, playing: () => boolean) {
  let started = false, disposed = false, breakVisible = false, locked = false, last = Date.now();
  const clock = root.querySelector<HTMLElement>("[data-clock]")!;
  const breakPanel = root.querySelector<HTMLElement>("[data-break]")!;
  const lockPanel = root.querySelector<HTMLElement>("[data-lock]")!;
  const unlock = root.querySelector<HTMLElement>("[data-unlock-time]")!;
  const number = (key: string, fallback: number) => { const n = Number(localStorage.getItem(key) ?? fallback); return Number.isFinite(n) && n >= 0 ? n : fallback; };
  function tick() {
    if (disposed) return;
    const now = Date.now(), delta = Math.max(0, Math.min(2000, now - last)); last = now;
    const until = number(lockKey, 0);
    if (until > now) {
      if (!locked) { locked = true; breakVisible = false; breakPanel.hidden = true; lockPanel.hidden = false; pause(true); }
      unlock.textContent = `Unlocks at ${new Date(until).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})} · ${Math.ceil((until-now)/60000)} min remaining`;
      return;
    }
    if (locked || until > 0) { locked = false; localStorage.removeItem(lockKey); localStorage.setItem(timeKey,"0"); localStorage.setItem(dueKey,String(minutes(30))); lockPanel.hidden = true; pause(false); }
    let elapsed = number(timeKey, 0);
    if (started && !breakVisible && !document.hidden && playing()) { elapsed += delta; localStorage.setItem(timeKey, String(elapsed)); }
    if (elapsed >= minutes(90)) { localStorage.setItem(lockKey,String(now+minutes(120))); tick(); return; }
    const remaining = Math.max(0, number(dueKey,minutes(30))-elapsed);
    clock.textContent = `${String(Math.floor(remaining/60000)).padStart(2,"0")}:${String(Math.floor(remaining%60000/1000)).padStart(2,"0")} break`;
    if (started && !remaining && !breakVisible) { breakVisible = true; breakPanel.hidden = false; pause(true); root.querySelector<HTMLButtonElement>("[data-snooze]")!.focus(); }
  }
  const storage = (e: StorageEvent) => { if ([lockKey,timeKey,dueKey].includes(e.key || "")) tick(); };
  const snooze = () => { if (locked) return; localStorage.setItem(dueKey,String(number(timeKey,0)+minutes(15))); breakVisible=false; breakPanel.hidden=true; last=Date.now(); pause(false); tick(); };
  const back = () => window.dispatchEvent(new CustomEvent("game:return-to-work"));
  window.addEventListener("storage", storage);
  root.querySelector("[data-snooze]")!.addEventListener("click", snooze);
  root.querySelector("[data-return]")!.addEventListener("click", back);
  const timer = window.setInterval(tick,1000); tick();
  return { start() { started=true; last=Date.now(); tick(); }, blocked() { return locked || breakVisible || number(lockKey,0)>Date.now(); }, destroy() { disposed=true; clearInterval(timer); window.removeEventListener("storage",storage); root.querySelector("[data-snooze]")?.removeEventListener("click",snooze); root.querySelector("[data-return]")?.removeEventListener("click",back); } };
}
