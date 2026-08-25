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
  } catch (err) {
    if (err instanceof ReauthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal error approving reauthorization." },
      { status: 500 },
    );
  }
}
