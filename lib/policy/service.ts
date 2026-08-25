import { getIntegrityService, type IntegrityService } from "@/lib/integrity/service";
import { evaluatePolicy } from "./engine";
import { DEFAULT_POLICY, type IntegrityPolicy, type PolicyResult } from "./types";

// Thin orchestration boundary: obtain the (already deterministic + semantic)
// IntegrityReport and apply the policy. No LLM, no Razorpay, no side effects.
export class PolicyService {
  constructor(
    private readonly integrity: IntegrityService,
    private readonly policy: IntegrityPolicy = DEFAULT_POLICY,
  ) {}

  async evaluateMandate(mandateId: string): Promise<PolicyResult> {
    const report = await this.integrity.evaluateMandate(mandateId);
    return evaluatePolicy(report, this.policy);
  }
}

// --- Factory / test seam (no DI framework) ------------------------------------

export function getPolicyService(): PolicyService {
  return new PolicyService(getIntegrityService(), DEFAULT_POLICY);
}

export { evaluatePolicy, DEFAULT_POLICY };
