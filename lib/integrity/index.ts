// Public surface of the MandateGuard Integrity Engine (M4 deterministic + M5
// semantic). M4 performs DETECTION only and never calls an LLM; M5 adds a
// semantic evaluator that is an EVALUATOR, never an authorization engine. M6
// will later turn combined findings into policy decisions.
export { evaluateIntegrity, IntegrityService, IntegrityError } from "./service";
export { toMonthlyEquivalent, isKnownInterval } from "./price";
export {
  getSemanticProvider,
  setSemanticProvider,
  runSemanticEvaluation,
  MockSemanticIntegrityProvider,
  RealSemanticIntegrityProvider,
  type SemanticIntegrityProvider,
} from "./semantic-provider";
export {
  buildSemanticPrompt,
  SemanticEvaluationSchema,
  SemanticProviderNotConfiguredError,
  SemanticProviderUnavailableError,
  type SemanticComparisonInput,
  type SemanticEvaluation,
  type SemanticFinding,
  type SemanticFindingType,
  type SemanticDirection,
  type SemanticEvaluationStatus,
} from "./semantic";
export type {
  IntegrityDimension,
  IntegritySeverity,
  IntegrityFindingType,
  IntegrityFinding,
  IntegrityStatus,
  IntegrityReport,
  IntegrityBaseline,
  IntegrityCurrent,
} from "./types";
