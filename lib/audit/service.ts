import { prisma } from "@/lib/db";
import { redactMetadata } from "./redact";
import {
  InMemoryAuditRepository,
  PrismaAuditRepository,
  type AuditRepository,
} from "./repository";
import type { AuditEventInput, AuditEventRecord } from "./types";

// Write/read facade over the append-only audit repository.
//
// The service is the only place that writes audit rows, which lets it enforce
// the "no secrets" rule centrally (see redact.ts) and keeps the executor free
// of persistence detail.
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async record(input: AuditEventInput): Promise<AuditEventRecord> {
    return this.repo.append({
      ...input,
      metadata: redactMetadata(input.metadata),
    });
  }

  // Chronological (oldest first) history for one mandate.
  async listForMandate(mandateId: string): Promise<AuditEventRecord[]> {
    return this.repo.listByMandate(mandateId);
  }

  async listForActionKey(actionKey: string): Promise<AuditEventRecord[]> {
    return this.repo.listByActionKey(actionKey);
  }
}

// --- Factory / test seam (no DI framework) --------------------------------

let repoOverride: AuditRepository | null = null;
let serviceSingleton: AuditService | null = null;

export function setAuditRepository(repo: AuditRepository | null): void {
  repoOverride = repo;
  serviceSingleton = null;
}

export function getAuditService(): AuditService {
  if (repoOverride) return new AuditService(repoOverride);
  if (!serviceSingleton) {
    serviceSingleton = new AuditService(new PrismaAuditRepository(prisma));
  }
  return serviceSingleton;
}

export { InMemoryAuditRepository, PrismaAuditRepository };
export type { AuditRepository };
