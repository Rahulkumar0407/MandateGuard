import { describe, it, expect } from "vitest";
import {
  evaluatePause,
  evaluateResume,
  isValidTransition,
  normalizeStatus,
} from "@/lib/subscription/state";

describe("evaluatePause", () => {
  it("allows pause from ACTIVE", () => {
    expect(evaluatePause("ACTIVE")).toEqual({ allowed: true });
  });

  it("rejects pause from PENDING with a controlled reason", () => {
    const r = evaluatePause("PENDING");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toMatch(/pending/i);
  });

  it("rejects a redundant pause from PAUSED", () => {
    const r = evaluatePause("PAUSED");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toMatch(/already paused/i);
  });

  it("rejects pause from HALTED", () => {
    expect(evaluatePause("HALTED").allowed).toBe(false);
  });

  it("rejects pause from CANCELLED", () => {
    expect(evaluatePause("CANCELLED").allowed).toBe(false);
  });

  it("treats a missing subscription as not pausable", () => {
    expect(evaluatePause(null).allowed).toBe(false);
    expect(evaluatePause(undefined).allowed).toBe(false);
  });

  it("is case-insensitive about the stored status", () => {
    expect(evaluatePause("active")).toEqual({ allowed: true });
  });
});

describe("evaluateResume", () => {
  it("allows resume from PAUSED", () => {
    expect(evaluateResume("PAUSED")).toEqual({ allowed: true });
  });

  it("rejects a redundant resume from ACTIVE", () => {
    const r = evaluateResume("ACTIVE");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toMatch(/already active/i);
  });

  it("rejects resume from PENDING", () => {
    expect(evaluateResume("PENDING").allowed).toBe(false);
  });

  it("rejects resume from HALTED", () => {
    expect(evaluateResume("HALTED").allowed).toBe(false);
  });

  it("rejects resume from CANCELLED", () => {
    expect(evaluateResume("CANCELLED").allowed).toBe(false);
  });

  it("treats a missing subscription as not resumable", () => {
    expect(evaluateResume(null).allowed).toBe(false);
  });
});

describe("isValidTransition", () => {
  it("accepts valid client-driven transitions", () => {
    expect(isValidTransition("PENDING", "ACTIVE")).toBe(true);
    expect(isValidTransition("ACTIVE", "PAUSED")).toBe(true);
    expect(isValidTransition("ACTIVE", "HALTED")).toBe(true);
    expect(isValidTransition("ACTIVE", "CANCELLED")).toBe(true);
    expect(isValidTransition("PAUSED", "ACTIVE")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(isValidTransition("ACTIVE", "PENDING")).toBe(false);
    expect(isValidTransition("PAUSED", "HALTED")).toBe(false);
    expect(isValidTransition("CANCELLED", "ACTIVE")).toBe(false);
    expect(isValidTransition("PENDING", "CANCELLED")).toBe(false);
  });
});

describe("normalizeStatus", () => {
  it("normalizes known values and is case-insensitive", () => {
    expect(normalizeStatus("active")).toBe("ACTIVE");
    expect(normalizeStatus("Paused")).toBe("PAUSED");
  });

  it("returns null for unknown/empty values", () => {
    expect(normalizeStatus("nonsense")).toBeNull();
    expect(normalizeStatus(null)).toBeNull();
    expect(normalizeStatus(undefined)).toBeNull();
  });
});
