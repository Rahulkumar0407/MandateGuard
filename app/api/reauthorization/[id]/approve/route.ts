import { NextResponse } from "next/server";
import {
  getReauthorizationService,
  ReauthorizationError,
} from "@/lib/reauthorization/service";
import { ApproveReauthorizationInputSchema } from "@/lib/reauthorization/types";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/reauthorization/:id/approve
 * Approves reauthorization, pinning a new baseline AuthorizationEnvelope.
 */
export async function POST(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const rawBody = (await req.json().catch(() => ({}))) ?? {};

    const parsed = ApproveReauthorizationInputSchema.safeParse({
      ...rawBody,
      requestId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid approve reauthorization payload.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const service = getReauthorizationService();
    const result = await service.approveReauthorization(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ReauthorizationError || (err && typeof err === "object" && "status" in err)) {
      return NextResponse.json({ error: (err as Error).message }, { status: (err as { status: number }).status || 400 });
    }
    const message = err instanceof Error ? err.message : "Internal error approving reauthorization.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
