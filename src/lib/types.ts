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
  status: GameStatus | null;
  start_date: string | null;
  end_date: string | null;
  release_date: string | null;
  story_length_hours: number | null;
  completion_percentage: number | null;
  description: string | null;
  screenshots: string[] | null;
  platforms: string[] | null;
  video_url: string | null;
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

export const STATUS_COLOR_HEX: Record<GameStatus, string> = {
  playing: "#06b6d4",
  completed: "#22c55e",
  backlog: "#3b82f6",
  wishlist: "#a855f7",
  endless: "#ec4899",
  abandoned: "#525252",
};

export interface HomeCard {
  type: "status" | "custom_list";
  key: string;
  label: string;
  iconKey: string;
  color: string;
  count: number;
  href: string;
  isBuiltin: boolean;
}

export type SortMode =
  | "custom"
  | "alphabetical"
  | "alphabetical_desc"
  | "recently_completed"
  | "release_date"
  | "story_length";

export const SORT_LABELS: Record<SortMode, string> = {
  custom: "Manual",
  alphabetical: "Alfabético (A-Z)",
  alphabetical_desc: "Alfabético (Z-A)",
  recently_completed: "Completado más reciente",
  release_date: "Fecha de lanzamiento",
  story_length: "Horas jugadas",
};

export type ViewMode = "grid" | "compact" | "list";

export interface CustomList {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  position: number;
  is_builtin: boolean;
  created_at: string;
}


