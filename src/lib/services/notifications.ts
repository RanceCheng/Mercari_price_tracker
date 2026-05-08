import type { NotificationRule, PriceSnapshot, Product, SellerRiskProfile } from "@/lib/types";

export interface NotificationEvaluationContext {
  product: Product;
  previousSnapshot: PriceSnapshot | null;
  sellerRiskProfile: SellerRiskProfile | null;
  now?: Date;
}

export interface NotificationDecision {
  ruleId: string;
  shouldSend: boolean;
  reason: string;
}

export function evaluateNotificationRule(
  rule: NotificationRule,
  context: NotificationEvaluationContext,
): NotificationDecision {
  if (!rule.isEnabled) {
    return blocked(rule, "RULE_DISABLED");
  }

  if (isInCooldown(rule, context.now ?? new Date())) {
    return blocked(rule, "COOLDOWN_ACTIVE");
  }

  switch (rule.type) {
    case "TARGET_PRICE":
      return rule.threshold !== null && context.product.currentPrice <= rule.threshold
        ? allowed(rule, "TARGET_PRICE_REACHED")
        : blocked(rule, "TARGET_PRICE_NOT_REACHED");
    case "PRICE_DROP_PERCENT":
      return hasPriceDropPercent(rule, context)
        ? allowed(rule, "PRICE_DROP_PERCENT_REACHED")
        : blocked(rule, "PRICE_DROP_PERCENT_NOT_REACHED");
    case "BACK_IN_STOCK":
      return context.previousSnapshot?.status !== "ON_SALE" && context.product.status === "ON_SALE"
        ? allowed(rule, "BACK_IN_STOCK")
        : blocked(rule, "NOT_BACK_IN_STOCK");
    case "SELLER_RISK_HIGH":
      return context.sellerRiskProfile?.riskLevel === "HIGH"
        ? allowed(rule, "SELLER_RISK_HIGH")
        : blocked(rule, "SELLER_RISK_NOT_HIGH");
  }
}

export function evaluateNotificationRules(
  rules: NotificationRule[],
  context: NotificationEvaluationContext,
) {
  return rules.map((rule) => evaluateNotificationRule(rule, context));
}

function hasPriceDropPercent(rule: NotificationRule, context: NotificationEvaluationContext) {
  if (!rule.threshold || !context.previousSnapshot) {
    return false;
  }

  const previousPrice = context.previousSnapshot.price;
  if (previousPrice <= 0 || context.product.currentPrice >= previousPrice) {
    return false;
  }

  const dropPercent = (previousPrice - context.product.currentPrice) / previousPrice;
  return dropPercent >= rule.threshold;
}

function isInCooldown(rule: NotificationRule, now: Date) {
  if (!rule.lastTriggeredAt) {
    return false;
  }

  const lastTriggeredAt = new Date(rule.lastTriggeredAt).getTime();
  const cooldownMs = rule.cooldownMinutes * 60 * 1000;
  return now.getTime() - lastTriggeredAt < cooldownMs;
}

function allowed(rule: NotificationRule, reason: string): NotificationDecision {
  return { ruleId: rule.id, shouldSend: true, reason };
}

function blocked(rule: NotificationRule, reason: string): NotificationDecision {
  return { ruleId: rule.id, shouldSend: false, reason };
}
