import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";
import { LandingWrapper } from "@/components/LandingWrapper";

export default async function RootPage() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const result = await resolveSession(raw);

  if (!result.authenticated) {
    return <LandingWrapper />;
  }

  if (!result.session?.onboardingComplete) {
    redirect("/onboarding");
  }

  redirect("/overview");
}
