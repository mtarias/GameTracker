export type GameStatus =
  | "backlog"
  | "wishlist"
  | "playing"
  | "completed"
  | "abandoned"
  | "endless";

export interface UserGame {
  id: string;
  user_id: string;
  igdb_id: number;
  title: string;
  cover_url: string | null;
  status: GameStatus;
  start_date: string | null;
  end_date: string | null;
  completion_percentage: number | null;
  custom_order: number;
  created_at: string;
}

export const STATUS_LABELS: Record<GameStatus, string> = {
  playing: "Jugando",
  completed: "Completados",
  backlog: "Backlog",
  wishlist: "Wishlist",
  abandoned: "Abandonados",
  endless: "Endless",
};

export const STATUS_ORDER: GameStatus[] = [
  "playing",
  "completed",
  "backlog",
  "wishlist",
  "endless",
  "abandoned",
];

export const STATUS_BORDER_COLOR: Record<GameStatus, string> = {
  playing: "border-cyan-500",
  completed: "border-green-500",
  backlog: "border-blue-500",
  wishlist: "border-purple-500",
  endless: "border-pink-500",
  abandoned: "border-neutral-600",
};

