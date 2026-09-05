"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = new URL(publicUrl, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ url, title: document.title });
      } catch {
        // usuario cancelo el share sheet, no hacer nada
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300"
    >
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      {copied ? "¡Copiado!" : "Compartir"}
    </button>
  );
}
