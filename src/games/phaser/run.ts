export type ArcadeStats = {
  score: number; best: number; lives: number; remaining: number; total: number;
  powerSeconds: number; state: string;
  progress?: string; message?: string;
  canHelp?: boolean;
};
export type Run = {
  gameId: string; level: number; size: number; seed: number; difficulty?: number;
  onStats?: (stats: ArcadeStats) => void;
  onSolved?: (score?: number) => void;
  onRestart?: () => void;
};
