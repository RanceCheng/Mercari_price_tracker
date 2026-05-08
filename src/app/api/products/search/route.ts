import { NextResponse } from "next/server";

import { createMercariAdapterFromEnv } from "@/lib/adapters/mercari-shops";
import { searchProducts } from "@/lib/data/mock-repository";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ data: [], message: "請輸入關鍵字" });
  }

  if (process.env.MERCARI_API_TOKEN?.trim()) {
    try {
      const adapter = createMercariAdapterFromEnv();
      const result = await adapter.fetchProducts({ keyword: q, first: 20 });

      const products: Product[] = result.products.map((p) => ({
        id: p.externalProductId,
        source: p.source,
        externalProductId: p.externalProductId,
        sellerId: p.sellerId,
        title: p.title,
        description: null,
        imageUrls: p.imageUrls,
        currentPrice: p.price,
        currency: p.currency,
        status: p.status,
        condition: p.condition,
        sourceUrl: p.sourceUrl ?? `https://jp.mercari.com/item/${p.externalProductId}`,
        lastFetchedAt: p.fetchedAt,
        createdAt: p.fetchedAt,
        updatedAt: p.fetchedAt,
      }));

      return NextResponse.json({ data: products, total: products.length, source: "live" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const fallback = searchProducts(q);
      return NextResponse.json({
        data: fallback,
        total: fallback.length,
        source: "mock",
        warning: `Mercari API 連線失敗，顯示模擬資料：${message}`,
      });
    }
  }

  const results = searchProducts(q);
  return NextResponse.json({ data: results, total: results.length, source: "mock" });
}
