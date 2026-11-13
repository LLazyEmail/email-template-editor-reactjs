"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Input, Space, Spin, Typography } from "antd";
import type { ModelMessage } from "ai";
import { MAX_STEPS, runAgent, type AgentStatus } from "../../../ai/agent";
import { loadAiSettings, loadApiKey, saveAiSettings, type AiSettings } from "../../../ai/keyStore";
import { createModel, isProviderId, PROVIDERS, REQUEST_TIMEOUT_MS } from "../../../ai/providers";
import { createEditorTools, errorMessage, type ChangedResource } from "../../../ai/tools";
import AiSettingsModal from "./AiSettingsModal";

interface ChatPanelProps {
  onChange: (resource: ChangedResource) => void;
}

interface ChatEntry {
  id: number;
  kind: "user" | "assistant" | "tool" | "error";
  text: string;
  ok?: boolean;
}

interface PendingConfirm {
  message: string;
  resolve: (approved: boolean) => void;
}

type ErrorLike = { name?: unknown; statusCode?: unknown; cause?: unknown; errors?: unknown };

/** True if `error` or anything it wraps (`cause`, the retry `errors`) matches `test`. */
function someInErrorChain(error: unknown, test: (e: ErrorLike) => boolean, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 5) return false;
  const e = error as ErrorLike;
  if (test(e)) return true;
  if (someInErrorChain(e.cause, test, depth + 1)) return true;
  return Array.isArray(e.errors) && e.errors.some((inner) => someInErrorChain(inner, test, depth + 1));
}

const isTimeout = (error: unknown) => someInErrorChain(error, (e) => e.name === "TimeoutError");

/** 429 (rate limit / quota) or 503 (model overloaded): another model usually works right away. */
const isBusyModel = (error: unknown) =>
  someInErrorChain(error, (e) => e.statusCode === 429 || e.statusCode === 503);

function describeStatus(status: AgentStatus, providerLabel: string): string {
  return status.kind === "model" ? `Waiting for ${providerLabel}…` : `Running ${status.toolName}…`;
}

function initialSettings(): AiSettings {
  const saved = loadAiSettings();
  const provider = isProviderId(saved.provider) ? saved.provider : "google";
  const model =
    typeof saved.model === "string" && saved.model ? saved.model : PROVIDERS[provider].defaultModel;
  return { provider, model };
}

/**
 * Chat with an LLM that edits the template through tools. All model output is rendered
 * as plain text (never as HTML): it can echo node content, which is untrusted.
 */
