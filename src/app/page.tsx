import DeleteButton from "@/components/DeleteButton";
import GlobalEmailInput from "@/components/GlobalEmailInput";
import ProductSearchPanel from "@/components/ProductSearchPanel";
import TrackRowActions from "@/components/TrackRowActions";
import { getDashboardMetrics, listTrackedProductRows } from "@/lib/data/mock-repository";
import type { PriceSnapshot, RiskLevel } from "@/lib/types";

const jpyNumberFormatter = new Intl.NumberFormat("ja-JP");
const zhTwDateTimeFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function Home() {
  const rows = listTrackedProductRows();
  const metrics = getDashboardMetrics(rows);
  const alerts = rows.filter(
    (row) =>
      row.sellerRiskProfile?.riskLevel === "HIGH" ||
      (row.product && row.targetPrice !== null && row.product.currentPrice <= row.targetPrice),
  );

  return (
    <main className="min-h-screen bg-[#f6f5f2] text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-medium text-red-700">Mercari_price_tracker</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
              價格歷史、到價通知與賣家風險監控
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50" href="/api/health">
              系統狀態
            </a>
            <button className="rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800">
              新增追蹤
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="追蹤中商品" value={metrics.activeTrackedProducts.toString()} tone="zinc" />
            <Metric label="一小時內同步" value={metrics.dueWithinHour.toString()} tone="sky" />
            <Metric label="高風險賣家" value={metrics.highRiskSellers.toString()} tone="red" />
            <Metric label="API 點數餘額" value={formatNumber(metrics.apiBudgetRemaining)} tone="emerald" />
          </div>

          <ProductSearchPanel trackedProductIds={rows.map((r) => r.productId)} />

          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold">追蹤清單</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="w-[24%] px-3 py-3 font-semibold">商品</th>
                    <th className="w-[11%] px-3 py-3 font-semibold">目前價格</th>
                    <th className="w-[9%] px-3 py-3 font-semibold">目標</th>
                    <th className="w-[12%] px-3 py-3 font-semibold">趨勢</th>
                    <th className="w-[9%] px-3 py-3 text-center font-semibold">類似商品</th>
                    <th className="w-[9%] px-3 py-3 text-center font-semibold">有貨賣家</th>
                    <th className="w-[9%] px-3 py-3 font-semibold">賣家風險</th>
                    <th className="w-[10%] px-3 py-3 font-semibold">下次同步</th>
                    <th className="w-[7%] px-3 py-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rows.map((row) => {
                    const product = row.product;

                    return (
                      <tr key={row.id} className="align-top">
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-950">{product?.title ?? "Unknown product"}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {row.tags.map((tag) => (
                              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-semibold">{formatCurrency(product?.currentPrice)}</td>
                        <td className="px-3 py-4 text-zinc-700">{formatCurrency(row.targetPrice)}</td>
                        <td className="px-3 py-4">
                          <PriceSparkline snapshots={row.priceSnapshots} />
                          <div className="mt-1 text-xs text-zinc-500">{row.priceSummary.trend7Days}</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span className="text-base font-semibold text-zinc-800">{row.similarProductCount}</span>
                          <div className="text-xs text-zinc-400">筆相似</div>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={
                              row.availableSellerCount > 0
                                ? "text-base font-semibold text-emerald-700"
                                : "text-base font-semibold text-zinc-400"
                            }
                          >
                            {row.availableSellerCount}
                          </span>
                          <div className="text-xs text-zinc-400">位賣家</div>
                        </td>
                        <td className="px-3 py-4">
                          <RiskBadge level={row.sellerRiskProfile?.riskLevel ?? "UNKNOWN"} />
                        </td>
                        <td className="px-3 py-4 text-zinc-700">{formatTime(row.nextSyncAt)}</td>
                        <td className="px-3 py-4">
                          <TrackRowActions
                            trackedId={row.id}
                            initialEmail={row.notifyEmail ?? null}
                            initialTargetPrice={row.targetPrice}
                          />
                          <div className="mt-2">
                            <DeleteButton trackedId={row.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-4">
              <h2 className="text-lg font-semibold">警示佇列</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {alerts.map((row) => (
                <div className="p-4" key={row.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-zinc-950">{row.product?.title}</p>
                    <RiskBadge level={row.sellerRiskProfile?.riskLevel ?? "LOW"} />
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {row.sellerRiskProfile?.riskLevel === "HIGH"
                      ? "疑似高風險賣家，通知內容需使用中性警示文案。"
                      : "目前價格已達使用者設定門檻，可建立通知紀錄。"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-semibold">同步健康度</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <HealthRow label="Worker 成功率" value={`${Math.round(metrics.workerSuccessRate * 1000) / 10}%`} />
              <HealthRow label="Rate limit 策略" value="Headers + backoff" />
              <HealthRow label="資料庫" value="MongoDB planned" />
              <HealthRow label="通知" value="Email queue planned" />
            </dl>
            <GlobalEmailInput />
          </section>

          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="text-base font-semibold text-emerald-900">API 點數餘額說明</h2>
            <p className="mt-2 text-xs leading-relaxed text-emerald-800">
              系統每次向 Mercari Shops GraphQL API 抓取商品資料時，會消耗一定的呼叫配額（點數）。
              餘額數字代表當前週期內仍可使用的請求次數。
            </p>
            <ul className="mt-3 space-y-2 text-xs text-emerald-800">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">▸</span>
                <span><span className="font-semibold">每次同步</span>：單一商品抓取消耗 1 點，批次同步依商品數量累計扣除。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">▸</span>
                <span><span className="font-semibold">重置週期</span>：配額依 Mercari API 規範定期重置（每日或每小時），重置後自動恢復至上限。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">▸</span>
                <span><span className="font-semibold">Rate limit 保護</span>：餘額不足時系統自動啟用退避策略（Exponential Backoff），暫停同步以防封鎖。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">▸</span>
                <span><span className="font-semibold">優先權排程</span>：HIGH 優先級商品優先消耗點數，LOW 優先級商品在餘額充足時才排入佇列。</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">▸</span>
                <span><span className="font-semibold">目前狀態</span>：顯示值為模擬數據，正式上線後將從 API 回應的 Rate-Limit-Remaining Header 即時更新。</span>
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-lg font-semibold">MVP 優先順序</h2>
            <ol className="mt-4 space-y-3 text-sm text-zinc-700">
              <li>1. 官方 API Adapter 與合法資料來源確認</li>
              <li>2. 商品追蹤、價格快照、價格歷史查詢</li>
              <li>3. 到價通知去重與 Email provider</li>
              <li>4. UNKNOWN / LOW / MEDIUM / HIGH 風險提示</li>
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "zinc" | "sky" | "red" | "emerald" }) {
  const tones = {
    zinc: "border-zinc-200 bg-white text-zinc-950",
    sky: "border-sky-200 bg-sky-50 text-sky-950",
    red: "border-red-200 bg-red-50 text-red-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
  };

  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="text-sm font-medium opacity-70">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-normal">{value}</div>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const classes = {
    UNKNOWN: "bg-zinc-100 text-zinc-700",
    LOW: "bg-emerald-100 text-emerald-800",
    MEDIUM: "bg-amber-100 text-amber-800",
    HIGH: "bg-red-100 text-red-800",
  };

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${classes[level]}`}>{level}</span>;
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-zinc-600">{label}</dt>
      <dd className="font-medium text-zinc-950">{value}</dd>
    </div>
  );
}

function PriceSparkline({ snapshots }: { snapshots: PriceSnapshot[] }) {
  if (snapshots.length < 2) {
    return <div className="h-10 w-28 rounded-md bg-zinc-100" />;
  }

  const prices = snapshots.map((snapshot) => snapshot.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(1, max - min);
  const points = snapshots
    .map((snapshot, index) => {
      const x = (index / Math.max(1, snapshots.length - 1)) * 112;
      const y = 36 - ((snapshot.price - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="h-10 w-28" viewBox="0 0 112 40" role="img" aria-label="price trend">
      <polyline fill="none" points={points} stroke="#b91c1c" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "--";
  }

  return `JPY ${formatNumber(value)}`;
}

function formatNumber(value: number) {
  return jpyNumberFormatter.format(value);
}

function formatTime(value: string) {
  return zhTwDateTimeFormatter.format(new Date(value));
}
