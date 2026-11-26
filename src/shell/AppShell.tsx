"use client";

import { EditOutlined, TableOutlined } from "@ant-design/icons";
import { ConfigProvider, Layout, Menu, Tag, Tooltip, theme } from "antd";
import type { MenuProps, ThemeConfig } from "antd";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { ThemeModeContext } from "./ThemeToggle";
import { type ThemeMode, themeCookie } from "./themeMode";
import "./AppShell.css";

interface AppShellProps {
  initialTheme: ThemeMode;
  children: React.ReactNode;
}

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
const AppShell = ({ initialTheme, children }: AppShellProps) => {
  const [mode, setMode] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    // Static notification.* calls render outside this tree; give them the same theme.
    ConfigProvider.config({
      holderRender: (node) => <ConfigProvider theme={themeConfig(mode)}>{node}</ConfigProvider>,
    });
  }, [mode]);

  // The toggle itself lives in the page header (ThemeToggle); it reaches the mode via context.
  const themeMode = useMemo(
    () => ({
      mode,
      setMode: (next: ThemeMode) => {
        setMode(next);
        document.cookie = themeCookie(next);
      },
    }),
    [mode],
  );

  return (
    <ConfigProvider theme={themeConfig(mode)}>
      <ThemeModeContext.Provider value={themeMode}>
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
      </ThemeModeContext.Provider>
    </ConfigProvider>
  );
};

export default AppShell;
