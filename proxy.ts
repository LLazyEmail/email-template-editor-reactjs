import { NextResponse, type NextRequest } from "next/server";
import { apiOriginsFor, buildContentSecurityPolicy } from "./src/security/contentSecurityPolicy";
import { COLOR_SCHEME_HINT } from "./src/shell/themeMode";

/**
 * Sets a nonce-based Content-Security-Policy on every page response.
 * Next.js reads the policy from the request headers and adds the nonce to its own scripts;
 * for that the pages must render per request (see `dynamic` in app/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  // Behind a reverse proxy, the browser-facing protocol and host come from X-Forwarded-*.
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto ? `${forwardedProto}:` : request.nextUrl.protocol;
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    request.nextUrl.host;

  const policy = buildContentSecurityPolicy({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    apiOrigins: apiOriginsFor({
      protocol,
      hostname: new URL(`http://${host}`).hostname,
      nodeEnv: process.env.NODE_ENV,
      envUrl: process.env.NEXT_PUBLIC_API_URL,
    }),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  // Ask Chromium browsers for the OS color scheme so the "system" theme renders right on the
  // server. Critical-CH makes the first visit retry once with the hint instead of rendering light.
  response.headers.set("Accept-CH", COLOR_SCHEME_HINT);
  response.headers.set("Critical-CH", COLOR_SCHEME_HINT);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: static assets need no policy, and prefetches reuse the page's.
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
