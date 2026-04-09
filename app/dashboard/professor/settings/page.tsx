import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import SettingsPanel from "@/components/shared/SettingsPanel";

const defaultSettings = {
  emailAnnouncements: true,
  deadlineReminders: true,
  weeklySummary: true,
  profileVisibility: true,
  aiTips: true,
};

export default async function ProfessorSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "professor") redirect("/auth");

  return (
    <SettingsPanel
      role="professor"
      initialSettings={{
        ...defaultSettings,
        ...(user.user_metadata?.settings ?? {}),
      }}
    />
  );
}
