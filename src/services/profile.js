const KEY = "playground.profile.v1";
const defaults = { name: "Player One", points: 1240 };

export function getProfile() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return { ...defaults }; }
}

export function updateProfile(patch) {
  const next = { ...getProfile(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
