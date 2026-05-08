"use client";

import { useState } from "react";

interface CheckResult {
  shouldNotify: boolean;
  sent: boolean;
  reason: string;
  message: string;
  currentPrice?: number;
  targetPrice?: number | null;
}

interface Props {
  trackedId: string;
  initialEmail: string | null;
  initialTargetPrice: number | null;
}

export default function TrackRowActions({ trackedId, initialEmail, initialTargetPrice }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [targetPrice, setTargetPrice] = useState(initialTargetPrice?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const patch: { notifyEmail?: string | null; targetPrice?: number | null } = {
      notifyEmail: email.trim() || null,
      targetPrice: targetPrice !== "" ? Number(targetPrice) : null,
    };
    const res = await fetch(`/api/tracked-products/${trackedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "已儲存" : "儲存失敗");
    setTimeout(() => setSaveMsg(null), 2500);
  }

  async function handleCheck() {
    setChecking(true);
    setCheckResult(null);
    const res = await fetch(`/api/tracked-products/${trackedId}/check`, { method: "POST" });
    const data = await res.json() as CheckResult;
    setCheckResult(data);
    setChecking(false);
  }

  const resultColor =
    checkResult === null
      ? ""
      : checkResult.sent
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : checkResult.reason === "price_not_reached"
          ? "text-sky-700 bg-sky-50 border-sky-200"
          : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        <button
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          onClick={() => { setOpen((v) => !v); setCheckResult(null); }}
        >
          {open ? "收起" : "設定通知"}
        </button>
        <button
          className="rounded-md border border-sky-300 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50 disabled:opacity-50"
          disabled={checking}
          onClick={handleCheck}
        >
          {checking ? "檢查中…" : "手動檢查"}
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs">
          <label className="grid gap-1">
            <span className="font-medium text-zinc-700">通知 Email</span>
            <input
              className="h-8 rounded border border-zinc-300 bg-white px-2 text-zinc-950 outline-none focus:border-red-600"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mt-2 grid gap-1">
            <span className="font-medium text-zinc-700">目標價 JPY</span>
            <input
              className="h-8 rounded border border-zinc-300 bg-white px-2 text-zinc-950 outline-none focus:border-red-600"
              min={0}
              placeholder="27000"
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </label>
          <button
            className="mt-2 h-7 rounded bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "儲存中…" : "儲存"}
          </button>
          {saveMsg && <span className="ml-2 text-emerald-700">{saveMsg}</span>}
        </div>
      )}

      {checkResult && (
        <div className={`mt-1 rounded-md border px-2 py-2 text-xs leading-snug ${resultColor}`}>
          {checkResult.message}
        </div>
      )}
    </div>
  );
}
