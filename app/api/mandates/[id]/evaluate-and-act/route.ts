import { NextResponse } from "next/server";
import { ActionError } from "@/lib/actions/types";
import { getActionExecutor } from "@/lib/actions/executor";

type Context = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

// POST /api/mandates/:id/evaluate-and-act
//
// STEP 19 — the explicit, server-authoritative action endpoint. It:
//   1. evaluates integrity (M4 + M5);
//   2. applies the deterministic policy (M6);
//   3. writes audit records;
//   4. derives the action from the DECISION only;
//   5. executes it exclusively through the ActionExecutor;
//   6. records the action result.
//
// SECURITY (STEP 19 / STEP 20): the client cannot select an action. There is no
// request field that can force a pause — a body carrying `action`/`decision` is
// rejected outright, and the body is otherwise ignored. The AI layer has no
// access to this endpoint's executor, gateway, or pause capability either.
export async function POST(req: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ error: "Missing mandate id." }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const keys = Object.keys(body as Record<string, unknown>);
      const forbidden = keys.filter((k) =>
        ["action", "decision", "pause", "forceaction", "razorpaysubscriptionid"].includes(
          k.toLowerCase(),
        ),
      );
      if (forbidden.length > 0) {
        return NextResponse.json(
          {
            error:
              "Client-supplied actions are not accepted. The server determines the action from the policy decision.",
          },
          { status: 400 },
        );
      }
    }

    const result = await getActionExecutor().evaluateAndAct(id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof ActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Never leak internal errors or stack traces.
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
