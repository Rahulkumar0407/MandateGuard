import { NextResponse } from "next/server";
import { z } from "zod";
import { getBuyerTransactionService } from "@/lib/agent/buyer-transaction";
import { MandateError } from "@/lib/mandate/service";
import { CanonicalBuyerIntentSchema } from "@/lib/intent/schema";

const PreviewRequestSchema = z.object({
  offerId: z.string().min(1).max(100),
  intent: CanonicalBuyerIntentSchema.optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = PreviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request format.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const service = getBuyerTransactionService();
    const preview = await service.getPurchasePreview(
      parsed.data.offerId,
      parsed.data.intent,
    );

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    if (error instanceof MandateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Internal error generating purchase preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
