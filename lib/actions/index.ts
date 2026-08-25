// Public surface of the M7-A action boundary.
//
//   Integrity -> Policy -> PolicyDecision -> ActionExecutor -> ActionResult
//                                                 |
//                                                 v
//                                      RazorpayActionGateway
//                                        (Mock in M7-A, Real in M7-B)
//
// The AI layer must never import anything from here: it can produce intent and
// recommendations only. Actions are derived deterministically from the policy
// decision on the server.
export {
  ActionExecutor,
  evaluatePausePrerequisites,
  getActionExecutor,
  getActionRepository,
  setActionRepository,
  InMemoryActionRepository,
  type ActionExecutorDeps,
} from "./executor";
export {
  ActionGatewayError,
  DisabledRazorpayActionGateway,
  MockRazorpayActionGateway,
  RealRazorpayActionGateway,
  LIVE_ACTIONS_ENABLED,
  getActionGateway,
  setActionGateway,
  resetActionGateway,
  type MockActionGatewayMode,
  type PauseSubscriptionResult,
  type RazorpayActionGateway,
} from "./gateway";
export {
  PrismaActionRepository,
  type ActionRepository,
} from "./repository";
export {
  ACTION_BY_DECISION,
  ActionError,
  actionForDecision,
  buildActionKey,
  type ActionReasonCode,
  type ActionRecord,
  type ActionResult,
  type ActionStatus,
  type ActionType,
} from "./types";
