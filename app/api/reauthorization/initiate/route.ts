import { NextResponse } from "next/server";
import {
  getReauthorizationService,
  ReauthorizationError,
} from "@/lib/reauthorization/service";
import { InitiateReauthorizationInputSchema } from "@/lib/reauthorization/types";

/**
 * POST /api/reauthorization/initiate
 * Initiates migration/reauthorization when an offer is incompatible or requires review.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Request body must be a valid JSON object." },
        { status: 400 },
      );
    }

    const parsed = InitiateReauthorizationInputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid initiate reauthorization payload.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const service = getReauthorizationService();
    const result = await service.initiateReauthorization(parsed.data);

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ReauthorizationError || (err && typeof err === "object" && "status" in err)) {
      return NextResponse.json({ error: (err as Error).message }, { status: (err as { status: number }).status || 400 });
    }
    const message = err instanceof Error ? err.message : "Internal error initiating reauthorization.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
