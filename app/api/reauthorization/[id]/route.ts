import { NextResponse } from "next/server";
import { getReauthorizationService } from "@/lib/reauthorization/service";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/reauthorization/:id
 * Fetches status of a reauthorization request.
 */
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const service = getReauthorizationService();
    const result = await service.getReauthorizationRequest(id);

    if (!result) {
      return NextResponse.json(
        { error: `Reauthorization request '${id}' not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal error fetching reauthorization request." },
      { status: 500 },
    );
  }
}
