import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      data: {
        id: `sync_${Date.now()}`,
        status: "QUEUED",
        source: "MERCARI_SHOPS",
        nextRunAt: new Date().toISOString(),
      },
    },
    { status: 202 },
  );
}
