export type GameId = "pacman";

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
};

export const games: GameInfo[] = [
  { id: "pacman", title: "Pacman", subtitle: "The arcade chase", description: "Clear the maze, outsmart four ghosts, and turn the chase around with power pellets.", icon: "◕", accent: "#ffda73", material: "arcade", instructions: "Eat every dot to clear the maze. Power pellets let you catch ghosts; avoid them when the power runs out. You have three lives.", sizes: [19, 25, 31], sizeLabel: "Maze", lifeline: "Freeze ghosts", controls: "Arrow keys or WASD move · P / Space pauses · R restarts" },
];
