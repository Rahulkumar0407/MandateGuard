// Public surface of the M6-A Deterministic Mandate Policy Engine.
//
// M6 consumes the structured IntegrityReport (M4 deterministic + M5 semantic)
// and returns ALLOW / REVIEW / PAUSE. It is deterministic, explainable, and
// free of any LLM or payment-execution dependency.
export { evaluatePolicy, isEvaluationComplete } from "./engine";
export { PolicyService, getPolicyService } from "./service";
export { DEFAULT_POLICY } from "./types";
export type {
  MandateDecision,
  PolicyReason,
  PolicyResult,
  IntegrityPolicy,
} from "./types";
