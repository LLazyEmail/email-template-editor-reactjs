import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import AppShell from "./AppShell";
import ThemeToggle from "./ThemeToggle";
import { parseThemeMode, themeCookie } from "./themeMode";

afterEach(() => {
  document.cookie = "theme=; path=/; max-age=0";
});

test("shows the editor link and a disabled templates entry marked as coming soon", () => {
  render(<AppShell initialTheme="light">page</AppShell>);

  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(nav).toHaveTextContent("Editor");
  expect(screen.getByRole("link", { name: "Editor" })).toHaveAttribute("href", "/");

  const templates = screen.getByRole("menuitem", { name: /Templates/ });
  expect(templates).toHaveAttribute("aria-disabled", "true");
  expect(templates).toHaveTextContent("Coming soon");
  expect(screen.getByText("page")).toBeInTheDocument();
});

test("the header toggle reflects the initial theme", () => {
  render(
    <AppShell initialTheme="dark">
      <ThemeToggle />
    </AppShell>,
  );
  expect(screen.getByRole("button", { name: "Dark theme" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("the header toggle changes the theme and remembers it in a cookie", async () => {
  const user = userEvent.setup();
  render(
    <AppShell initialTheme="light">
      <ThemeToggle />
    </AppShell>,
  );
  const toggle = screen.getByRole("button", { name: "Dark theme" });
  expect(toggle).toHaveAttribute("aria-pressed", "false");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(document.cookie).toContain("theme=dark");
  expect(document.documentElement.style.colorScheme).toBe("dark");

  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(document.cookie).toContain("theme=light");
});

test("the toggle renders nothing outside the app shell", () => {
  const { container } = render(<ThemeToggle />);
  expect(container).toBeEmptyDOMElement();
});

test("parseThemeMode falls back to light for anything but dark", () => {
  expect(parseThemeMode("dark")).toBe("dark");
  expect(parseThemeMode("light")).toBe("light");
  expect(parseThemeMode(undefined)).toBe("light");
  expect(parseThemeMode("purple")).toBe("light");
  expect(themeCookie("dark")).toMatch(/^theme=dark; path=\/; max-age=\d+; SameSite=Lax$/);
});
