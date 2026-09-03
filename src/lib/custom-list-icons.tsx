import {
  Star,
  Heart,
  Trophy,
  Zap,
  Gamepad2,
  List,
  Tag,
  Flag,
  Gem,
  Target,
  Repeat,
  Bookmark,
} from "lucide-react";

export const CUSTOM_LIST_ICONS = {
  star: Star,
  heart: Heart,
  trophy: Trophy,
  zap: Zap,
  gamepad2: Gamepad2,
  list: List,
  tag: Tag,
  flag: Flag,
  gem: Gem,
  target: Target,
  repeat: Repeat,
  bookmark: Bookmark,
} as const;

export type CustomListIconKey = keyof typeof CUSTOM_LIST_ICONS;

export const CUSTOM_LIST_ICON_KEYS = Object.keys(CUSTOM_LIST_ICONS) as CustomListIconKey[];

export function getCustomListIcon(key: string) {
  return CUSTOM_LIST_ICONS[key as CustomListIconKey] ?? List;
}

export const CUSTOM_LIST_COLORS = [
  "#eab308", // amarillo (favoritos)
  "#ef4444",
  "#f97316",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#a3a3a3",
];
