import type {
  NotificationRule,
  PriceSnapshot,
  Product,
  SellerRiskProfile,
  TrackedProduct,
} from "@/lib/types";
import { summarizePriceHistory, type PriceSummary } from "@/lib/services/price-analysis";

export interface TrackedProductRow extends TrackedProduct {
  product: Product | undefined;
  sellerRiskProfile: SellerRiskProfile | null;
  priceSnapshots: PriceSnapshot[];
  priceSummary: PriceSummary;
  notificationRules: NotificationRule[];
  /** 標題關鍵字相符的類似商品數（不含自身） */
  similarProductCount: number;
  /** 類似商品中目前 ON_SALE 的不重複賣家數 */
  availableSellerCount: number;
}

const now = "2026-05-08T09:00:00.000Z";

export const mockProducts: Product[] = [
  {
    id: "prod_001",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678901",
    sellerId: "seller_001",
    title: "Nintendo Switch OLED Console",
    description: "Tracked through Mercari adapter placeholder.",
    imageUrls: [],
    currentPrice: 28500,
    currency: "JPY",
    status: "ON_SALE",
    condition: "GOOD",
    sourceUrl: "https://jp.mercari.com/item/m12345678901",
    lastFetchedAt: now,
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "prod_002",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678902",
    sellerId: "seller_002",
    title: "Sony WH-1000XM5 Headphones",
    description: "Price dropped sharply against 30 day average.",
    imageUrls: [],
    currentPrice: 19800,
    currency: "JPY",
    status: "ON_SALE",
    condition: "LIKE_NEW",
    sourceUrl: "https://jp.mercari.com/item/m12345678902",
    lastFetchedAt: now,
    createdAt: "2026-05-02T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "prod_003",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678903",
    sellerId: null,
    title: "Pokemon Card Booster Box",
    description: "Seller rating unavailable in current data source.",
    imageUrls: [],
    currentPrice: 12400,
    currency: "JPY",
    status: "SOLD_OUT",
    condition: "UNKNOWN",
    sourceUrl: "https://jp.mercari.com/item/m12345678903",
    lastFetchedAt: now,
    createdAt: "2026-05-03T09:00:00.000Z",
    updatedAt: now,
  },
  // Extra search-only products (not yet tracked)
  {
    id: "prod_004",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678904",
    sellerId: "seller_001",
    title: "Nintendo Switch Joy-Con (L)/(R) Neon Blue/Red",
    description: "純正 Joy-Con セット，ほぼ未使用。",
    imageUrls: [],
    currentPrice: 6800,
    currency: "JPY",
    status: "ON_SALE",
    condition: "LIKE_NEW",
    sourceUrl: "https://jp.mercari.com/item/m12345678904",
    lastFetchedAt: now,
    createdAt: "2026-05-05T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "prod_005",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678905",
    sellerId: "seller_002",
    title: "Sony WF-1000XM5 True Wireless Earbuds",
    description: "最新フラッグシップ TWS、ノイキャン最高峰。",
    imageUrls: [],
    currentPrice: 24500,
    currency: "JPY",
    status: "ON_SALE",
    condition: "GOOD",
    sourceUrl: "https://jp.mercari.com/item/m12345678905",
    lastFetchedAt: now,
    createdAt: "2026-05-06T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "prod_006",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678906",
    sellerId: null,
    title: "Pokemon Scarlet Violet Booster Pack x10",
    description: "朱・紫 パック10個セット、未開封。",
    imageUrls: [],
    currentPrice: 4200,
    currency: "JPY",
    status: "ON_SALE",
    condition: "NEW",
    sourceUrl: "https://jp.mercari.com/item/m12345678906",
    lastFetchedAt: now,
    createdAt: "2026-05-07T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "prod_007",
    source: "MERCARI_SHOPS",
    externalProductId: "m12345678907",
    sellerId: "seller_001",
    title: "Apple AirPods Pro 2nd Generation",
    description: "ANC 強化版，MagSafe 充電ケース付き。",
    imageUrls: [],
    currentPrice: 18900,
    currency: "JPY",
    status: "ON_SALE",
    condition: "GOOD",
    sourceUrl: "https://jp.mercari.com/item/m12345678907",
    lastFetchedAt: now,
    createdAt: "2026-05-07T10:00:00.000Z",
    updatedAt: now,
  },
];

