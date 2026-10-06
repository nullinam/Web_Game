import collection from "./collection.json";
export type GameId = string;

export type GameInfo = {
  id: GameId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  material: string;
  instructions: string;
  sizes: number[];
  sizeLabel: string;
  lifeline: string;
  controls: string;
  kind: string;
  category?: string;
  sourcePath?: string;
  tags?: string[];
};

const nativeGames: GameInfo[] = [
  { id: "pacman", title: "Pacman", kind: "arcade", subtitle: "The arcade chase", description: "Clear the maze, outsmart four ghosts, and turn the chase around with power pellets.", icon: "◕", accent: "#ffda73", material: "arcade", instructions: "Eat every dot to clear the maze. Power pellets let you catch ghosts; avoid them when the power runs out. You have three lives.", sizes: [19, 25, 31], sizeLabel: "Maze", lifeline: "Freeze ghosts", controls: "Arrow keys or WASD move · P / Space pauses · R restarts" },
  { id: "memory", title: "Memory Card Match", kind: "puzzle", subtitle: "A little focus goes far", description: "Flip, remember, and match every pair. Fresh card layouts put your attention to the test.", icon: "✳", accent: "#c3aff0", material: "memory", instructions: "Flip two cards. Matching pairs stay face up; different cards turn back. Match every pair within the move budget. One move is two flips.", sizes: [4, 5, 6], sizeLabel: "Cards", lifeline: "Peek at cards", controls: "Click cards · Arrow keys move between cards · Enter or Space flips · P pauses" },
  { id: "color-match", title: "Color Match", kind: "reaction", subtitle: "Trust your eyes", description: "A word says one thing; its ink says another. Choose the ink and keep your streak alive.", icon: "◉", accent: "#f4a98d", material: "color", instructions: "Choose the ink color, not the meaning of the word. Survive a 60-second round with three lives. Wrong answers and expired questions cost a life. Five-answer streaks earn bonuses.", sizes: [4, 6, 8], sizeLabel: "Palette", lifeline: "Freeze clocks", controls: "Click the color label · Keys 1–8 answer · P pauses" },
  { id: "typing-speed", title: "Typing Speed", kind: "arcade", subtitle: "Keep the words afloat", description: "Type falling words before they land. Build a streak and track your WPM and accuracy.", icon: "Aa", accent: "#90cde2", material: "typing", instructions: "Type any falling word exactly to clear it. Reach the word target with three lives. Missed long words cost two lives. WPM uses five correctly typed characters per word; accuracy counts correct versus failed submissions and misses.", sizes: [20, 30, 40], sizeLabel: "Target", lifeline: "Freeze words", controls: "Type in the input · Exact matches clear automatically · Enter submits · Click Pause to pause" },
  { id: "2048", title: "2048", kind: "puzzle", subtitle: "One slide closer", description: "Slide, combine, and make room. Build a 2048 tile on a warm, tactile number board.", icon: "2048", accent: "#edc37c", material: "numbers", instructions: "Slide all tiles in one direction. Equal neighbors merge once per move and score their combined value. A new 2 or 4 appears only after a valid move. Reach 2048; a board with no legal moves loses.", sizes: [3, 4, 5], sizeLabel: "Board", lifeline: "Remove lowest tile", controls: "Arrow keys or WASD slide · Click direction buttons · P pauses · R restarts" },
  { id: "cosmic-strike", title: "Cosmic Strike", kind: "arcade", subtitle: "Into the nebula", description: "Weaving fighters, armored ships, and phase-changing bosses. Dodge, boost, and clear a sector.", icon: "▲", accent: "#8fa8ff", material: "cosmic", instructions: "Clear the selected number of waves, then defeat the sector boss. Watch your hull and regenerating shield. Collect dropped power-ups and hold fire. A destroyed hull requires restarting this mission; the boss unlocks the next sector.", sizes: [3, 5, 7], sizeLabel: "Mission", lifeline: "Emergency shield", controls: "WASD / arrows move · Hold Space or left mouse to fire · Shift boosts · E charged special · P pauses · R restarts", },
];

export const categories = collection.categories;
export const games: GameInfo[] = [...nativeGames, ...collection.games.map(game => ({
  id: game.id, title: game.name + (["pacman", "memory", "2048"].includes(game.slug) ? " · Collection" : ""),
  kind: game.category, category: game.category, sourcePath: game.path, tags: game.tags,
  subtitle: "Games Hub collection", description: game.description, icon: collection.categories.find(c => c.id === game.category)?.emoji || "✳",
  accent: collection.categories.find(c => c.id === game.category)?.color || "#9bc7a7", material: "collection",
  instructions: game.instructions, sizes: [1], sizeLabel: "Game", lifeline: "", controls: "Use the mouse and the game’s on-screen keyboard instructions.",
}))];
