import React from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Preview from "./Preview";

test("renders the email in a fully sandboxed iframe", () => {
  render(
    <Preview
      tree={[
        {
          title: "root",
          value: "<h1>{{name}}</h1>",
          children: [{ title: "{{name}}", value: "Welcome" }],
        },
      ]}
    />
  );

  const frame = screen.getByTitle("Email preview");
  expect(frame).toHaveAttribute("srcdoc", "<h1>Welcome</h1>");
  // An empty sandbox: no scripts, same-origin access, forms, popups or navigation.
  expect(frame).toHaveAttribute("sandbox", "");
});

test("shows a hint instead of an empty frame when there is no template yet", () => {
  render(<Preview tree={[]} />);

  expect(screen.getByText(/add a root element to see the preview/i)).toBeInTheDocument();
  expect(screen.queryByTitle("Email preview")).not.toBeInTheDocument();
});
