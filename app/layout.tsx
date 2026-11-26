import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "antd/dist/reset.css";
import "../src/index.css";
import AppShell from "../src/shell/AppShell";
import {
  COLOR_SCHEME_HINT,
  THEME_COOKIE,
  parseColorSchemeHint,
  parseThemePreference,
  resolveThemeMode,
} from "../src/shell/themeMode";

// The Content-Security-Policy nonce (proxy.ts) differs per request, so pages can't be
// prerendered at build time: a static page would carry no nonce and its scripts would be blocked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Template Editor",
  description: "Visual email template editor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved on the server so the first paint already has the right theme, without a flash.
  // "system" uses the OS hint that proxy.ts asks for; browsers without it get light until hydration.
  const preference = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  const systemMode = parseColorSchemeHint((await headers()).get(COLOR_SCHEME_HINT));
  const themeMode = resolveThemeMode(preference, systemMode);

  return (
    <html lang="en" style={{ colorScheme: themeMode }}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React hydrates.
          This only ignores attribute mismatches on <body> itself, not on its children. */}
      <body suppressHydrationWarning>
        <AppShell initialPreference={preference} initialSystemMode={systemMode}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
