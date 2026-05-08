import { NextResponse } from "next/server";

import { deleteTrackedProduct, updateTrackedProduct } from "@/lib/data/mock-repository";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json() as { targetPrice?: number | null; notifyEmail?: string | null };

  const updated = updateTrackedProduct(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: Params,
) {
  const { id } = await params;

  const deleted = deleteTrackedProduct(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
