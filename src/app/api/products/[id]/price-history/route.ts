import { NextResponse } from "next/server";

import { getPriceHistory, getProductById } from "@/lib/data/mock-repository";
import { summarizePriceHistory } from "@/lib/services/price-analysis";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = getProductById(id);

  if (!product) {
    return NextResponse.json({ error: "PRODUCT_NOT_FOUND" }, { status: 404 });
  }

  const snapshots = getPriceHistory(id);

  return NextResponse.json({
    data: {
      product,
      snapshots,
      summary: summarizePriceHistory(snapshots),
    },
  });
}
