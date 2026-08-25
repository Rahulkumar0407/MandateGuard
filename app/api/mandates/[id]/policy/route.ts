import { NextResponse } from "next/server";
import { getPolicyService } from "@/lib/policy/service";
import { IntegrityError } from "@/lib/integrity/service";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// GET /api/mandates/:id/policy
//
// Read-only policy evaluation. It obtains the integrity report and applies the
// deterministic policy, returning ALLOW / REVIEW / PAUSE with reasons.
//
// STEP 14 / 15 — this endpoint performs NO Razorpay action and modifies nothing.
// A PAUSE result is only a determination; no subscription is touched. It is safe
// to call repeatedly.
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing mandate id." },
        { status: 400 },
      );
    }
    const result = await getPolicyService().evaluateMandate(id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // A missing mandate means integrity evaluation could not run — surface a
    // controlled error (never a silent ALLOW).
    if (err instanceof IntegrityError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
