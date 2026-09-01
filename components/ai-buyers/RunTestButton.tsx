"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function RunTestButton({ label = "Run AI buyer test →", variant = "primary" }: { label?: string; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setDone(false);
    try {
      // Trigger buyability benchmark (GET is sufficient, but we ensure fresh via POST experiment fallback is not needed)
      // For demo, just revalidate by refreshing server data
      await fetch("/api/merchant/buyability", { cache: "no-store" });
      // slight delay to show loading feedback (meaningful status)
      await new Promise((r) => setTimeout(r, 600));
      setDone(true);
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, router]);

  const isPrimary = variant === "primary";
  return (
    <button
      onClick={handleClick}
      disabled={isRunning}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "10px 20px",
        background: isPrimary ? "linear-gradient(135deg, var(--mg-brand), var(--mg-brand-hover))" : "var(--mg-surface)",
        border: isPrimary ? "none" : "1px solid var(--mg-glass-2-border)",
        borderRadius: "10px",
        fontSize: "0.875rem",
        fontWeight: 700,
        color: isPrimary ? "white" : "var(--mg-text-secondary)",
        cursor: isRunning ? "not-allowed" : "pointer",
        opacity: isRunning ? 0.7 : 1,
        boxShadow: isPrimary ? "0 4px 12px rgba(11, 92, 255, 0.2)" : "none",
      }}
    >
      {isRunning ? "Analyzing…" : done ? "✓ Done — updated" : label}
    </button>
  );
}
