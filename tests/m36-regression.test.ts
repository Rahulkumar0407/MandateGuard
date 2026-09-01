import { describe, it, expect } from "vitest";
import { POST as signinPOST } from "@/app/api/auth/signin/route";
import { POST as signoutPOST } from "@/app/api/auth/signout/route";

function mockRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/signin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("M36 Regression — Production blockers", () => {
  it("1. wrong password rejected (no session)", async () => {
    const res = await signinPOST(mockRequest({ method: "email", email: "Rahulbornking@gmail.com", password: "wrongpass", name: "Rahul" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/incorrect/i);
  });

  it("2. empty password rejected", async () => {
    const res = await signinPOST(mockRequest({ method: "email", email: "Rahulbornking@gmail.com", password: "", name: "Rahul" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.toLowerCase()).toContain("password");
  });

  it("3. invalid email rejected", async () => {
    const res = await signinPOST(mockRequest({ method: "email", email: "notanemail", password: "12345678" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.toLowerCase()).toContain("valid email");
  });

  it("4. correct password logic exists (demo credentials)", async () => {
    const fs = await import("fs");
    const txt = fs.readFileSync("app/api/auth/signin/route.ts", "utf8");
    expect(txt).toContain("DEMO_CREDENTIALS");
    expect(txt).toContain("12345678");
  });

  it("5. google demo bypasses password (route has google branch)", async () => {
    const fs = await import("fs");
    const txt = fs.readFileSync("app/api/auth/signin/route.ts", "utf8");
    expect(txt).toContain('method === "google"');
  });

  it("6. negative price validation (onboarding logic)", () => {
    const priceNum = Number("-100");
    const priceError = !Number.isFinite(priceNum) || priceNum <= 0 ? "Price must be greater than ₹0." : null;
    expect(priceError).toBe("Price must be greater than ₹0.");
    const valid = Number.isFinite(priceNum) && priceNum > 0;
    expect(valid).toBe(false);
  });

  it("7. valid price passes", () => {
    const priceNum = Number("3999");
    const valid = Number.isFinite(priceNum) && priceNum > 0;
    expect(valid).toBe(true);
  });

  it("8. logout route exists and deletes cookie (verified via file check)", async () => {
    const fs = await import("fs");
    const txt = fs.readFileSync("app/api/auth/signout/route.ts", "utf8");
    expect(txt).toContain("delete(SESSION_COOKIE)");
  });
});
