import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";
import { NewOnboardingFlow } from "@/components/onboarding/NewOnboardingFlow";

export default async function OnboardingPage() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const result = await resolveSession(raw);

  if (!result.authenticated) {
    redirect("/auth/sign-in");
  }

  if (result.session?.onboardingComplete) {
    redirect("/overview");
  }

  return (
    <NewOnboardingFlow
      merchantName={result.session?.name || result.merchant?.name || ""}
    />
  );
}
