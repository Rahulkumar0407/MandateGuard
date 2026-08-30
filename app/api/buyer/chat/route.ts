import { NextResponse } from "next/server";
import { z } from "zod";
import { getConversationalBuyerService } from "@/lib/agent/conversational-buyer";

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z
    .object({
      userId: z.string().optional(),
      locale: z.string().optional(),
      preferredCurrency: z.string().optional(),
      channel: z
        .enum([
          "text",
          "voice_transcription",
          "structured_form",
          "agent_delegation",
        ])
        .optional(),
    })
    .optional(),
});


export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request format.",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 },
      );
    }

    const service = getConversationalBuyerService();
    const result = await service.processMessage(
      parsed.data.message,
      parsed.data.context,
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal error processing buyer message.";
    return NextResponse.json(
      {
        error: "Internal error processing buyer message.",
        message,
      },
      { status: 500 },
    );
  }
}
