"use client";

import { DesktopOutlined, MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Dropdown, Tooltip } from "antd";
import type { MenuProps } from "antd";
import React from "react";
import type { ThemePreference } from "./themeMode";

interface ThemeToggleProps {
  preference: ThemePreference;
  onChange: (preference: ThemePreference) => void;
}

const OPTIONS: Record<ThemePreference, { label: string; icon: React.ReactNode }> = {
  system: { label: "System", icon: <DesktopOutlined /> },
  light: { label: "Light", icon: <SunOutlined /> },
  dark: { label: "Dark", icon: <MoonOutlined /> },
};

const items: MenuProps["items"] = (Object.keys(OPTIONS) as ThemePreference[]).map((key) => ({
  key,
  ...OPTIONS[key],
}));

/** App header button with a System / Light / Dark menu. */
const ThemeToggle = ({ preference, onChange }: ThemeToggleProps) => {
  const current = OPTIONS[preference];
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items,
        selectable: true,
        selectedKeys: [preference],
        onClick: ({ key }) => onChange(key as ThemePreference),
      }}
    >
      <Tooltip title={`Theme: ${current.label}`} placement="left">
        <Button type="text" aria-label={`Theme: ${current.label}`} icon={current.icon} />
      </Tooltip>
    </Dropdown>
  );
};

export default ThemeToggle;
