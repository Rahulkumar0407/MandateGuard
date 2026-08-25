import type { PrismaClient } from "@prisma/client";
import type { MandateDecision } from "@/lib/policy/types";
import type {
  ActionRecord,
  ActionStatus,
  ActionType,
  ReserveActionInput,
  ReserveActionResult,
} from "./types";

// STEP 5 — the action / idempotency boundary.
//
// `reserve` is the critical operation: it attempts to CREATE a PENDING row for
// the deterministic action key. If the key already exists it returns the
// existing row with `created: false`, and the executor must not call the
// provider again.
export interface ActionRepository {
  findByActionKey(actionKey: string): Promise<ActionRecord | null>;
  reserve(input: ReserveActionInput): Promise<ReserveActionResult>;
  markSucceeded(
    id: string,
    patch: { providerSubscriptionId: string | null; reason: string },
  ): Promise<ActionRecord>;
  markFailed(id: string, patch: { reason: string }): Promise<ActionRecord>;
  listByMandate(mandateId: string): Promise<ActionRecord[]>;
}

// --- Production: Prisma ----------------------------------------------------

type ActionRow = {
  id: string;
  mandateId: string;
  actionKey: string;
  action: string;
  status: string;
  decision: string;
  policyVersion: string;
  baselineOfferVersion: number;
  currentOfferVersion: number | null;
  providerSubscriptionId: string | null;
  reason: string | null;
  attemptCount: number;
  executedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toRecord(row: ActionRow): ActionRecord {
  return {
    id: row.id,
    mandateId: row.mandateId,
    actionKey: row.actionKey,
    action: row.action as ActionType,
    status: row.status as Extract<ActionStatus, "PENDING" | "SUCCEEDED" | "FAILED">,
    decision: row.decision as MandateDecision,
    policyVersion: row.policyVersion,
    baselineOfferVersion: row.baselineOfferVersion,
    currentOfferVersion: row.currentOfferVersion,
    providerSubscriptionId: row.providerSubscriptionId,
    reason: row.reason,
    attemptCount: row.attemptCount,
    executedAt: row.executedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

export class PrismaActionRepository implements ActionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByActionKey(actionKey: string): Promise<ActionRecord | null> {
    const row = await this.prisma.mandateAction.findUnique({
      where: { actionKey },
    });
    return row ? toRecord(row) : null;
  }

  async reserve(input: ReserveActionInput): Promise<ReserveActionResult> {
    try {
      const row = await this.prisma.mandateAction.create({
        data: {
          mandateId: input.mandateId,
          actionKey: input.actionKey,
          action: input.action,
          status: "PENDING",
          decision: input.decision,
          policyVersion: input.policyVersion,
          baselineOfferVersion: input.baselineOfferVersion,
          currentOfferVersion: input.currentOfferVersion,
          providerSubscriptionId: input.providerSubscriptionId,
          attemptCount: 1,
        },
      });
      return { record: toRecord(row), created: true };
    } catch (err) {
      // The DB uniqueness constraint on actionKey is the real idempotency
      // guarantee (it also holds under concurrency).
      if (isUniqueViolation(err)) {
        const existing = await this.findByActionKey(input.actionKey);
        if (existing) return { record: existing, created: false };
      }
      throw err;
    }
  }

  async markSucceeded(
    id: string,
    patch: { providerSubscriptionId: string | null; reason: string },
  ): Promise<ActionRecord> {
    const row = await this.prisma.mandateAction.update({
      where: { id },
      data: {
        status: "SUCCEEDED",
        providerSubscriptionId: patch.providerSubscriptionId,
        reason: patch.reason,
        executedAt: new Date(),
      },
    });
    return toRecord(row);
  }

  async markFailed(id: string, patch: { reason: string }): Promise<ActionRecord> {
    const row = await this.prisma.mandateAction.update({
      where: { id },
      data: { status: "FAILED", reason: patch.reason },
    });
    return toRecord(row);
  }

  async listByMandate(mandateId: string): Promise<ActionRecord[]> {
    const rows = await this.prisma.mandateAction.findMany({
      where: { mandateId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toRecord);
  }
}

// --- In-memory (test double / offline) --------------------------------------

// Mirrors the Prisma semantics exactly, including "create fails when the action
// key already exists".
export class InMemoryActionRepository implements ActionRepository {
  private byKey = new Map<string, ActionRecord>();
  private byId = new Map<string, ActionRecord>();
  private seq = 0;

  async findByActionKey(actionKey: string): Promise<ActionRecord | null> {
    const found = this.byKey.get(actionKey);
    return found ? { ...found } : null;
  }

  async reserve(input: ReserveActionInput): Promise<ReserveActionResult> {
    const existing = this.byKey.get(input.actionKey);
    if (existing) return { record: { ...existing }, created: false };

    this.seq += 1;
    const now = new Date();
    const record: ActionRecord = {
      id: `ma_${this.seq}`,
      mandateId: input.mandateId,
      actionKey: input.actionKey,
      action: input.action,
      status: "PENDING",
      decision: input.decision,
      policyVersion: input.policyVersion,
      baselineOfferVersion: input.baselineOfferVersion,
      currentOfferVersion: input.currentOfferVersion,
      providerSubscriptionId: input.providerSubscriptionId,
      reason: null,
      attemptCount: 1,
      executedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.byKey.set(record.actionKey, record);
    this.byId.set(record.id, record);
    return { record: { ...record }, created: true };
  }

  async markSucceeded(
    id: string,
    patch: { providerSubscriptionId: string | null; reason: string },
  ): Promise<ActionRecord> {
    const record = this.require(id);
    record.status = "SUCCEEDED";
    record.providerSubscriptionId = patch.providerSubscriptionId;
    record.reason = patch.reason;
    record.executedAt = new Date();
    record.updatedAt = new Date();
    return { ...record };
  }

  async markFailed(id: string, patch: { reason: string }): Promise<ActionRecord> {
    const record = this.require(id);
    record.status = "FAILED";
    record.reason = patch.reason;
    record.updatedAt = new Date();
    return { ...record };
  }

  async listByMandate(mandateId: string): Promise<ActionRecord[]> {
    return [...this.byKey.values()]
      .filter((r) => r.mandateId === mandateId)
      .map((r) => ({ ...r }));
  }

  private require(id: string): ActionRecord {
    const record = this.byId.get(id);
    if (!record) throw new Error(`Action record ${id} not found.`);
    return record;
  }
}
