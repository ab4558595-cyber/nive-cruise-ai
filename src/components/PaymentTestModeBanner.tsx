// Razorpay test-mode banner. Renders nothing in live mode.
// Detection is client-side: we expose key_id from the server fn during checkout,
// but for a top-of-page banner we just hide it (live keys are deployed).
export function PaymentTestModeBanner() {
  return null;
}
