export type DataSource = "MERCARI_SHOPS" | "MANUAL_IMPORT" | "EXTERNAL_PARTNER";

export type ProductStatus = "ON_SALE" | "SOLD_OUT" | "DELETED" | "UNKNOWN";

export type RiskLevel = "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH";

export type NotificationRuleType =
  | "TARGET_PRICE"
  | "PRICE_DROP_PERCENT"
  | "BACK_IN_STOCK"
  | "SELLER_RISK_HIGH";

export type SyncJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "DELAYED";

export interface Product {
  id: string;
  source: DataSource;
  externalProductId: string;
  sellerId: string | null;
  title: string;
  description: string | null;
  imageUrls: string[];
  currentPrice: number;
  currency: "JPY";
  status: ProductStatus;
  condition: string | null;
  sourceUrl: string | null;
  lastFetchedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceSnapshot {
  id: string;
  productId: string;
  externalProductId: string;
  price: number;
  currency: "JPY";
  status: ProductStatus;
  fetchedAt: string;
  rawHash: string;
  source: DataSource;
}

export interface SellerRiskProfile {
  id: string;
  source: DataSource;
  externalSellerId: string;
  displayName: string;
  ratingCount: number | null;
  positiveRate: number | null;
  accountAgeDays: number | null;
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  lastEvaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number | null;
  notifyEmail: string | null;
  tags: string[];
  isPaused: boolean;
  priority: "LOW" | "NORMAL" | "HIGH";
  nextSyncAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRule {
  id: string;
  userId: string;
  productId: string;
  type: NotificationRuleType;
  threshold: number | null;
  cooldownMinutes: number;
  isEnabled: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  source: DataSource;
  productId: string;
  status: SyncJobStatus;
  attemptCount: number;
  lastError: string | null;
  rateLimitRemaining: number | null;
  nextRunAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedProductPayload {
  source: DataSource;
  externalProductId: string;
  title: string;
  price: number;
  currency: "JPY";
  status: ProductStatus;
  imageUrls: string[];
  condition: string | null;
  sellerId: string | null;
  sourceUrl: string | null;
  rawHash: string;
  fetchedAt: string;
}

export interface RateLimitState {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  cost: number | null;
}
