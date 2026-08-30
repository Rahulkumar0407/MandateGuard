import "server-only";

import { getMerchantOfferService } from "@/lib/merchant/service";
import type { MerchantAnalysisState } from "@/lib/merchant-intelligence/buyability-types";

export const SESSION_COOKIE = "mg_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// Session payload stored in an httpOnly cookie. `merchantId` is set by the
// server at sign-in and is ONLY used to identify the session — never to fetch
// data. All merchant data is resolved server-side from the active merchant.
export interface SessionData {
  merchantId: string;
  name: string;
  email: string;
  isSample: boolean;
  onboardingComplete: boolean;
}

export interface PublicSession {
  name: string;
  email: string;
  isSample: boolean;
  onboardingComplete: boolean;
}

export interface ResolvedMerchant {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface SessionResolution {
  authenticated: boolean;
  session?: PublicSession;
  merchant: ResolvedMerchant | null;
  offersCount: number;
  analysisState: MerchantAnalysisState | null;
}

export function serializeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

export function parseSessionCookie(
  raw: string | undefined | null,
): SessionData | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof json !== "object" || json === null) return null;
    const d = json as Partial<SessionData>;
    if (typeof d.merchantId !== "string" || typeof d.email !== "string") {
      return null;
    }
    return {
      merchantId: d.merchantId,
      name: typeof d.name === "string" ? d.name : d.email,
      email: d.email,
      isSample: Boolean(d.isSample),
      onboardingComplete: Boolean(d.onboardingComplete),
    };
  } catch {
    return null;
  }
}

// Resolves the current merchant strictly server-side from the active merchant
// record. The cookie's `merchantId` is intentionally NOT used to load data —
// it only labels the session. This enforces "never trust merchantId from the
// browser": a tampered cookie cannot make the dashboard read another merchant.
export async function resolveSession(
  rawCookie: string | undefined | null,
): Promise<SessionResolution> {
  const data = parseSessionCookie(rawCookie);
  if (!data) {
    return {
      authenticated: false,
      merchant: null,
      offersCount: 0,
      analysisState: null,
    };
  }

  const merchantService = getMerchantOfferService();
  const profile = await merchantService.getMerchantProfile();
  if (!profile) {
    return {
      authenticated: false,
      merchant: null,
      offersCount: 0,
      analysisState: null,
    };
  }

  const offers = await merchantService.listOffers();
  const offersCount = offers.length;
  const analysisState: MerchantAnalysisState =
    offersCount === 0 ? "NOT_CONFIGURED" : "READY_TO_ANALYZE";

  return {
    authenticated: true,
    session: {
      name: data.name,
      email: data.email,
      isSample: data.isSample,
      onboardingComplete: data.onboardingComplete,
    },
    merchant: profile.merchant,
    offersCount,
    analysisState,
  };
}
