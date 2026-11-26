import type { Metadata } from "next";
import { cookies } from "next/headers";
import "antd/dist/reset.css";
import "../src/index.css";
import AppShell from "../src/shell/AppShell";
import { THEME_COOKIE, parseThemeMode } from "../src/shell/themeMode";

// The Content-Security-Policy nonce (proxy.ts) differs per request, so pages can't be
// prerendered at build time: a static page would carry no nonce and its scripts would be blocked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Template Editor",
  description: "Visual email template editor",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read on the server so a saved dark theme is in the first paint, without a light flash.
  const themeMode = parseThemeMode((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="en" style={{ colorScheme: themeMode }}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before React hydrates.
          This only ignores attribute mismatches on <body> itself, not on its children. */}
      <body suppressHydrationWarning>
        <AppShell initialTheme={themeMode}>{children}</AppShell>
      </body>
    </html>
  );
}
