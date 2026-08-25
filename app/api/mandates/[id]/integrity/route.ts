import { NextResponse } from "next/server";
import { getIntegrityService, IntegrityError } from "@/lib/integrity/service";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// GET /api/mandates/:id/integrity
//
// Runs the DETERMINISTIC integrity engine: compares the immutable authorized
// snapshot (baseline) against the current active offer of the same product
// lineage. It ONLY reports what changed (structured evidence).
//
// STEP 17 — it never pauses, resumes, charges, or modifies anything. The
// mandate, snapshot, offer, and subscription are all read-only here.
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing mandate id." },
        { status: 400 },
      );
    }
    const report = await getIntegrityService().evaluateMandate(id);
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    if (err instanceof IntegrityError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status },
      );
    }
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
