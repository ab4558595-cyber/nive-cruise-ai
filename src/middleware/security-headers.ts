import { createMiddleware } from "@tanstack/react-start";
import { setResponseHeaders } from "@tanstack/react-start/server";

/**
 * Strict-but-workable security headers applied to every server response.
 *
 * CSP allows: self, Supabase, OpenRouter / Lovable AI gateway, Google Fonts.
 * Inline styles are allowed because Tailwind / shadcn inject them; inline
 * scripts are allowed for Vite's hydration shim.
 */
export const securityHeaders = createMiddleware().server(async ({ next }) => {
  const result = await next();

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com https://*.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.razorpay.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://api.razorpay.com https://*.razorpay.com https://*.razorpay.in https://*.upi.com",
    "child-src 'self' https://*.razorpay.com",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");

  setResponseHeaders({
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(self), geolocation=(), payment=(self \"https://checkout.razorpay.com\")",
    "Cross-Origin-Opener-Policy": "unsafe-none",
  });


  return result;
});
