import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock next/navigation usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/overview",
  useRouter: () => ({ push: vi.fn() }),
}));

// Must import after mock
import { NavbarV2 } from "@/components/NavbarV2";

const mockSession = {
  authenticated: true,
  session: { name: "Test Biz", email: "test@biz.com", isSample: false, onboardingComplete: true },
  merchant: { name: "Test Biz" },
  onboardingComplete: true,
};

const sampleSession = {
  authenticated: true,
  session: { name: "Sample Biz", email: "sample@biz.com", isSample: true, onboardingComplete: true },
  merchant: { name: "Sample Biz" },
  onboardingComplete: true,
};

describe("M31 — Navigation Final Fix: ONE navigation system", () => {
  it("renders single shared NAV_ITEMS for desktop and mobile", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    // Both navs should contain same four items
    const overviewCount = (html.match(/Overview/g) || []).length;
    const offerCount = (html.match(/Offer/g) || []).length;
    // Each appears twice: once in desktop nav, once in mobile bottom dock (and possibly expanded menu hidden)
    expect(overviewCount).toBeGreaterThanOrEqual(2);
    expect(offerCount).toBeGreaterThanOrEqual(2);
    expect(html).toContain("AI Buyers");
    expect(html).toContain("Protection");
    // Check destinations
    expect(html).toContain('href="/overview"');
    expect(html).toContain('href="/offer"');
    expect(html).toContain('href="/ai-buyers"');
    expect(html).toContain('href="/protection"');
  });

  it("has desktop nav with hidden lg:flex and mobile bottom nav with flex lg:hidden", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(html).toContain('data-testid="desktop-nav"');
    expect(html).toContain('data-testid="mobile-bottom-nav"');
    // Desktop nav should use hidden lg:flex
    expect(html).toContain("hidden lg:flex");
    // Mobile bottom should use flex lg:hidden
    expect(html).toContain("flex lg:hidden");
    expect(html).toContain("mg-bottom-dock");
  });

  it("enforces desktop hide via CSS media query with display:none !important", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(html).toContain("@media (min-width: 1024px)");
    expect(html).toContain("display: none !important");
    expect(html).toContain("mg-bottom-dock");
    expect(html).toContain("mg-mobile-toggle");
  });

  it("does not use opacity:0 to hide navigation", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    // Bottom dock should not be hidden via opacity trick; check no opacity:0 near bottom dock
    // The html should contain display:none media query, not opacity hiding
    expect(html).not.toMatch(/mg-bottom-dock[^>]*opacity:\s*0/);
  });

  it("reflects active state via aria-current on both navs", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    // currentTab is overview for /overview, should have aria-current="page"
    const ariaCurrentCount = (html.match(/aria-current="page"/g) || []).length;
    // Should have at least 2 active indicators (desktop + mobile bottom)
    expect(ariaCurrentCount).toBeGreaterThanOrEqual(2);
  });

  it("hides Reset Demo for normal merchants, shows for sample businesses", () => {
    const htmlNormal = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    const htmlSample = renderToString(
      <NavbarV2 session={sampleSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(htmlNormal).not.toContain("Reset Demo");
    expect(htmlNormal).not.toContain('data-testid="reset-demo-btn"');
    expect(htmlSample).toContain("Reset Demo");
    expect(htmlSample).toContain('data-testid="reset-demo-btn"');
  });

  it("mobile bottom nav contains all destinations and is fixed positioned", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(html).toContain("position:fixed");
    // Icons present
    expect(html).toContain("⌂");
    expect(html).toContain("◇");
  });

  it("has no duplicate floating pill legacy style and uses sticky top header", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(html).toContain("position:sticky");
    expect(html).not.toContain("Floating Dock");
  });

  it("mobile menu toggle is hidden on desktop via lg:hidden and media query", () => {
    const html = renderToString(
      <NavbarV2 session={mockSession} onSignOut={() => {}} onSeedDemo={async () => {}} isSeeding={false} seedMessage={null} />,
    );
    expect(html).toContain('data-testid="mobile-menu-toggle"');
    expect(html).toContain("mg-mobile-toggle");
    // Check that toggle has flex lg:hidden
    const toggleIndex = html.indexOf('data-testid="mobile-menu-toggle"');
    const snippet = html.slice(Math.max(0, toggleIndex - 200), toggleIndex + 200);
    expect(snippet).toContain("lg:hidden");
  });
});
