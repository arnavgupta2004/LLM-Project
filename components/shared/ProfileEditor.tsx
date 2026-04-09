"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProfileEditorProps {
  initialProfile: {
    fullName: string;
    email: string;
    role: string;
    bio: string;
    age: string;
    branch: string;
    avatarUrl: string;
  };
}

export default function ProfileEditor({ initialProfile }: ProfileEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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

    const metadata = {
      ...user.user_metadata,
      full_name: form.fullName.trim(),
      bio: form.bio.trim(),
      age: form.age.trim(),
      branch: form.branch.trim(),
      avatar_url: form.avatarUrl.trim(),
    };

    const { error: authError } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (authError) {
      setSaving(false);
      setError(authError.message);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName.trim(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    setMessage("Profile updated successfully.");
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { avatarUrl?: string; error?: string };

      if (!response.ok || !data.avatarUrl) {
        throw new Error(data.error ?? "Failed to upload avatar.");
      }

      updateField("avatarUrl", data.avatarUrl);
      setMessage("Profile photo uploaded. Save changes to apply it to your account.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload profile photo."
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  const avatarPreview = form.avatarUrl.trim();
  const initials = form.fullName
    ? form.fullName
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : form.role[0]?.toUpperCase() ?? "U";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-600">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Update the details shown across your dashboard. Your name syncs with the
          rest of the platform automatically.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-slate-200">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Keep your profile up to date so classmates and faculty can identify you quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Full Name">
                <Input
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Enter your full name"
                  className="h-11 bg-slate-50"
                />
              </Field>

              <Field label="Email">
                <Input value={form.email} disabled className="h-11 bg-slate-100 text-slate-500" />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Age">
                  <Input
                    type="number"
                    min="0"
                    value={form.age}
                    onChange={(event) => updateField("age", event.target.value)}
                    placeholder="e.g. 21"
                    className="h-11 bg-slate-50"
                  />
                </Field>
                <Field label="Branch / Department">
                  <Input
                    value={form.branch}
                    onChange={(event) => updateField("branch", event.target.value)}
                    placeholder="e.g. CSE"
                    className="h-11 bg-slate-50"
                  />
                </Field>
              </div>

              <Field label="Bio">
                <Textarea
                  value={form.bio}
                  onChange={(event) => updateField("bio", event.target.value)}
                  placeholder="Write a short introduction about yourself"
                  className="min-h-28 bg-slate-50"
                />
              </Field>

              <Field label="Profile Photo">
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Upload from your device
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        JPG, PNG, or WEBP up to 5 MB.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "#1a2b5e" }}>
                      {uploadingAvatar ? "Uploading..." : "Choose photo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                      />
                    </label>
                  </div>
                  {form.avatarUrl && (
                    <p className="mt-3 truncate text-xs text-slate-500">
                      Uploaded photo ready to save.
                    </p>
                  )}
                </div>
              </Field>

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
                  type="submit"
                  disabled={saving}
                  className="h-11 rounded-xl px-5"
                  style={{ background: "#1a2b5e" }}
                >
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-white">Profile Preview</CardTitle>
            <CardDescription className="text-slate-300">
              This is how your account details will feel inside the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4 rounded-2xl bg-white/8 p-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-amber-400/20 text-lg font-bold text-amber-300">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={form.fullName || form.role}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">
                  {form.fullName || "Your name"}
                </p>
                <p className="text-sm capitalize text-slate-300">{form.role}</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-white/6 p-4 text-sm">
              <InfoRow label="Branch" value={form.branch || "Add your branch"} />
              <InfoRow label="Age" value={form.age || "Add your age"} />
              <InfoRow label="Email" value={form.email} />
            </div>

            <div className="rounded-2xl bg-white/6 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Bio
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                {form.bio || "Tell people a little about your academic interests, goals, or teaching focus."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-black/10 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right text-slate-100">{value}</span>
    </div>
  );
}
