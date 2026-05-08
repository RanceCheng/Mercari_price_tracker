import type {
  NormalizedProductPayload,
  NotificationRule,
  PriceSnapshot,
  Product,
  SellerRiskProfile,
} from "@/lib/types";
import { evaluateNotificationRules } from "@/lib/services/notifications";

export interface PriceSyncRepository {
  findActiveProductsDueForSync(limit: number): Promise<Product[]>;
  findPreviousSnapshot(productId: string): Promise<PriceSnapshot | null>;
  findNotificationRules(productId: string): Promise<NotificationRule[]>;
  findSellerRiskProfile(sellerId: string | null): Promise<SellerRiskProfile | null>;
  upsertProductFromPayload(payload: NormalizedProductPayload): Promise<Product>;
  insertPriceSnapshot(product: Product, payload: NormalizedProductPayload): Promise<PriceSnapshot>;
  writeNotificationLog(input: { ruleId: string; productId: string; reason: string }): Promise<void>;
}

export interface PriceSyncAdapter {
  fetchProducts(options: { keyword?: string; first?: number }): Promise<{ products: NormalizedProductPayload[] }>;
}

export interface PriceSyncResult {
  scannedProducts: number;
  changedProducts: number;
  notificationsQueued: number;
}

export async function runPriceSyncOnce(
  repository: PriceSyncRepository,
  adapter: PriceSyncAdapter,
): Promise<PriceSyncResult> {
  const dueProducts = await repository.findActiveProductsDueForSync(100);
  let changedProducts = 0;
  let notificationsQueued = 0;

  for (const dueProduct of dueProducts) {
    const response = await adapter.fetchProducts({ keyword: dueProduct.externalProductId, first: 1 });
    const payload = response.products[0];

    if (!payload) {
      continue;
    }

    const previousSnapshot = await repository.findPreviousSnapshot(dueProduct.id);
    const product = await repository.upsertProductFromPayload(payload);

    if (shouldCreateSnapshot(previousSnapshot, payload)) {
      await repository.insertPriceSnapshot(product, payload);
      changedProducts += 1;
    }

    const rules = await repository.findNotificationRules(product.id);
    const sellerRiskProfile = await repository.findSellerRiskProfile(product.sellerId);
    const decisions = evaluateNotificationRules(rules, {
      product,
      previousSnapshot,
      sellerRiskProfile,
    });

    for (const decision of decisions.filter((item) => item.shouldSend)) {
      await repository.writeNotificationLog({
        ruleId: decision.ruleId,
        productId: product.id,
        reason: decision.reason,
      });
      notificationsQueued += 1;
    }
  }

  return {
    scannedProducts: dueProducts.length,
    changedProducts,
    notificationsQueued,
  };
}

function shouldCreateSnapshot(previousSnapshot: PriceSnapshot | null, payload: NormalizedProductPayload) {
  if (!previousSnapshot) {
    return true;
  }

  return previousSnapshot.price !== payload.price || previousSnapshot.status !== payload.status;
}
