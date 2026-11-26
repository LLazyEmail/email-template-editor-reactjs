"use client";

import { EditOutlined, TableOutlined } from "@ant-design/icons";
import { ConfigProvider, Layout, Menu, Tag, Tooltip, theme } from "antd";
import type { MenuProps, ThemeConfig } from "antd";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./ThemeToggle";
import { type ThemeMode, type ThemePreference, resolveThemeMode, themeCookie } from "./themeMode";
import "./AppShell.css";

interface AppShellProps {
  /** The saved choice (cookie); "system" follows the OS. */
  initialPreference: ThemePreference;
  /** The OS scheme as the server saw it (client hint), light when unknown. */
  initialSystemMode: ThemeMode;
  children: React.ReactNode;
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

const themeConfig = (mode: ThemeMode): ThemeConfig => ({
  algorithm: mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
});

const menuItems: MenuProps["items"] = [
  {
    key: "editor",
    icon: <EditOutlined />,
    label: <Link href="/">Editor</Link>,
  },
  {
    key: "templates",
    icon: <TableOutlined />,
    disabled: true,
    label: (
      <Tooltip title="A table of saved templates is coming in a future release" placement="right">
        <span className="app-nav-soon">
          Templates <Tag className="app-nav-tag">Coming soon</Tag>
        </span>
      </Tooltip>
    ),
  },
];

/** App frame: sidebar navigation and the light/dark theme for everything inside. */
const AppShell = ({ initialPreference, initialSystemMode, children }: AppShellProps) => {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [systemMode, setSystemMode] = useState<ThemeMode>(initialSystemMode);
  const mode = resolveThemeMode(preference, systemMode);

  // Browsers without the client hint render "system" as light first; this corrects it after
  // hydration and follows later OS changes.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const sync = () => setSystemMode(query.matches ? "dark" : "light");
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    // Static notification.* calls render outside this tree; give them the same theme.
    ConfigProvider.config({
      holderRender: (node) => <ConfigProvider theme={themeConfig(mode)}>{node}</ConfigProvider>,
    });
  }, [mode]);

  // The toggle itself lives in the page header (ThemeToggle); it reaches the choice via context.
  const themeContext = useMemo(
    () => ({
      preference,
      setPreference: (next: ThemePreference) => {
        setPreference(next);
        document.cookie = themeCookie(next);
      },
    }),
    [preference],
  );

  return (
    <ConfigProvider theme={themeConfig(mode)}>
      <ThemeContext.Provider value={themeContext}>
        <Layout className="app-shell">
          {/* "light" sider and menu use the container colors, which the dark algorithm darkens. */}
          <Layout.Sider className="app-sider" theme="light" width={240} breakpoint="lg" collapsible>
            {/* Collapses to icons below the lg breakpoint; the trigger at the bottom toggles it. */}
            <nav className="app-nav" aria-label="Main navigation">
              <Menu mode="inline" selectedKeys={["editor"]} items={menuItems} />
            </nav>
          </Layout.Sider>
          {/* A div, not Layout.Content: that renders <main>, and the page has its own landmarks. */}
          <div className="app-content">{children}</div>
        </Layout>
      </ThemeContext.Provider>
    </ConfigProvider>
  );
};

export default AppShell;
