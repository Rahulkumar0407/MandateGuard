import { NextResponse } from "next/server";
import {
  getReauthorizationService,
  ReauthorizationError,
} from "@/lib/reauthorization/service";
import { DeclineReauthorizationInputSchema } from "@/lib/reauthorization/types";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/reauthorization/:id/decline
 * Declines reauthorization, retaining the old baseline or pausing.
 */
export async function POST(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const rawBody = (await req.json().catch(() => ({}))) ?? {};

    const parsed = DeclineReauthorizationInputSchema.safeParse({
      ...rawBody,
      requestId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid decline reauthorization payload.",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const service = getReauthorizationService();
    const result = await service.declineReauthorization(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ReauthorizationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Internal error declining reauthorization." },
      { status: 500 },
    );
  }
}
