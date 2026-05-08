import { NextResponse } from "next/server";

import { addTrackedProduct, listTrackedProductRows } from "@/lib/data/mock-repository";

export async function GET() {
  return NextResponse.json({ data: listTrackedProductRows() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    targetPrice?: number | null;
    notifyEmail?: string | null;
  };

  if (!body.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const newItem = addTrackedProduct(
    body.productId,
    body.targetPrice ?? null,
    body.notifyEmail ?? null,
  );

  return NextResponse.json({ data: newItem }, { status: 201 });
}