const _seedTrackedProducts: TrackedProduct[] = [
  {
    id: "track_001",
    userId: "user_demo",
    productId: "prod_001",
    targetPrice: 27000,
    notifyEmail: null,
    tags: ["console", "gift"],
    isPaused: false,
    priority: "HIGH",
    nextSyncAt: "2026-05-08T09:15:00.000Z",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "track_002",
    userId: "user_demo",
    productId: "prod_002",
    targetPrice: 21000,
    notifyEmail: null,
    tags: ["audio"],
    isPaused: false,
    priority: "NORMAL",
    nextSyncAt: "2026-05-08T09:30:00.000Z",
    createdAt: "2026-05-02T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "track_003",
    userId: "user_demo",
    productId: "prod_003",
    targetPrice: 11000,
    notifyEmail: null,
    tags: ["cards"],
    isPaused: false,
    priority: "LOW",
    nextSyncAt: "2026-05-08T10:00:00.000Z",
    createdAt: "2026-05-03T09:00:00.000Z",
    updatedAt: now,
  },
];

declare global {
  var __mockTrackedProducts: TrackedProduct[] | undefined;
}

function getTrackedProducts(): TrackedProduct[] {
  globalThis.__mockTrackedProducts ??= [..._seedTrackedProducts];
  return globalThis.__mockTrackedProducts;
}

/** @deprecated use getTrackedProducts() internally */
export const mockTrackedProducts = getTrackedProducts();

export const mockPriceSnapshots: PriceSnapshot[] = [
  snapshot("snap_001", "prod_001", "m12345678901", 31800, "ON_SALE", "2026-05-01T09:00:00.000Z"),
  snapshot("snap_002", "prod_001", "m12345678901", 30200, "ON_SALE", "2026-05-04T09:00:00.000Z"),
  snapshot("snap_003", "prod_001", "m12345678901", 28500, "ON_SALE", "2026-05-08T09:00:00.000Z"),
  snapshot("snap_004", "prod_002", "m12345678902", 35800, "ON_SALE", "2026-05-02T09:00:00.000Z"),
  snapshot("snap_005", "prod_002", "m12345678902", 33600, "ON_SALE", "2026-05-05T09:00:00.000Z"),
  snapshot("snap_006", "prod_002", "m12345678902", 19800, "ON_SALE", "2026-05-08T09:00:00.000Z"),
  snapshot("snap_007", "prod_003", "m12345678903", 14800, "ON_SALE", "2026-05-03T09:00:00.000Z"),
  snapshot("snap_008", "prod_003", "m12345678903", 12400, "SOLD_OUT", "2026-05-08T09:00:00.000Z"),
];

export const mockSellerProfiles: SellerRiskProfile[] = [
  {
    id: "seller_001",
    source: "MERCARI_SHOPS",
    externalSellerId: "shop_001",
    displayName: "Tokyo Gadget Supply",
    ratingCount: 128,
    positiveRate: 0.98,
    accountAgeDays: 740,
    riskScore: 8,
    riskLevel: "LOW",
    riskReasons: ["NO_RISK_SIGNAL_TRIGGERED"],
    lastEvaluatedAt: now,
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "seller_002",
    source: "MERCARI_SHOPS",
    externalSellerId: "shop_002",
    displayName: "New Audio Deals",
    ratingCount: 2,
    positiveRate: 0.76,
    accountAgeDays: 12,
    riskScore: 72,
    riskLevel: "HIGH",
    riskReasons: ["LOW_RATING_COUNT", "LOW_POSITIVE_RATE", "NEW_SELLER_ACCOUNT", "PRICE_FAR_BELOW_30_DAY_AVERAGE"],
    lastEvaluatedAt: now,
    createdAt: "2026-05-02T09:00:00.000Z",
    updatedAt: now,
  },
];

export const mockNotificationRules: NotificationRule[] = [
  rule("rule_001", "prod_001", "TARGET_PRICE", 27000, null),
  rule("rule_002", "prod_002", "TARGET_PRICE", 21000, null),
  rule("rule_003", "prod_002", "SELLER_RISK_HIGH", null, null),
  rule("rule_004", "prod_003", "BACK_IN_STOCK", null, "2026-05-07T09:00:00.000Z"),
];

const productsById = new Map(mockProducts.map((product) => [product.id, product]));
const sellerProfilesById = new Map(mockSellerProfiles.map((profile) => [profile.id, profile]));
const priceSnapshotsByProductId = groupByProductId(mockPriceSnapshots);
const notificationRulesByProductId = groupByProductId(mockNotificationRules);
const emptyPriceSnapshots: PriceSnapshot[] = [];
const emptyNotificationRules: NotificationRule[] = [];

export function deleteTrackedProduct(id: string): boolean {
  const list = getTrackedProducts();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return false;
  list.splice(index, 1);
  return true;
}

export function getTrackedProductById(id: string) {
  return getTrackedProducts().find((item) => item.id === id) ?? null;
}

