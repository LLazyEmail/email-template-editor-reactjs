"use client";

import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import React, { createContext, useContext } from "react";
import type { ThemePreference } from "./themeMode";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

/** Provided by AppShell; null outside it (e.g. a component rendered alone in a test). */
export const ThemeContext = createContext<ThemeContextValue | null>(null);

const OPTIONS: Record<ThemePreference, { label: string; icon: React.ReactNode }> = {
  system: { label: "System", icon: <DesktopOutlined /> },
  light: { label: "Light", icon: <SunOutlined /> },
  dark: { label: "Dark", icon: <MoonOutlined /> },
};

const items: MenuProps["items"] = (Object.keys(OPTIONS) as ThemePreference[]).map((key) => ({
  key,
  ...OPTIONS[key],
}));

/** Header button with a System / Light / Dark menu. */
const ThemeToggle = () => {
  const context = useContext(ThemeContext);
  if (!context) return null;

  const current = OPTIONS[context.preference];
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items,
        selectable: true,
        selectedKeys: [context.preference],
        onClick: ({ key }) => context.setPreference(key as ThemePreference),
      }}
    >
      <Tooltip title={`Theme: ${current.label}`} placement="left">
        <Button type="text" aria-label={`Theme: ${current.label}`} icon={current.icon} />
      </Tooltip>
    </Dropdown>
  );
};

export default ThemeToggle;
