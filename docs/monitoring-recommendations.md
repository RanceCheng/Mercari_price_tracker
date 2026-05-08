# Mercari 監控建議

這份建議依據 `mercari_price_tracker_project_plan.docx` 建立，重點是先把資料來源、價格歷史、通知與風險監控拆開，避免未來因 Mercari API 權限不同而重寫整個系統。

## 第一優先：合法資料來源監控

Mercari Shops API 文件顯示 GraphQL 主要回傳授權 Shop 的商品資料。若要追蹤公開 Mercari 市場任意商品，需要先確認可使用的官方授權、合作資料或其他合規資料來源。

需要監控：

- API 授權狀態：token 是否有效、是否即將過期、是否被撤銷。
- GraphQL endpoint health：production / sandbox 是否可連線。
- Rate limit headers：`X-Ratelimit-Limit`、`X-Ratelimit-Remaining`、`X-Ratelimit-Reset`、query cost。
- Adapter error rate：認證失敗、schema 變更、商品不存在、rate limit、server error。
- 資料來源覆蓋率：官方 API、手動匯入、外部合作資料各自支援哪些欄位。

## 商品與價格監控

每次同步不覆寫歷史價格，只更新 `products.currentPrice` 並新增 `price_snapshots`。

需要監控：

- 商品狀態：`ON_SALE`、`SOLD_OUT`、`DELETED`、`UNKNOWN`。
- 價格變動：目前價格、最低價、最高價、平均價、前次同步差異。
- 趨勢視窗：近 7 / 30 / 90 天漲跌。
- 異常價格：低於 30 日均價過多、短時間劇烈降價、價格回復。
- 資料新鮮度：`lastFetchedAt` 超過門檻時標記 stale。
- 快照完整性：同一商品每天至少一筆 checkpoint，價格或狀態變更立即建立快照。

## 通知監控

通知系統要先建立 log 再寄信，避免重試時重複寄送。

需要監控：

- 到價通知：`currentPrice <= targetPrice`。
- 降價百分比：相對上一筆價格或指定窗口均價。
- 恢復上架：`SOLD_OUT` / `DELETED` 變為 `ON_SALE`。
- 賣家風險升高：風險等級變為 `HIGH`。
- 冷卻時間：同一商品同一規則在 cooldown 內不重複寄送。
- Email 成功率：provider response、bounce、retry count、unsubscribe。

## 賣家風險監控

若官方 API 無法取得公開賣家評價，第一版應明確顯示 `UNKNOWN`，並用中性警示文字避免定罪。

需要監控：

- 可取得的賣家欄位：評價數、好評率、帳號年齡、交易紀錄。
- 缺資料訊號：沒有評價資料時標記 `UNKNOWN`，不要直接視為高風險。
- 商品異常：價格明顯低於歷史均價、短時間大量上架相似商品。
- 使用者回報：待審核、已確認、被駁回，並防止濫用。
- 管理員黑名單：人工確認後可直接標示 `HIGH`。
- 風險原因：所有加分原因需寫入 `seller_risk_events` 或 equivalent log。

## Worker 與排程監控

背景任務不應阻塞使用者請求。同步頻率應根據商品熱度、價格變動與 rate limit 動態調整。

需要監控：

- Queue depth：等待同步的商品數。
- Job status：`QUEUED`、`RUNNING`、`SUCCEEDED`、`FAILED`、`DELAYED`。
- Retry count：API 失敗與 Email 失敗分開統計。
- Backoff：遇到 rate limit 時依 reset header 延後。
- Worker success rate：最近 1 小時 / 24 小時成功率。
- Sync cost：每次 GraphQL query cost 與每小時總成本。

## 系統與安全監控

需要監控：

- Secret exposure：API token 不可進入前端 bundle、log 或 repository。
- AuthZ：使用者只能查自己的追蹤清單與通知規則。
- PII：email、通知偏好、寄送紀錄需限制存取。
- Observability：Sentry 錯誤、OpenTelemetry trace、structured logs。
- Database indexes：`productId`、`externalProductId`、`sellerId`、`fetchedAt`、`userId`。

## MVP 實作順序

1. 確認 Mercari 資料來源與使用條款。
2. 實作 `MercariShopsGraphQLAdapter` 與 rate limit 讀取。
3. 建立 MongoDB collections：`products`、`tracked_products`、`price_snapshots`、`notification_rules`。
4. 建立 Worker：抓取到期商品、寫入快照、更新商品狀態。
5. 建立通知 Evaluator：到價、降價、恢復上架、風險升高。
6. 加入賣家風險 `UNKNOWN / LOW / MEDIUM / HIGH` 與中性警示文案。
7. 加入 `/api/health`、同步任務監控與管理後台。
