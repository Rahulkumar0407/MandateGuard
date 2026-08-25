// Public surface of the M7-A audit trail.
//
// Append-only history of integrity evaluation, policy decision, and any action
// attempt. It contains no secrets and no stack traces.
export {
  AuditService,
  getAuditService,
  setAuditRepository,
  InMemoryAuditRepository,
  PrismaAuditRepository,
  type AuditRepository,
} from "./service";
export { redactMetadata, isSensitiveKey, REDACTED } from "./redact";
export { AUDIT_EVENT_TYPES } from "./types";
export type {
  AuditEventType,
  AuditEventInput,
  AuditEventRecord,
} from "./types";
