"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400"
    >
      <ArrowLeft size={16} />
      Volver
    </button>
  );
}
