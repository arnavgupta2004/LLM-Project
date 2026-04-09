"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SettingKey =
  | "emailAnnouncements"
  | "deadlineReminders"
  | "weeklySummary"
  | "profileVisibility"
  | "aiTips";

interface SettingsPanelProps {
  role: "student" | "professor";
  initialSettings: Record<SettingKey, boolean>;
}

const LABELS: Record<
  "student" | "professor",
  Array<{ key: SettingKey; title: string; description: string }>
> = {
  student: [
    {
      key: "deadlineReminders",
      title: "Deadline reminders",
      description: "Get nudges before assessments, tasks, and scheduled events.",
    },
    {
      key: "weeklySummary",
      title: "Weekly study summary",
      description: "Receive a compact recap of progress, upcoming work, and focus areas.",
    },
    {
      key: "aiTips",
      title: "AI study suggestions",
      description: "Show adaptive learning hints, revision ideas, and tutor prompts.",
    },
    {
      key: "profileVisibility",
      title: "Visible to classmates",
      description: "Allow your basic profile details to appear in collaborative spaces.",
    },
    {
      key: "emailAnnouncements",
      title: "Institute announcements",
      description: "Receive platform-level updates and important communication by email.",
    },
  ],
  professor: [
    {
      key: "deadlineReminders",
      title: "Calendar reminders",
      description: "Get reminders for classes, office hours, student meetings, and due dates.",
    },
    {
      key: "weeklySummary",
      title: "Weekly teaching summary",
      description: "Receive a digest of engagement, flagged questions, and course activity.",
    },
    {
      key: "aiTips",
      title: "AI teaching suggestions",
      description: "Show recommendations for intervention, analytics, and class support.",
    },
    {
      key: "profileVisibility",
      title: "Profile visible to students",
      description: "Display your public faculty profile across courses and collaboration panels.",
    },
    {
      key: "emailAnnouncements",
      title: "Platform announcements",
      description: "Receive release notes and important administration notices by email.",
    },
  ],
};

export default function SettingsPanel({
  role,
  initialSettings,
}: SettingsPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setError(userError?.message ?? "Unable to load your account.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        settings,
      },
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Settings updated successfully.");
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-600">
          Preferences
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Adjust how the platform communicates with you and how much guidance you want built into the experience.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Manage Preferences</CardTitle>
            <CardDescription>
              These controls are saved to your account and can be changed anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LABELS[role].map((item) => (
              <label
                key={item.key}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                  className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors"
                  style={{ background: settings[item.key] ? "#1a2b5e" : "#cbd5e1" }}
                  aria-pressed={settings[item.key]}
                >
                  <span
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: settings[item.key] ? "calc(100% - 1.5rem)" : "0.25rem" }}
                  />
                </button>
              </label>
            ))}

            {(message || error) && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: error ? "#fef2f2" : "#eff6ff",
                  color: error ? "#b91c1c" : "#1d4ed8",
                }}
              >
                {error ?? message}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={saveSettings}
                disabled={saving}
                className="h-11 rounded-xl px-5"
                style={{ background: "#1a2b5e" }}
              >
                {saving ? "Saving..." : "Save settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 via-white to-blue-50 shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Your Setup</CardTitle>
            <CardDescription>
              A quick summary of how the platform is currently configured for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {LABELS[role].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-2xl border border-white bg-white/80 px-4 py-3"
              >
                <div className="pr-4">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {settings[item.key] ? "Currently enabled" : "Currently disabled"}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: settings[item.key] ? "#dbeafe" : "#e2e8f0",
                    color: settings[item.key] ? "#1d4ed8" : "#475569",
                  }}
                >
                  {settings[item.key] ? "On" : "Off"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
