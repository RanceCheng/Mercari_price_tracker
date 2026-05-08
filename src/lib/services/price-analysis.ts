import type { PriceSnapshot } from "@/lib/types";

export interface PriceSummary {
  currentPrice: number | null;
  lowestPrice: number | null;
  highestPrice: number | null;
  averagePrice: number | null;
  changeFromPrevious: number | null;
  trend7Days: "UP" | "DOWN" | "FLAT" | "UNKNOWN";
  lastFetchedAt: string | null;
}

export function summarizePriceHistory(snapshots: PriceSnapshot[]): PriceSummary {
  const sorted = [...snapshots].sort(
    (left, right) => new Date(left.fetchedAt).getTime() - new Date(right.fetchedAt).getTime(),
  );

  if (!sorted.length) {
    return {
      currentPrice: null,
      lowestPrice: null,
      highestPrice: null,
      averagePrice: null,
      changeFromPrevious: null,
      trend7Days: "UNKNOWN",
      lastFetchedAt: null,
    };
  }

  const prices = sorted.map((snapshot) => snapshot.price);
  const latest = sorted.at(-1) ?? null;
  const previous = sorted.at(-2) ?? null;

  return {
    currentPrice: latest?.price ?? null,
    lowestPrice: Math.min(...prices),
    highestPrice: Math.max(...prices),
    averagePrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    changeFromPrevious: latest && previous ? latest.price - previous.price : null,
    trend7Days: trendWithinDays(sorted, 7),
    lastFetchedAt: latest?.fetchedAt ?? null,
  };
}

function trendWithinDays(snapshots: PriceSnapshot[], days: number): PriceSummary["trend7Days"] {
  const floor = Date.now() - days * 24 * 60 * 60 * 1000;
  const windowed = snapshots.filter((snapshot) => new Date(snapshot.fetchedAt).getTime() >= floor);

  if (windowed.length < 2) {
    return "UNKNOWN";
  }

  const first = windowed[0].price;
  const last = windowed.at(-1)?.price ?? first;

  if (last > first) {
    return "UP";
  }

  if (last < first) {
    return "DOWN";
  }

  return "FLAT";
}
