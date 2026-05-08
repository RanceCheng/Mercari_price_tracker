import { NextResponse } from "next/server";

import { createMercariAdapterFromEnv } from "@/lib/adapters/mercari-shops";
import { getTrackedProductById, mockProducts } from "@/lib/data/mock-repository";
import { sendPriceAlert } from "@/lib/services/email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tracked = getTrackedProductById(id);

  if (!tracked) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let product = mockProducts.find((p) => p.id === tracked.productId);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // 有 API Token 時，重新抓最新價格
  if (process.env.MERCARI_API_TOKEN?.trim() && product.externalProductId) {
    try {
      const adapter = createMercariAdapterFromEnv();
      const result = await adapter.fetchProducts({ keyword: product.externalProductId, first: 1 });
      const fresh = result.products.find((p) => p.externalProductId === product!.externalProductId);
      if (fresh) {
        product = { ...product, currentPrice: fresh.price, status: fresh.status };
      }
    } catch {
      // 抓取失敗繼續用快取資料，不中斷檢查流程
    }
  }

  const shouldNotify =
    tracked.targetPrice !== null && product.currentPrice <= tracked.targetPrice;

  const email = tracked.notifyEmail;

  if (!email) {
    return NextResponse.json({
      shouldNotify,
      sent: false,
      reason: "no_email",
      currentPrice: product.currentPrice,
      targetPrice: tracked.targetPrice,
      message: "尚未設定通知 Email，請先在「設定通知」中填入 Email。",
    });
  }

  if (!shouldNotify) {
    return NextResponse.json({
      shouldNotify: false,
      sent: false,
      reason: "price_not_reached",
      currentPrice: product.currentPrice,
      targetPrice: tracked.targetPrice,
      message: `目前價格 JPY ${product.currentPrice.toLocaleString("ja-JP")} 尚未達到目標 JPY ${tracked.targetPrice?.toLocaleString("ja-JP") ?? "--"}，不需通知。`,
    });
  }

  const result = await sendPriceAlert({
    to: email,
    productTitle: product.title,
    currentPrice: product.currentPrice,
    targetPrice: tracked.targetPrice!,
    sourceUrl: product.sourceUrl,
  });

  if (!result.sent) {
    return NextResponse.json({
      shouldNotify: true,
      sent: false,
      reason: "smtp_error",
      currentPrice: product.currentPrice,
      targetPrice: tracked.targetPrice,
      message: `⚠ 價格已達目標，但寄信失敗：${result.error}`,
    });
  }

  return NextResponse.json({
    shouldNotify: true,
    sent: true,
    reason: "price_reached",
    currentPrice: product.currentPrice,
    targetPrice: tracked.targetPrice,
    email,
    message: `✓ 通知信已寄送至 ${email}，商品「${product.title}」目前 JPY ${product.currentPrice.toLocaleString("ja-JP")} 已達目標價 JPY ${tracked.targetPrice?.toLocaleString("ja-JP") ?? "--"}。`,
  });
}
