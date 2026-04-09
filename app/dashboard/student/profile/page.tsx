import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ProfileEditor from "@/components/shared/ProfileEditor";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/auth");

  return (
    <div className="h-full overflow-y-auto">
      <ProfileEditor
        initialProfile={{
          fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
          email: profile?.email ?? user.email ?? "",
          role: "student",
          bio: user.user_metadata?.bio ?? "",
          age: user.user_metadata?.age ?? "",
          branch: user.user_metadata?.branch ?? "",
          avatarUrl: user.user_metadata?.avatar_url ?? "",
        }}
      />
    </div>
  );
}
