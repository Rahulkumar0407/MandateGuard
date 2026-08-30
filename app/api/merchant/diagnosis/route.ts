import { NextResponse } from "next/server";
import { getMerchantIntelligenceService } from "@/lib/merchant-intelligence";

/**
 * GET /api/merchant/diagnosis
 * POST /api/merchant/diagnosis
 *
 * Sythensizes the authoritative Merchant AI Evidence & Diagnosis Report.
 * READ-ONLY: Zero financial mutations or provider calls.
 */
export async function GET() {
  try {
    const service = getMerchantIntelligenceService();
    const report = await service.generateDiagnosticReport();
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate merchant diagnostic report.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const service = getMerchantIntelligenceService();
    const report = await service.generateDiagnosticReport({
      missionEvaluations: body.missionEvaluations,
      historicalIntents: body.historicalIntents,
    });
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate merchant diagnostic report.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}


