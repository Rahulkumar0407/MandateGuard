import { NextResponse } from "next/server";
import { getUnifiedBuyerBrainBenchmarkRunner } from "@/lib/buyer-benchmark";

/**
 * GET /api/benchmark/buyer-brain
 *
 * Returns live, cached comparative benchmark report and representative case evaluations
 * across Rules Baseline, LLM-Only, and MandateGuard Buyer Brain.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const split = searchParams.get("split") as "train" | "held_out" | null;

    const runner = getUnifiedBuyerBrainBenchmarkRunner();
    const report = await runner.runComparativeBenchmark({
      split: split || undefined,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal benchmark error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
