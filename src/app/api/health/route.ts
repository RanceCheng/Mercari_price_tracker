import { NextResponse } from "next/server";

import { getDashboardMetrics } from "@/lib/data/mock-repository";

export async function GET() {
  return NextResponse.json({
    data: {
      status: "OK",
      checkedAt: new Date().toISOString(),
      metrics: getDashboardMetrics(),
      dependencies: {
        database: "MOCKED",
        redis: "MOCKED",
        email: "MOCKED",
        mercariApi: process.env.MERCARI_API_TOKEN ? "CONFIGURED" : "NOT_CONFIGURED",
      },
    },
  });
}
