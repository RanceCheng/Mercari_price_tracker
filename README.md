# Mercari_price_tracker

Mercari 商品歷史價格追蹤、到價 Email 通知、賣家風險警示的 Next.js 全端應用程式。

## 功能一覽

### 儀表板

- 總覽指標卡：追蹤中商品數、一小時內待同步、高風險賣家數、API 點數餘額
- 警示佇列：到價商品與高風險賣家即時警示
- 同步健康度：Worker 成功率、Rate limit 策略說明

### 追蹤清單

| 欄位 | 說明 |
|------|------|
| 商品 | 商品名稱與標籤 |
| 目前價格 | 最新抓取價格（JPY） |
| 目標 | 使用者設定的到價門檻 |
| 趨勢 | 7 日 sparkline 折線圖 + 文字趨勢描述 |
| 類似商品 | 標題關鍵字相符的其他商品筆數 |
| 有貨賣家 | 類似商品中目前 ON_SALE 的不重複賣家數 |
| 賣家風險 | UNKNOWN / LOW / MEDIUM / HIGH 徽章 |
| 下次同步 | 排程下次抓取時間 |
| 操作 | 設定通知 Email、目標價、手動檢查、刪除 |

- 表格欄位按比例隨視窗縮放，不會產生水平卷軸

### 商品搜尋與新增追蹤

- 依關鍵字、商品 ID 或 URL 搜尋
- 搜尋結果顯示**資料來源標籤**：
  - 🟢 **Mercari 即時資料** — 填入有效 `MERCARI_API_TOKEN` 時啟用
  - 🟡 **模擬資料** — 未填 Token 時自動 fallback
- 搜尋結果顯示售出狀態、品相、價格
- 直接從搜尋結果設定目標價與通知 Email 並加入追蹤

### 到價 Email 通知

支援兩種寄信方式，依 `.env.local` 設定自動切換：

| 方式 | 環境變數 | 說明 |
|------|---------|------|
| **Resend API**（推薦） | `RESEND_API_KEY` | 透過 HTTPS 443 送出，不受防火牆/防毒 SMTP 封鎖影響 |
| SMTP | `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | 支援 Gmail（Port 465）、Outlook、自架 SMTP |

- 到價通知信含商品名、目前價格、目標價、商品連結
- 手動觸發「檢查」時若有 API Token 會先重新抓取最新價格再比對

### 賣家風險評估

- 評分維度：評價數量、好評率、帳號年齡、價格偏離 30 日均值
- 等級：`LOW` / `MEDIUM` / `HIGH` / `UNKNOWN`
- 高風險賣家自動進入警示佇列

---

## 重要限制

> ⚠️ **Mercari Shops API 需要日本帳號才能申請**
>
> `MERCARI_API_ENDPOINT`（`api.mercari-shops.com`）是 **Mercari Shops 賣家後台 API**，需符合以下條件：
> - 在 [Mercari Shops](https://shops.mercari.com/)（日本服務）開立賣家帳號
> - 申請時需提供日本境內的個人或法人資料
> - 取得 API 存取金鑰後填入 `.env.local`
>
> 沒有 Token 時，系統自動以模擬資料運作，所有功能均可正常使用與測試。

---

## 快速開始

```bash
npm install
npm run dev
```

開發伺服器只監聽本機 `127.0.0.1:3000`，請手動開啟 [http://127.0.0.1:3000](http://127.0.0.1:3000)。

```bash
npm run lint        # ESLint 檢查
npm run typecheck   # TypeScript 型別檢查
npm run build       # 生產環境建置
```

---

## 環境變數

複製 `.env.example` 為 `.env.local` 後填入所需值，**不要把 secret 提交到 Git**。

```env
# ── Mercari API（需日本 Mercari Shops 賣家帳號）──────────────────
MERCARI_API_ENDPOINT=https://api.mercari-shops.com/v1/graphql
MERCARI_API_TOKEN=          # 空白 → 自動 fallback 模擬資料
MERCARI_USER_AGENT=mercari-price-monitor/0.1.0

# ── Email 通知（Resend 推薦，免費：https://resend.com）──────────
RESEND_API_KEY=             # 設定後優先使用 Resend HTTPS 寄信
RESEND_FROM=                # 留空使用 onboarding@resend.dev（限寄給驗證信箱）

# ── Email 通知（SMTP 備援）────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=yourname@gmail.com
SMTP_PASS=                  # Gmail 建議使用「應用程式密碼」
SMTP_FROM=yourname@gmail.com
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/api/tracked-products` | 取得追蹤清單 |
| `POST` | `/api/tracked-products` | 新增追蹤商品 |
| `PATCH` | `/api/tracked-products/:id` | 更新目標價 / Email |
| `DELETE` | `/api/tracked-products/:id` | 刪除追蹤 |
| `POST` | `/api/tracked-products/:id/check` | 手動觸發價格檢查與通知 |
| `GET` | `/api/products/search?q=` | 搜尋商品（有 Token 走即時 API） |
| `GET` | `/api/products/:id/price-history` | 取得價格歷史 |
| `POST` | `/api/admin/sync-jobs/run` | 手動觸發批次同步 |
| `GET` | `/api/health` | 系統健康檢查 |

---

## 技術架構

- **框架**：Next.js 16（App Router + Webpack 模式）
- **語言**：TypeScript 5
- **樣式**：Tailwind CSS 4
- **Email**：Resend API / nodemailer（SMTP）
- **資料層**：目前為 in-memory mock，預留 MongoDB + Redis 替換點
- **Worker**：`src/workers/price-sync.ts`（批次同步骨架）

## 監控建議

完整建議在 `docs/monitoring-recommendations.md`，涵蓋資料來源、價格快照、通知、賣家風險、Worker、rate limit 與安全監控。
