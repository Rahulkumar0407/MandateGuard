// Defensive redaction for audit metadata.
//
// The audit writer only ever receives server-derived structured facts, but the
// audit trail is a permanent store, so we apply a belt-and-braces filter: any
// key whose NAME looks like a credential is dropped (never persisted, never
// returned), and long free-form strings are truncated so a provider error body
// or a stack trace can never be smuggled into an audit row.

const SENSITIVE_KEY = /(secret|password|passphrase|credential|token|api[-_]?key|private[-_]?key|authorization|bearer|signature)/i;

const MAX_STRING = 500;
const MAX_DEPTH = 4;

export const REDACTED = "[REDACTED]";

function redactValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) {
    return value.map((v) => redactValue(v, depth + 1));
  }
  if (typeof value === "object") {
    // Errors are never stored: neither message-with-internals nor stack.
    if (value instanceof Error) return REDACTED;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redactValue(v, depth + 1);
    }
    return out;
  }
  // Functions, symbols, bigints: not auditable data.
  return REDACTED;
}

export function redactMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    out[k] = SENSITIVE_KEY.test(k) ? REDACTED : redactValue(v, 1);
  }
  return out;
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}
