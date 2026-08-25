import { NextResponse } from "next/server";
import {
  getCompatibilityService,
  CompatibilityError,
} from "@/lib/compatibility/service";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /v1/subscriptions/:id/compatibility-status
 * 
 * Agent-facing compatibility & authorization query endpoint:
 * 1. Is the current offer compatible with the subscriber's authorized baseline?
 * 2. Is the agent authorized to proceed autonomously?
 * 3. What action is required before proceeding?
 * 
 * Read-only authorization query; NEVER mutates payment/subscription state.
 */
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid subscription identifier." },
        { status: 400 },
      );
    }

    const service = getCompatibilityService();
    const result = await service.getAgentCompatibilityStatus(id);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof CompatibilityError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal error processing compatibility status." },
      { status: 500 },
    );
  }
}
