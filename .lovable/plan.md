Finish Paddle payments setup so Nive AI can accept real subscriptions.

## Context
Paddle integration code is already in place (checkout buttons, webhooks, price resolution, subscription tracking). The remaining work is connecting the backend, creating products, and moving from sandbox to live.

## Steps

1. **Enable Paddle backend connection**
   - Call `enable_paddle_payments` to create the test/sandbox environment link.
   - This establishes the gateway credentials the app needs to communicate with Paddle.

2. **Create Paddle products and prices**
   - Map the four internal plans to Paddle catalog items:
     - Starter — ₹149 / 30 days
     - Pro — ₹299 / 30 days
     - Growth — ₹499 / 30 days
     - Scale — ₹1,499 / 30 days
   - Use the Paddle product-creation flow so the checkout buttons and webhook handlers resolve real price IDs.

3. **Verify sandbox checkout end-to-end**
   - Run a test checkout on the pricing page.
   - Confirm the webhook handler receives the `subscription_created` event and writes to the `subscriptions` / `user_plans` tables.

4. **Prepare for live environment**
   - Once sandbox is verified, switch client and server tokens from sandbox to live.
   - Update the webhook endpoint to handle live events (query param `env=live`).

5. **Paddle seller verification**
   - Complete Paddle's onboarding/KYC (personal PAN + personal bank account acceptable for individual seller).
   - After Paddle approves the account, live transactions are enabled.

## Technical details
- Environment tokens: `VITE_PAYMENTS_CLIENT_TOKEN`, `PADDLE_SANDBOX_API_KEY` / `PADDLE_LIVE_API_KEY`, `PAYMENTS_SANDBOX_WEBHOOK_SECRET` / `PAYMENTS_LIVE_WEBHOOK_SECRET`.
- Webhook route: `/api/public/payments/webhook?env=sandbox|live`.
- Subscription logic lives in `src/routes/api/public/payments/webhook.ts` and writes to `subscriptions` + `user_plans` tables.

## Outcome
Real customers can subscribe via Paddle checkout, subscriptions are tracked in the database, and plan access is automatically activated/deactivated based on payment status.