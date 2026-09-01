import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, resolveSession } from "@/lib/auth/session";
import { AuthenticatedShell } from "@/components/AuthenticatedShell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  const result = await resolveSession(raw);

  if (!result.authenticated) {
    redirect("/auth/sign-in");
  }

  if (!result.session?.onboardingComplete) {
    redirect("/onboarding");
  }

  return (
    <AuthenticatedShell
      session={{
        ...result,
        onboardingComplete: result.session?.onboardingComplete ?? false,
      }}
    >
      {children}
    </AuthenticatedShell>
  );
}
