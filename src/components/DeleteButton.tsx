"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ trackedId }: { trackedId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setPending(true);
    await fetch(`/api/tracked-products/${trackedId}`, { method: "DELETE" });
    setPending(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          disabled={pending}
          onClick={handleDelete}
        >
          {pending ? "刪除中…" : "確認"}
        </button>
        <button
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          取消
        </button>
      </span>
    );
  }

  return (
    <button
      className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
      onClick={() => setConfirming(true)}
    >
      刪除
    </button>
  );
}
