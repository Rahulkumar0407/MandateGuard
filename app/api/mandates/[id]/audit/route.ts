import { NextResponse } from "next/server";
import { getAuditService } from "@/lib/audit/service";
import { getMandateService } from "@/lib/mandate/service";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// GET /api/mandates/:id/audit
//
// STEP 18 — read-only, chronological audit trail for one mandate. It answers:
// what changed, what policy ran, what was decided, what action was attempted,
// and what happened.
//
// It performs no evaluation and no provider action. It exposes no secrets and
// no internal stack traces: audit rows only ever contain structured facts,
// reason codes and server-generated explanations.
export async function GET(_req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing mandate id." }, { status: 400 });
    }

    const mandate = await getMandateService().getMandate(id);
    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    const events = await getAuditService().listForMandate(id);

    return NextResponse.json(
      {
        mandateId: id,
        count: events.length,
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          policyVersion: e.policyVersion,
          baselineOfferVersion: e.baselineOfferVersion,
          currentOfferVersion: e.currentOfferVersion,
          decision: e.decision,
          action: e.action,
          status: e.status,
          reason: e.reason,
          providerSubscriptionId: e.providerSubscriptionId,
          actionKey: e.actionKey,
          metadata: e.metadata,
          createdAt: e.createdAt,
        })),
      },
      { status: 200 },
    );
  } catch {
    // Controlled response: never surface an internal error or stack trace.
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
