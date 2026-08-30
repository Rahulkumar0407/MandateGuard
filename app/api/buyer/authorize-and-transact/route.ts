import { NextResponse } from "next/server";
import { z } from "zod";
import { getBuyerTransactionService } from "@/lib/agent/buyer-transaction";
import { MandateError } from "@/lib/mandate/service";

const AuthorizeAndTransactSchema = z.object({
  userId: z.string().min(1).max(100).default("user_buyer_demo"),
  offerId: z.string().min(1).max(100),
  expectedVersion: z.number().int().positive().optional(),
  expectedVersionHash: z.string().optional(),
  spendingLimitPaise: z.number().int().positive().optional(),
  customerEmail: z.string().email().optional(),
  customerContact: z.string().optional(),
  idempotencyKey: z.string().min(1).max(200).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = AuthorizeAndTransactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid authorization request.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const service = getBuyerTransactionService();
    const transaction = await service.authorizeAndTransact(parsed.data);

    return NextResponse.json(
      {
        success: true,
        transaction,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MandateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message =
      error instanceof Error ? error.message : "Internal error executing transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
