import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test } from "vitest";
import AppShell from "./AppShell";
import ThemeToggle from "./ThemeToggle";
import {
  parseColorSchemeHint,
  parseThemePreference,
  resolveThemeMode,
  themeCookie,
} from "./themeMode";

/** Stands in for the OS: `setDark` flips prefers-color-scheme and notifies listeners. */
const mockSystemScheme = (initiallyDark: boolean) => {
  let dark = initiallyDark;
  // antd's breakpoint observer (Layout.Sider) also listens; it reads `matches` from the event.
  const listeners = new Set<{ query: string; listener: (event: { matches: boolean }) => void }>();
  const matches = (query: string) => query.includes("prefers-color-scheme: dark") && dark;
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return matches(query);
      },
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        listeners.add({ query, listener }),
      removeEventListener: (_: string, listener: (event: { matches: boolean }) => void) =>
        listeners.forEach((entry) => entry.listener === listener && listeners.delete(entry)),
    }) as unknown as MediaQueryList;
  return {
    setDark: (value: boolean) => {
      dark = value;
      act(() => listeners.forEach(({ query, listener }) => listener({ matches: matches(query) })));
    },
  };
};

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  mockSystemScheme(false);
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  document.cookie = "theme=; path=/; max-age=0";
  document.documentElement.style.colorScheme = "";
});

const renderShell = (preference: "system" | "light" | "dark", systemMode: "light" | "dark") =>
  render(
    <AppShell initialPreference={preference} initialSystemMode={systemMode}>
      <ThemeToggle />
    </AppShell>,
  );

const colorScheme = () => document.documentElement.style.colorScheme;

test("shows the editor link and a disabled templates entry marked as coming soon", () => {
  render(
    <AppShell initialPreference="system" initialSystemMode="light">
      page
    </AppShell>,
  );

  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(nav).toHaveTextContent("Editor");
  expect(screen.getByRole("link", { name: "Editor" })).toHaveAttribute("href", "/");

  const templates = screen.getByRole("menuitem", { name: /Templates/ });
  expect(templates).toHaveAttribute("aria-disabled", "true");
  expect(templates).toHaveTextContent("Coming soon");
  expect(screen.getByText("page")).toBeInTheDocument();
});

test("a saved choice wins over the OS", () => {
  mockSystemScheme(true);
  renderShell("light", "dark");
  expect(screen.getByRole("button", { name: "Theme: Light" })).toBeInTheDocument();
  expect(colorScheme()).toBe("light");
});

test("system follows the OS, including later changes", () => {
  const os = mockSystemScheme(true);
  // The server saw no hint (light); the browser corrects it after hydration.
  renderShell("system", "light");
  expect(screen.getByRole("button", { name: "Theme: System" })).toBeInTheDocument();
  expect(colorScheme()).toBe("dark");

  os.setDark(false);
  expect(colorScheme()).toBe("light");
});

test("picking a theme in the header menu applies it and remembers it in a cookie", async () => {
  const user = userEvent.setup();
  renderShell("system", "light");

  await user.click(screen.getByRole("button", { name: "Theme: System" }));
  await user.click(await screen.findByRole("menuitem", { name: /Dark/ }));
  expect(screen.getByRole("button", { name: "Theme: Dark" })).toBeInTheDocument();
  expect(document.cookie).toContain("theme=dark");
  expect(colorScheme()).toBe("dark");

  await user.click(screen.getByRole("button", { name: "Theme: Dark" }));
  await user.click(await screen.findByRole("menuitem", { name: /System/ }));
  expect(document.cookie).toContain("theme=system");
  expect(colorScheme()).toBe("light");
});

test("the toggle renders nothing outside the app shell", () => {
  const { container } = render(<ThemeToggle />);
  expect(container).toBeEmptyDOMElement();
});

test("theme helpers parse the cookie and the client hint", () => {
  expect(parseThemePreference("dark")).toBe("dark");
  expect(parseThemePreference("light")).toBe("light");
  expect(parseThemePreference(undefined)).toBe("system");
  expect(parseThemePreference("purple")).toBe("system");

  expect(parseColorSchemeHint('"dark"')).toBe("dark");
  expect(parseColorSchemeHint('"light"')).toBe("light");
  expect(parseColorSchemeHint(null)).toBe("light");

  expect(resolveThemeMode("system", "dark")).toBe("dark");
  expect(resolveThemeMode("light", "dark")).toBe("light");
  expect(themeCookie("system")).toMatch(/^theme=system; path=\/; max-age=\d+; SameSite=Lax$/);
});
