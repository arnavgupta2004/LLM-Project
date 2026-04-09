"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import UserMenu from "@/components/shared/UserMenu";

const NAV = [
  { label: "My Courses", href: "/dashboard/student", icon: "📚" },
  { label: "To Do", href: "/dashboard/student/todo", icon: "✅" },
  { label: "My Progress", href: "/dashboard/student/progress", icon: "📈" },
  { label: "Calendar", href: "/dashboard/student/calendar", icon: "📅" },
];

interface Props {
  fullName: string | null;
  avatarUrl?: string | null;
}

export default function StudentSidebar({ fullName, avatarUrl }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }
  return (
    <aside
      className="flex flex-col h-full w-[240px] shrink-0"
      style={{ background: "linear-gradient(180deg, #1a2b5e 0%, #162550 100%)" }}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center p-0.5 shadow">
            <Image
              src="/IIIT-Dharwad-Logo.png"
              alt="IIIT Dharwad"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">iLearn DWD</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#c9a84c" }}>
              Student Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={
                active
                  ? { background: "rgba(255,255,255,0.15)", color: "#ffffff" }
                  : { color: "#93afd4" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#93afd4";
                }
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-white/10">
        <UserMenu
          fullName={fullName}
          roleLabel="Student"
          basePath="/dashboard/student"
          avatarUrl={avatarUrl}
        />
        <button
          onClick={signOut}
          className="mt-3 w-full text-xs text-blue-300 hover:text-white py-2 px-3 rounded-lg transition-colors text-left"
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background = "transparent")
          }
        >
          → Sign out
        </button>
      </div>
    </aside>
  );
}
