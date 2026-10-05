export type ArcadeStats = {
  score: number; best: number; lives: number; remaining: number; total: number;
  powerSeconds: number; state: string;
};
export type Run = {
  level: number; size: number; seed: number;
  onStats?: (stats: ArcadeStats) => void;
  onSolved?: (score?: number) => void;
  onRestart?: () => void;
};
