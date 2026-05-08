"use client";

import { useState } from "react";

export default function GlobalEmailInput() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!email.trim()) return;
    // Store in localStorage for demo purposes
    localStorage.setItem("globalNotifyEmail", email.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-xs font-medium text-zinc-600">全域通知 Email</label>
      <div className="flex gap-2">
        <input
          className="h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-red-600"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          className="h-8 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800"
          onClick={handleSave}
        >
          設定
        </button>
      </div>
      {saved && <p className="text-xs text-emerald-700">已儲存（本機）</p>}
      <p className="text-xs text-zinc-400">上線後將連結至 Email 通知服務</p>
    </div>
  );
}
