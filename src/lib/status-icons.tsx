import { Gift, ListTodo, Gamepad2, Trophy, Infinity, XCircle } from "lucide-react";
import type { GameStatus } from "@/lib/types";

export const STATUS_ICONS: Record<GameStatus, typeof Gift> = {
  wishlist: Gift,
  backlog: ListTodo,
  playing: Gamepad2,
  completed: Trophy,
  endless: Infinity,
  abandoned: XCircle,
};
