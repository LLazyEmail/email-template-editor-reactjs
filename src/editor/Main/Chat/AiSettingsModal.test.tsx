import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearApiKey, loadApiKey, saveApiKey } from "@/ai/keyStore";
import { PROVIDER_IDS, PROVIDERS } from "@/ai/providers";
import AiSettingsModal from "./AiSettingsModal";

const settings = { provider: "google" as const, model: PROVIDERS.google.defaultModel };

const renderModal = () => {
  const onChange = vi.fn();
  const onClose = vi.fn();
  render(<AiSettingsModal open settings={settings} onChange={onChange} onClose={onClose} />);
  return { onChange, onClose, dialog: screen.getByRole("dialog") };
};

beforeEach(() => {
  PROVIDER_IDS.forEach(clearApiKey);
  sessionStorage.clear();
  localStorage.clear();
});

describe("AiSettingsModal", () => {
  it("asks for a key when none is saved", async () => {
    const user = userEvent.setup();
    const { onChange, dialog } = renderModal();

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await within(dialog).findByText("Enter an API key.")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("saves the key for this tab by default", async () => {
    const user = userEvent.setup();
    const { onChange, onClose, dialog } = renderModal();

    await user.type(within(dialog).getByLabelText("API key"), "  sk-test  ");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(settings));
    expect(onClose).toHaveBeenCalled();
    expect(loadApiKey("google")).toEqual(
      expect.objectContaining({ apiKey: "sk-test", persistence: "session" }),
    );
  });

  it("remembers the key on this device when asked", async () => {
    const user = userEvent.setup();
    const { onChange, dialog } = renderModal();

    await user.type(within(dialog).getByLabelText("API key"), "sk-local");
    await user.click(within(dialog).getByLabelText("Remember on this device"));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(loadApiKey("google")).toEqual(
      expect.objectContaining({ apiKey: "sk-local", persistence: "local" }),
    );
  });

  it("keeps a saved key when the field is left empty, and removes it on request", async () => {
    saveApiKey("google", "sk-saved", "session");
    const user = userEvent.setup();
    const { onChange, dialog } = renderModal();

    expect(within(dialog).getByText(/A key is saved/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Remove key" }));

    expect(loadApiKey("google")).toBeNull();
    expect(onChange).toHaveBeenCalledWith(settings);
    expect(within(dialog).getByRole("button", { name: "Remove key" })).toBeDisabled();
  });

  it("switches the model to the new provider's default", async () => {
    const user = userEvent.setup();
    const { dialog } = renderModal();

    await user.click(within(dialog).getAllByRole("combobox")[0]);
    await user.click(await screen.findByTitle(PROVIDERS.anthropic.label));

    await waitFor(() =>
      expect(within(dialog).getByLabelText("Model")).toHaveValue(PROVIDERS.anthropic.defaultModel),
    );
    expect(within(dialog).getByText(`Get a ${PROVIDERS.anthropic.label} key`)).toBeInTheDocument();
  });
});
