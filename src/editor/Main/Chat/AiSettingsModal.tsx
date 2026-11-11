"use client";

import React, { useEffect, useState } from "react";
import { Alert, AutoComplete, Button, Form, Input, Modal, Radio, Select, Typography } from "antd";
import { PROVIDER_IDS, PROVIDERS, type ProviderId } from "../../../ai/providers";
import {
  clearApiKey,
  loadApiKey,
  saveApiKey,
  type AiSettings,
  type KeyPersistence,
} from "../../../ai/keyStore";
import "./AiSettingsModal.css";

interface AiSettingsModalProps {
  open: boolean;
  settings: AiSettings;
  onClose: () => void;
  /** Called after the settings (and possibly the key) were saved or the key was removed. */
  onChange: (settings: AiSettings) => void;
}

interface FormValues {
  provider: ProviderId;
  model: string;
  apiKey?: string;
  persistence: KeyPersistence;
}

const PERSISTENCE_OPTIONS: { value: KeyPersistence; label: string; hint: string }[] = [
  { value: "memory", label: "This page only", hint: "Forgotten when the page reloads." },
  { value: "session", label: "This tab", hint: "Forgotten when the tab is closed." },
  {
    value: "local",
    label: "Remember on this device",
    hint: "Kept in this browser until you remove it. Avoid on shared computers.",
  },
];

const AiSettingsModal = ({ open, settings, onClose, onChange }: AiSettingsModalProps) => {
  const [form] = Form.useForm<FormValues>();
  const provider: ProviderId = Form.useWatch("provider", form) ?? settings.provider;
  const persistence: KeyPersistence = Form.useWatch("persistence", form) ?? "session";
  const [storedKey, setStoredKey] = useState(() => loadApiKey(settings.provider));
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    const stored = loadApiKey(settings.provider);
    setStoredKey(stored);
    setError(null);
    setShowKey(false);
    form.setFieldsValue({
      provider: settings.provider,
      model: settings.model,
      apiKey: "",
      persistence: stored?.persistence ?? "session",
    });
  }, [open, settings, form]);

  const onProviderChange = (next: ProviderId) => {
    const stored = loadApiKey(next);
    setStoredKey(stored);
    form.setFieldsValue({
      model: PROVIDERS[next].defaultModel,
      apiKey: "",
      persistence: stored?.persistence ?? "session",
    });
  };

  const onFinish = (values: FormValues) => {
    const apiKey = values.apiKey?.trim() || storedKey?.apiKey;
    if (!apiKey) {
      setError("Enter an API key.");
      return;
    }
    if (!saveApiKey(values.provider, apiKey, values.persistence)) {
      setError("This browser blocks site storage. Choose “This page only”.");
      return;
    }
    onChange({ provider: values.provider, model: values.model.trim() });
    onClose();
  };

  const onRemoveKey = () => {
    clearApiKey(provider);
    setStoredKey(null);
    form.setFieldValue("apiKey", "");
    onChange({ provider, model: form.getFieldValue("model") ?? PROVIDERS[provider].defaultModel });
  };

  const info = PROVIDERS[provider];

  return (
    <Modal title="AI assistant settings" open={open} onCancel={onClose} footer={null} destroyOnClose>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Your key stays in this browser"
        description={`It is sent only to ${info.label}, never to the editor's server. Anyone who can run scripts on this page or in your browser extensions could read it, so use a key with a spending limit and revoke it if in doubt.`}
      />
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
          <Select
            onChange={onProviderChange}
            options={PROVIDER_IDS.map((id) => ({ value: id, label: PROVIDERS[id].label }))}
          />
        </Form.Item>
        <Form.Item name="model" label="Model" rules={[{ required: true, whitespace: true }]}>
          <AutoComplete options={info.models.map((model) => ({ value: model }))} />
        </Form.Item>
        <Form.Item
          name="apiKey"
          label="API key"
          extra={
            <>
              {storedKey ? "A key is saved. Leave empty to keep it. " : null}
              <Typography.Link href={info.keyUrl} target="_blank" rel="noreferrer">
                Get a {info.label} key
              </Typography.Link>
            </>
          }
        >
          {/*
            Deliberately not type="password": Chrome would treat this as a login form, show saved
            logins over the Model field, and offer to save the API key in the password manager.
            The characters are masked with CSS instead (see AiSettingsModal.css).
          */}
          <Input
            className={showKey ? undefined : "ai-api-key--masked"}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            placeholder={storedKey ? "••••••••••••" : "Paste your API key"}
            suffix={
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: "auto" }}
                onClick={() => setShowKey((shown) => !shown)}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
            }
          />
        </Form.Item>
        <Form.Item
          name="persistence"
          label="Keep the key"
          extra={PERSISTENCE_OPTIONS.find((option) => option.value === persistence)?.hint}
        >
          <Radio.Group>
            {PERSISTENCE_OPTIONS.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        {error ? <Alert type="error" message={error} style={{ marginBottom: 16 }} /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <Button danger disabled={!storedKey} onClick={onRemoveKey}>
            Remove key
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default AiSettingsModal;
