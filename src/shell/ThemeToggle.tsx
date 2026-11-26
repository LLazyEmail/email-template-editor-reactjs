"use client";

import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import React, { createContext, useContext } from "react";
import type { ThemeMode } from "./themeMode";

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Provided by AppShell; null outside it (e.g. a component rendered alone in a test). */
export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

/** Sun/moon icon button that flips the app between light and dark. */
const ThemeToggle = () => {
  const context = useContext(ThemeModeContext);
  if (!context) return null;

  const dark = context.mode === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  return (
    <Tooltip title={label}>
      <Button
        type="text"
        aria-label="Dark theme"
        aria-pressed={dark}
        icon={dark ? <SunOutlined /> : <MoonOutlined />}
        onClick={() => context.setMode(dark ? "light" : "dark")}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
