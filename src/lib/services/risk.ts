import type { PriceSnapshot, RiskLevel, SellerRiskProfile } from "@/lib/types";

export interface RiskSignals {
  ratingCount: number | null;
  positiveRate: number | null;
  accountAgeDays: number | null;
  currentPrice: number;
  averagePrice30Days: number | null;
  similarListingsIn24Hours: number | null;
  pendingUserReports: number;
  confirmedUserReports: number;
  isAdminBlocked: boolean;
}

export interface RiskEvaluation {
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
}

export function evaluateSellerRisk(signals: RiskSignals): RiskEvaluation {
  if (!hasUsableRiskData(signals)) {
    return {
      riskScore: 0,
      riskLevel: "UNKNOWN",
      riskReasons: ["NO_USABLE_SELLER_RISK_DATA"],
    };
  }

  if (signals.isAdminBlocked) {
    return {
      riskScore: 100,
      riskLevel: "HIGH",
      riskReasons: ["ADMIN_BLOCKLISTED_SELLER"],
    };
  }

  const reasons: string[] = [];
  let score = 0;

  if (signals.ratingCount !== null && signals.ratingCount < 5) {
    score += 15;
    reasons.push("LOW_RATING_COUNT");
  }

  if (signals.positiveRate !== null && signals.positiveRate < 0.9) {
    score += signals.positiveRate < 0.75 ? 40 : 25;
    reasons.push("LOW_POSITIVE_RATE");
  }

  if (signals.accountAgeDays !== null && signals.accountAgeDays < 30) {
    score += 15;
    reasons.push("NEW_SELLER_ACCOUNT");
  }

  if (signals.averagePrice30Days && signals.currentPrice < signals.averagePrice30Days * 0.6) {
    score += 20;
    reasons.push("PRICE_FAR_BELOW_30_DAY_AVERAGE");
  }

  if (signals.similarListingsIn24Hours !== null && signals.similarListingsIn24Hours > 20) {
    score += 20;
    reasons.push("BURST_SIMILAR_LISTINGS");
  }

  if (signals.pendingUserReports > 0) {
    score += Math.min(20, signals.pendingUserReports * 5);
    reasons.push("USER_REPORT_PENDING");
  }

  if (signals.confirmedUserReports > 0) {
    score += Math.min(60, signals.confirmedUserReports * 30);
    reasons.push("USER_REPORT_CONFIRMED");
  }

  const riskScore = Math.min(100, score);

  return {
    riskScore,
    riskLevel: scoreToRiskLevel(riskScore),
    riskReasons: reasons.length ? reasons : ["NO_RISK_SIGNAL_TRIGGERED"],
  };
}

export function buildSellerRiskProfile(
  sellerId: string,
  displayName: string,
  signals: RiskSignals,
): SellerRiskProfile {
  const evaluation = evaluateSellerRisk(signals);
  const now = new Date().toISOString();

  return {
    id: `seller_${sellerId}`,
    source: "MERCARI_SHOPS",
    externalSellerId: sellerId,
    displayName,
    ratingCount: signals.ratingCount,
    positiveRate: signals.positiveRate,
    accountAgeDays: signals.accountAgeDays,
    riskScore: evaluation.riskScore,
    riskLevel: evaluation.riskLevel,
    riskReasons: evaluation.riskReasons,
    lastEvaluatedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

export function averagePriceWithinDays(snapshots: PriceSnapshot[], days: number): number | null {
  const floor = Date.now() - days * 24 * 60 * 60 * 1000;
  const prices = snapshots
    .filter((snapshot) => new Date(snapshot.fetchedAt).getTime() >= floor)
    .map((snapshot) => snapshot.price);

  if (!prices.length) {
    return null;
  }

  return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
}

function hasUsableRiskData(signals: RiskSignals) {
  return Boolean(
    signals.isAdminBlocked ||
      signals.ratingCount !== null ||
      signals.positiveRate !== null ||
      signals.accountAgeDays !== null ||
      signals.averagePrice30Days !== null ||
      signals.similarListingsIn24Hours !== null ||
      signals.pendingUserReports ||
      signals.confirmedUserReports,
  );
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 40) {
    return "MEDIUM";
  }

  return "LOW";
}
