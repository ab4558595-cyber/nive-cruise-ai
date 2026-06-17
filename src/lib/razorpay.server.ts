// Server-only Razorpay helpers. Do not import from client modules.
const RZP_BASE = "https://api.razorpay.com/v1";

function getEnv(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`${k} is not configured`);
  return v;
}

export function getRazorpayKeys() {
  return {
    keyId: getEnv("RAZORPAY_KEY_ID"),
    keySecret: getEnv("RAZORPAY_KEY_SECRET"),
  };
}

export function getRazorpayWebhookSecret(): string {
  return getEnv("RAZORPAY_WEBHOOK_SECRET");
}

export async function rzpFetch(path: string, init?: RequestInit): Promise<Response> {
  const { keyId, keySecret } = getRazorpayKeys();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return fetch(`${RZP_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      ...init?.headers,
    },
  });
}

/** Verifies the HMAC signature returned by Razorpay Checkout (handler success). */
export async function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const { keySecret } = getRazorpayKeys();
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Verifies the X-Razorpay-Signature header on webhook deliveries. */
export async function verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
  const secret = getRazorpayWebhookSecret();
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
