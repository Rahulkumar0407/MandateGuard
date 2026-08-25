import { describe, it, expect } from "vitest";
import {
  transitionReauthorizationState,
  canTransition,
  InvalidStateTransitionError,
} from "@/lib/reauthorization/state-machine";

describe("Reauthorization State Machine — Pure Transitions", () => {
  it("transitions ACTIVE -> MIGRATION_PENDING on INITIATE_MIGRATION", () => {
    expect(
      transitionReauthorizationState("ACTIVE", "INITIATE_MIGRATION"),
    ).toBe("MIGRATION_PENDING");
    expect(canTransition("ACTIVE", "INITIATE_MIGRATION")).toBe(true);
  });

  it("transitions ACTIVE -> PAUSED on PAUSE_AUTHORIZATION", () => {
    expect(
      transitionReauthorizationState("ACTIVE", "PAUSE_AUTHORIZATION"),
    ).toBe("PAUSED");
  });

  it("transitions MIGRATION_PENDING -> REAUTHORIZED on APPROVE_REAUTHORIZATION", () => {
    expect(
      transitionReauthorizationState(
        "MIGRATION_PENDING",
        "APPROVE_REAUTHORIZATION",
      ),
    ).toBe("REAUTHORIZED");
  });

  it("transitions MIGRATION_PENDING -> DECLINED on DECLINE_REAUTHORIZATION", () => {
    expect(
      transitionReauthorizationState(
        "MIGRATION_PENDING",
        "DECLINE_REAUTHORIZATION",
      ),
    ).toBe("DECLINED");
  });

  it("transitions MIGRATION_PENDING -> EXPIRED on EXPIRE_REQUEST", () => {
    expect(
      transitionReauthorizationState("MIGRATION_PENDING", "EXPIRE_REQUEST"),
    ).toBe("EXPIRED");
  });

  it("transitions DECLINED -> ACTIVE on RESUME_AUTHORIZATION (retain baseline)", () => {
    expect(
      transitionReauthorizationState("DECLINED", "RESUME_AUTHORIZATION"),
    ).toBe("ACTIVE");
  });

  it("transitions DECLINED -> PAUSED on PAUSE_AUTHORIZATION", () => {
    expect(
      transitionReauthorizationState("DECLINED", "PAUSE_AUTHORIZATION"),
    ).toBe("PAUSED");
  });

  it("transitions PAUSED -> ACTIVE on RESUME_AUTHORIZATION", () => {
    expect(
      transitionReauthorizationState("PAUSED", "RESUME_AUTHORIZATION"),
    ).toBe("ACTIVE");
  });

  it("transitions PAUSED -> REAUTHORIZED on APPROVE_REAUTHORIZATION", () => {
    expect(
      transitionReauthorizationState("PAUSED", "APPROVE_REAUTHORIZATION"),
    ).toBe("REAUTHORIZED");
  });

  it("throws InvalidStateTransitionError on forbidden transitions", () => {
    expect(() =>
      transitionReauthorizationState("EXPIRED", "APPROVE_REAUTHORIZATION"),
    ).toThrow(InvalidStateTransitionError);

    expect(() =>
      transitionReauthorizationState("REAUTHORIZED", "INITIATE_MIGRATION"),
    ).toThrow(InvalidStateTransitionError);

    expect(() =>
      transitionReauthorizationState("ACTIVE", "APPROVE_REAUTHORIZATION"),
    ).toThrow(InvalidStateTransitionError);
  });
});
