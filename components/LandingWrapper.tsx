"use client";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PublicLandingPage } from "./PublicLandingPage";

export function LandingWrapper() {
  const router = useRouter();
  const onGetStarted = useCallback(() => router.push("/auth/sign-in"), [router]);
  const onExploreDemo = useCallback(async () => {
    await fetch("/api/auth/sample", { method: "POST" });
    router.push("/overview");
    router.refresh();
  }, [router]);
  return <PublicLandingPage onGetStarted={onGetStarted} onExploreDemo={onExploreDemo} />;
}
