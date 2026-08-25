import type {
  ReauthorizationEventType,
  ReauthorizationState,
} from "./types";

export class InvalidStateTransitionError extends Error {
  constructor(
    public readonly fromState: ReauthorizationState,
    public readonly event: ReauthorizationEventType,
    public readonly allowedEvents: ReauthorizationEventType[],
  ) {
    super(
      `Cannot perform event '${event}' from state '${fromState}'. Allowed events: [${allowedEvents.join(", ")}]`,
    );
    this.name = "InvalidStateTransitionError";
  }
}

/**
 * Deterministic transition map:
 * Defines valid next states for each (currentState, event) pair.
 */
const TRANSITION_TABLE: Record<
  ReauthorizationState,
  Partial<Record<ReauthorizationEventType, ReauthorizationState>>
> = {
  ACTIVE: {
    INITIATE_MIGRATION: "MIGRATION_PENDING",
    PAUSE_AUTHORIZATION: "PAUSED",
  },
  MIGRATION_PENDING: {
    INITIATE_MIGRATION: "MIGRATION_PENDING",
    APPROVE_REAUTHORIZATION: "REAUTHORIZED",
    DECLINE_REAUTHORIZATION: "DECLINED",
    EXPIRE_REQUEST: "EXPIRED",
    PAUSE_AUTHORIZATION: "PAUSED",
  },
  DECLINED: {
    RESUME_AUTHORIZATION: "ACTIVE",
    PAUSE_AUTHORIZATION: "PAUSED",
  },
  PAUSED: {
    RESUME_AUTHORIZATION: "ACTIVE",
    INITIATE_MIGRATION: "MIGRATION_PENDING",
    APPROVE_REAUTHORIZATION: "REAUTHORIZED",
  },
  REAUTHORIZED: {
    // Terminal state for this request lifecycle
  },
  EXPIRED: {
    // Terminal state for this request lifecycle
  },
};

/**
 * Pure deterministic state transition evaluator.
 * Validates whether the event is permitted from the current state and returns the next state.
 */
export function transitionReauthorizationState(
  currentState: ReauthorizationState,
  event: ReauthorizationEventType,
): ReauthorizationState {
  const allowedTransitions = TRANSITION_TABLE[currentState];
  const nextState = allowedTransitions[event];

  if (!nextState) {
    const allowedEvents = Object.keys(
      allowedTransitions,
    ) as ReauthorizationEventType[];
    throw new InvalidStateTransitionError(
      currentState,
      event,
      allowedEvents,
    );
  }

  return nextState;
}

/**
 * Checks whether an event is allowed from the given state without throwing.
 */
export function canTransition(
  currentState: ReauthorizationState,
  event: ReauthorizationEventType,
): boolean {
  return !!TRANSITION_TABLE[currentState][event];
}
