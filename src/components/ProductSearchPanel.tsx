"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface SearchProduct {
  id: string;
  title: string;
  currentPrice: number;
  currency: string;
  status: string;
  condition: string;
  sourceUrl: string;
}

interface AddFormState {
  productId: string;
  targetPrice: string;
  notifyEmail: string;
}

const CONDITION_LABEL: Record<string, string> = {
  NEW: "全新",
  LIKE_NEW: "幾乎全新",
  GOOD: "良好",
  FAIR: "普通",
  POOR: "瑕疵",
  UNKNOWN: "不明",
};

const STATUS_COLOR: Record<string, string> = {
  ON_SALE: "bg-emerald-100 text-emerald-800",
  SOLD_OUT: "bg-zinc-100 text-zinc-500",
  DELISTED: "bg-red-100 text-red-700",
};

function formatJPY(value: number) {
  return `JPY ${new Intl.NumberFormat("ja-JP").format(value)}`;
}

export default function ProductSearchPanel({ trackedProductIds }: { trackedProductIds: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchProduct[] | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "mock" | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddFormState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setDataSource(null);
    setApiWarning(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setAddForm(null);
    const res = await fetch(`/api/products/search?q=${encodeURIComponent(query.trim())}`);
    const json = await res.json() as { data: SearchProduct[]; source?: "live" | "mock"; warning?: string };
    setResults(json.data ?? []);
    setDataSource(json.source ?? "mock");
    setApiWarning(json.warning ?? null);
    setLoading(false);
  }

  function openAddForm(product: SearchProduct) {
    setAddForm({ productId: product.id, targetPrice: "", notifyEmail: "" });
    setSuccessMsg(null);
    setErrorMsg(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm) return;
    setSubmitting(true);
    setErrorMsg(null);
    const res = await fetch("/api/tracked-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: addForm.productId,
        targetPrice: addForm.targetPrice !== "" ? Number(addForm.targetPrice) : null,
        notifyEmail: addForm.notifyEmail.trim() || null,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const product = results?.find((p) => p.id === addForm.productId);
      setSuccessMsg(`「${product?.title ?? addForm.productId}」已排入追蹤佇列`);
      setAddForm(null);
      router.refresh();
    } else {
      setErrorMsg("新增失敗，請稍後再試。");
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">新增監控</h2>
          <p className="text-sm text-zinc-600">搜尋商品名稱、ID 或貼上 URL，確認後排入同步佇列。</p>
        </div>
        <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">需確認 Mercari 資料權限</span>
      </div>

      <form className="flex gap-2 p-4" onSubmit={handleSearch}>
        <input
          ref={inputRef}
          className="h-10 flex-1 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-red-700"
          placeholder="Nintendo Switch / m12345678901 / https://jp.mercari.com/item/..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          disabled={loading || !query.trim()}
          type="submit"
        >
          {loading ? "搜尋中…" : "搜尋"}
        </button>
      </form>

      {successMsg && (
        <div className="mx-4 mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ✓ {successMsg}
        </div>
      )}

      {results !== null && (
        <div className="border-t border-zinc-100">
          {/* 資料來源標籤 */}
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-1">
            {dataSource === "live" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Mercari 即時資料
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                模擬資料（填入 MERCARI_API_TOKEN 可切換即時）
              </span>
            )}
            {apiWarning && (
              <span className="text-xs text-red-600">{apiWarning}</span>
            )}
          </div>
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">找不到符合的商品，請換個關鍵字試試。</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {results.map((product) => {
                const alreadyTracked = trackedProductIds.includes(product.id);
                const isExpanding = addForm?.productId === product.id;

                return (
                  <li key={product.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <a
                          className="truncate font-medium text-zinc-950 hover:text-red-700 hover:underline"
                          href={product.sourceUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {product.title}
                        </a>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                          <span className="font-semibold text-zinc-950">{formatJPY(product.currentPrice)}</span>
                          <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${STATUS_COLOR[product.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                            {product.status === "ON_SALE" ? "販售中" : product.status === "SOLD_OUT" ? "已售出" : product.status}
                          </span>
                          <span>{CONDITION_LABEL[product.condition] ?? product.condition}</span>
                        </div>
                      </div>

                      {alreadyTracked ? (
                        <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500">已追蹤</span>
                      ) : (
                        <button
                          className="shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          onClick={() => isExpanding ? setAddForm(null) : openAddForm(product)}
                        >
                          {isExpanding ? "收起" : "加入追蹤"}
                        </button>
                      )}
                    </div>

                    {isExpanding && (
                      <form
                        className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3"
                        onSubmit={handleAdd}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="grid gap-1 text-xs font-medium text-zinc-700">
                            目標價 JPY（選填）
                            <input
                              className="h-8 rounded border border-zinc-300 bg-white px-2 text-zinc-950 outline-none focus:border-red-600"
                              min={0}
                              placeholder="例：27000"
                              type="number"
                              value={addForm.targetPrice}
                              onChange={(e) => setAddForm((f) => f ? { ...f, targetPrice: e.target.value } : f)}
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-medium text-zinc-700">
                            通知 Email（選填）
                            <input
                              className="h-8 rounded border border-zinc-300 bg-white px-2 text-zinc-950 outline-none focus:border-red-600"
                              placeholder="you@example.com"
                              type="email"
                              value={addForm.notifyEmail}
                              onChange={(e) => setAddForm((f) => f ? { ...f, notifyEmail: e.target.value } : f)}
                            />
                          </label>
                        </div>
                        {errorMsg && <p className="mt-2 text-xs text-red-700">{errorMsg}</p>}
                        <div className="mt-3 flex gap-2">
                          <button
                            className="h-8 rounded bg-red-700 px-4 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
                            disabled={submitting}
                            type="submit"
                          >
                            {submitting ? "新增中…" : "確認排入同步"}
                          </button>
                          <button
                            className="h-8 rounded border border-zinc-300 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                            type="button"
                            onClick={() => setAddForm(null)}
                          >
                            取消
                          </button>
                        </div>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
