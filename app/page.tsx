// Minimal M0 landing page. No secrets, no AI, no fancy dashboard — just a
// status surface that reflects the current milestone scope.
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">MandateGuard</h1>
      <p className="mt-2 text-sm text-neutral-500">
        AI reasons. MandateGuard authorizes. Razorpay executes.
      </p>

      <section className="mt-8 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-medium">Milestone M0 — Razorpay Subscription Skeleton</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Foundation for the recurring-payment lifecycle. The AI buyer, merchant
          offer logic, and Semantic Offer Integrity engine are intentionally not
          implemented yet.
        </p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-medium">API surface (server-side)</h3>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li><code>POST /api/subscriptions</code> — create plan + subscription</li>
          <li><code>GET /api/subscriptions/:id</code> — subscription state</li>
          <li><code>POST /api/subscriptions/:id/pause</code> — pause</li>
          <li><code>POST /api/subscriptions/:id/resume</code> — resume</li>
          <li><code>POST /api/webhooks/razorpay</code> — verified, idempotent webhooks</li>
        </ul>
      </section>
    </main>
  );
}
