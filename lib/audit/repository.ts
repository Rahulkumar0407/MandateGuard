import type { PrismaClient } from "@prisma/client";
import type { AuditEventInput, AuditEventRecord, AuditEventType } from "./types";

// Repository boundary for the audit trail. Deliberately APPEND + READ ONLY:
// there is no update and no delete, in production or in the test double, so a
// historical audit record can never be rewritten (STEP 9 / audit immutability).
export interface AuditRepository {
  append(input: AuditEventInput): Promise<AuditEventRecord>;
  listByMandate(mandateId: string): Promise<AuditEventRecord[]>;
  listByActionKey(actionKey: string): Promise<AuditEventRecord[]>;
}

// --- Production: Prisma ----------------------------------------------------

type AuditRow = {
  id: string;
  mandateId: string;
  eventType: string;
  policyVersion: string | null;
  baselineOfferVersion: number | null;
  currentOfferVersion: number | null;
  decision: string | null;
  action: string | null;
  status: string | null;
  reason: string | null;
  providerSubscriptionId: string | null;
  actionKey: string | null;
  metadata: unknown;
  createdAt: Date;
};

function toRecord(row: AuditRow): AuditEventRecord {
  return {
    id: row.id,
    mandateId: row.mandateId,
    eventType: row.eventType as AuditEventType,
    policyVersion: row.policyVersion,
    baselineOfferVersion: row.baselineOfferVersion,
    currentOfferVersion: row.currentOfferVersion,
    decision: row.decision,
    action: row.action,
    status: row.status,
    reason: row.reason,
    providerSubscriptionId: row.providerSubscriptionId,
    actionKey: row.actionKey,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: row.createdAt,
  };
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(input: AuditEventInput): Promise<AuditEventRecord> {
    const row = await this.prisma.auditEvent.create({
      data: {
        mandateId: input.mandateId,
        eventType: input.eventType,
        policyVersion: input.policyVersion ?? null,
        baselineOfferVersion: input.baselineOfferVersion ?? null,
        currentOfferVersion: input.currentOfferVersion ?? null,
        decision: input.decision ?? null,
        action: input.action ?? null,
        status: input.status ?? null,
        reason: input.reason ?? null,
        providerSubscriptionId: input.providerSubscriptionId ?? null,
        actionKey: input.actionKey ?? null,
        metadata: (input.metadata ?? undefined) as never,
      },
    });
    return toRecord(row);
  }

  async listByMandate(mandateId: string): Promise<AuditEventRecord[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { mandateId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toRecord);
  }

  async listByActionKey(actionKey: string): Promise<AuditEventRecord[]> {
    const rows = await this.prisma.auditEvent.findMany({
      where: { actionKey },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return rows.map(toRecord);
  }
}

// --- In-memory (test double / offline) --------------------------------------

// Stores DEEP COPIES on write and returns DEEP COPIES on read, so neither the
// caller's later mutations nor a reader can alter recorded history.
export class InMemoryAuditRepository implements AuditRepository {
  private events: AuditEventRecord[] = [];
  private seq = 0;

  async append(input: AuditEventInput): Promise<AuditEventRecord> {
    this.seq += 1;
    const record: AuditEventRecord = {
      id: `ae_${this.seq}`,
      mandateId: input.mandateId,
      eventType: input.eventType,
      policyVersion: input.policyVersion ?? null,
      baselineOfferVersion: input.baselineOfferVersion ?? null,
      currentOfferVersion: input.currentOfferVersion ?? null,
      decision: input.decision ?? null,
      action: input.action ?? null,
      status: input.status ?? null,
      reason: input.reason ?? null,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      actionKey: input.actionKey ?? null,
      metadata: input.metadata ? clone(input.metadata) : null,
      createdAt: new Date(),
    };
    this.events.push(record);
    return clone(record);
  }

  async listByMandate(mandateId: string): Promise<AuditEventRecord[]> {
    return this.events
      .filter((e) => e.mandateId === mandateId)
      .map((e) => clone(e));
  }

  async listByActionKey(actionKey: string): Promise<AuditEventRecord[]> {
    return this.events
      .filter((e) => e.actionKey === actionKey)
      .map((e) => clone(e));
  }

  // Test helper: total number of appended events (all mandates).
  get size(): number {
    return this.events.length;
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