export function updateTrackedProduct(id: string, patch: { targetPrice?: number | null; notifyEmail?: string | null }): boolean {
  const item = getTrackedProducts().find((tp) => tp.id === id);
  if (!item) return false;
  if (patch.targetPrice !== undefined) item.targetPrice = patch.targetPrice;
  if (patch.notifyEmail !== undefined) item.notifyEmail = patch.notifyEmail;
  item.updatedAt = new Date().toISOString();
  return true;
}

function extractTitleKeywords(title: string): string[] {
  return title.toLowerCase().split(/\s+/).filter((word) => word.length >= 4);
}

function computeSimilarCounts(product: Product): { similarProductCount: number; availableSellerCount: number } {
  const keywords = extractTitleKeywords(product.title);
  const similar = mockProducts.filter(
    (p) => p.id !== product.id && extractTitleKeywords(p.title).some((kw) => keywords.includes(kw)),
  );
  const sellerSet = new Set(
    similar.filter((p) => p.status === "ON_SALE" && p.sellerId !== null).map((p) => p.sellerId!),
  );
  return { similarProductCount: similar.length, availableSellerCount: sellerSet.size };
}

export function listTrackedProductRows(): TrackedProductRow[] {
  return getTrackedProducts().map((trackedProduct) => {
    const product = productsById.get(trackedProduct.productId);
    const sellerRiskProfile = product?.sellerId ? sellerProfilesById.get(product.sellerId) ?? null : null;
    const priceSnapshots = priceSnapshotsByProductId.get(trackedProduct.productId) ?? emptyPriceSnapshots;
    const notificationRules = notificationRulesByProductId.get(trackedProduct.productId) ?? emptyNotificationRules;
    const { similarProductCount, availableSellerCount } = product
      ? computeSimilarCounts(product)
      : { similarProductCount: 0, availableSellerCount: 0 };

    return {
      ...trackedProduct,
      product,
      sellerRiskProfile,
      priceSnapshots,
      priceSummary: summarizePriceHistory(priceSnapshots),
      notificationRules,
      similarProductCount,
      availableSellerCount,
    };
  });
}

export function getProductById(id: string) {
  return productsById.get(id) ?? null;
}

export function getPriceHistory(productId: string) {
  return priceSnapshotsByProductId.get(productId) ?? emptyPriceSnapshots;
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mockProducts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.externalProductId.toLowerCase().includes(q) ||
      Boolean(p.sourceUrl?.toLowerCase().includes(q)),
  );
}

export function addTrackedProduct(productId: string, targetPrice: number | null, notifyEmail: string | null): TrackedProduct {
  const id = `track_${Date.now()}`;
  const newItem: TrackedProduct = {
    id,
    userId: "user_demo",
    productId,
    targetPrice,
    notifyEmail,
    tags: [],
    isPaused: false,
    priority: "NORMAL",
    nextSyncAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  getTrackedProducts().push(newItem);
  return newItem;
}

export function getDashboardMetrics(rows: TrackedProductRow[] = listTrackedProductRows()) {
  const dueBefore = Date.now() + 60 * 60 * 1000;
  let activeTrackedProducts = 0;
  let dueWithinHour = 0;
  let highRiskSellers = 0;
  let targetPriceReached = 0;

  for (const row of rows) {
    if (!row.isPaused) activeTrackedProducts += 1;
    if (new Date(row.nextSyncAt).getTime() <= dueBefore) dueWithinHour += 1;
    if (row.sellerRiskProfile?.riskLevel === "HIGH") highRiskSellers += 1;
    if (row.product && row.targetPrice !== null && row.product.currentPrice <= row.targetPrice) {
      targetPriceReached += 1;
    }
  }

  return {
    activeTrackedProducts,
    dueWithinHour,
    highRiskSellers,
    targetPriceReached,
    apiBudgetRemaining: 8400,
    workerSuccessRate: 0.982,
  };
}

function groupByProductId<T extends { productId: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const list = grouped.get(item.productId);
    if (list) {
      list.push(item);
    } else {
      grouped.set(item.productId, [item]);
    }
  }
  return grouped;
}

function snapshot(
  id: string,
  productId: string,
  externalProductId: string,
  price: number,
  status: PriceSnapshot["status"],
  fetchedAt: string,
): PriceSnapshot {
  return {
    id,
    productId,
    externalProductId,
    price,
    currency: "JPY",
    status,
    fetchedAt,
    rawHash: id,
    source: "MERCARI_SHOPS",
  };
}

function rule(
  id: string,
  productId: string,
  type: NotificationRule["type"],
  threshold: number | null,
  lastTriggeredAt: string | null,
): NotificationRule {
  return {
    id,
    userId: "user_demo",
    productId,
    type,
    threshold,
    cooldownMinutes: 360,
    isEnabled: true,
    lastTriggeredAt,
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: now,
  };
}