const ChatPanel = ({ onChange }: ChatPanelProps) => {
  const [settings, setSettings] = useState<AiSettings>({ provider: "google", model: "" });
  const [hasKey, setHasKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const historyRef = useRef<ModelMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const nextIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Browser storage is read after mount so server and client render the same markup.
  useEffect(() => {
    const loaded = initialSettings();
    setSettings(loaded);
    setHasKey(Boolean(loadApiKey(loaded.provider)));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: "end" });
  }, [entries, pendingConfirm]);

  const append = useCallback((entry: Omit<ChatEntry, "id">) => {
    const id = nextIdRef.current++;
    setEntries((current) => [...current, { ...entry, id }]);
  }, []);

  const onSettingsChange = (next: AiSettings) => {
    setSettings(next);
    saveAiSettings(next);
    setHasKey(Boolean(loadApiKey(next.provider)));
  };

  const confirm = useCallback(
    (message: string) =>
      new Promise<boolean>((resolve) => {
        const signal = abortRef.current?.signal;
        if (signal?.aborted) return resolve(false);
        const settle = (approved: boolean) => {
          signal?.removeEventListener("abort", onAbort);
          setPendingConfirm(null);
          resolve(approved);
        };
        const onAbort = () => settle(false);
        signal?.addEventListener("abort", onAbort);
        setPendingConfirm({ message, resolve: settle });
      }),
    []
  );

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const stored = loadApiKey(settings.provider);
    if (!stored) {
      setHasKey(false);
      setSettingsOpen(true);
      return;
    }

    const messages: ModelMessage[] = [...historyRef.current, { role: "user", content: text }];
    append({ kind: "user", text });
    setInput("");
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await runAgent({
        model: createModel({ ...settings, apiKey: stored.apiKey }),
        messages,
        tools: createEditorTools({
          confirm,
          onChange,
          onToolEvent: (event) => append({ kind: "tool", text: event.summary, ok: event.ok }),
        }),
        abortSignal: controller.signal,
        locale: navigator.language,
        onStatus: setStatus,
      });
      historyRef.current = [...messages, ...result.responseMessages];
      if (result.text) append({ kind: "assistant", text: result.text });
      if (result.hitStepLimit) {
        append({
          kind: "error",
          text: `Stopped after ${MAX_STEPS} steps; the task may be unfinished. Send "continue" to go on.`,
        });
      }
    } catch (error) {
      console.error("AI assistant request failed", error);
      const providerLabel = PROVIDERS[settings.provider].label;
      // After retries the SDK wraps the provider error ("Failed after 2 attempts. Last error: …").
      const lastError = (error as { lastError?: unknown } | null)?.lastError;
      let text = errorMessage(lastError ?? error);
      if (controller.signal.aborted) text = "Stopped.";
      else if (isTimeout(error)) {
        text = `${providerLabel} did not respond within ${REQUEST_TIMEOUT_MS / 1000} s. Check your connection, VPN or proxy: the API may be unreachable from your network.`;
      } else if (isBusyModel(error)) {
        text += ` You can also pick another model in Settings (now: ${settings.model}).`;
      }
      append({ kind: "error", text });
    } finally {
      abortRef.current = null;
      setBusy(false);
      setStatus(null);
    }
  };

  const stop = () => abortRef.current?.abort();

  const clearChat = () => {
    historyRef.current = [];
    setEntries([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Text type="secondary">
          {PROVIDERS[settings.provider].label} · {settings.model}
        </Typography.Text>
        <Space>
          <Button size="small" onClick={clearChat} disabled={busy || entries.length === 0}>
            Clear
          </Button>
          <Button size="small" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </Space>
      </div>

      {!hasKey ? (
        <Alert
          type="warning"
          showIcon
          message="Add your API key to start"
          action={
            <Button size="small" type="primary" onClick={() => setSettingsOpen(true)}>
              Add key
            </Button>
          }
        />
      ) : null}

      <div style={{ flex: 1, overflowY: "auto" }} aria-live="polite">
        {entries.length === 0 ? (
          <Typography.Paragraph type="secondary">
            Ask me to change the template, e.g. “Add a heading node that says Welcome under the
            root” or “Generate the template”.
          </Typography.Paragraph>
        ) : null}
        {entries.map((entry) => (
          <ChatMessage key={entry.id} entry={entry} />
        ))}
        {pendingConfirm ? (
          <Alert
            type="warning"
            message={pendingConfirm.message}
            action={
              <Space direction="vertical">
                <Button size="small" danger onClick={() => pendingConfirm.resolve(true)}>
                  Delete
                </Button>
                <Button size="small" onClick={() => pendingConfirm.resolve(false)}>
                  Cancel
                </Button>
              </Space>
            }
          />
        ) : null}
        {busy && !pendingConfirm ? (
          <Space style={{ margin: 8 }}>
            <Spin size="small" />
            <Typography.Text type="secondary">
              {status ? describeStatus(status, PROVIDERS[settings.provider].label) : "Working…"}
            </Typography.Text>
          </Space>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <Input.TextArea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onPressEnter={(event) => {
          if (!event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder="Message the assistant (Enter to send, Shift+Enter for a new line)"
        aria-label="Message"
        disabled={busy}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {busy ? <Button onClick={stop}>Stop</Button> : null}
        <Button type="primary" onClick={send} disabled={busy || !input.trim()}>
          Send
        </Button>
      </div>

      <AiSettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onChange={onSettingsChange}
      />
    </div>
  );
};

const ChatMessage = ({ entry }: { entry: ChatEntry }) => {
  if (entry.kind === "error") {
    return <Alert type="error" message={entry.text} style={{ marginBottom: 8 }} />;
  }
  if (entry.kind === "tool") {
    return (
      <Typography.Paragraph
        type={entry.ok ? "success" : "danger"}
        style={{ fontSize: 12, marginBottom: 8 }}
      >
        {entry.ok ? "✓" : "✗"} {entry.text}
      </Typography.Paragraph>
    );
  }
  const isUser = entry.kind === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <Typography.Paragraph
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxWidth: "85%",
          padding: "6px 10px",
          borderRadius: 8,
          background: isUser ? "#e6f4ff" : "#f5f5f5",
          marginBottom: 8,
        }}
      >
        {entry.text}
      </Typography.Paragraph>
    </div>
  );
};

export default ChatPanel;
