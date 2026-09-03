import { STATUS_ICONS } from "@/lib/status-icons";
import { getCustomListIcon } from "@/lib/custom-list-icons";
import type { GameStatus, HomeCard } from "@/lib/types";

export function getHomeCardIcon(card: HomeCard) {
  if (card.type === "status") {
    return STATUS_ICONS[card.key as GameStatus];
  }
  return getCustomListIcon(card.iconKey);
}
