"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Settings, UserCircle2 } from "lucide-react";

interface UserMenuProps {
  fullName: string | null;
  roleLabel: string;
  basePath: string;
  avatarUrl?: string | null;
}

export default function UserMenu({
  fullName,
  roleLabel,
  basePath,
  avatarUrl,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = fullName
    ? fullName
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : roleLabel[0]?.toUpperCase() ?? "U";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors"
        style={{ background: open ? "rgba(255,255,255,0.08)" : "transparent" }}
      >
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold"
          style={{ background: "rgba(201,168,76,0.25)", color: "#c9a84c" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={fullName ?? roleLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">
            {fullName ?? roleLabel}
          </p>
          <p className="text-[11px] text-blue-300">{roleLabel}</p>
        </div>
        <span className="text-xs text-blue-300">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: "#ffffff",
            borderColor: "rgba(15,23,42,0.08)",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.28)",
          }}
        >
          <div className="border-b px-4 py-3" style={{ borderColor: "#e8edf7" }}>
            <p className="truncate text-sm font-semibold text-slate-900">
              {fullName ?? roleLabel}
            </p>
            <p className="text-xs text-slate-500">{roleLabel} account</p>
          </div>

          <div className="p-2">
            <Link
              href={`${basePath}/profile`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span>Profile</span>
              <UserCircle2 className="h-4 w-4 text-slate-500" strokeWidth={2} />
            </Link>
            <Link
              href={`${basePath}/settings`}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span>Settings</span>
              <Settings className="h-4 w-4 text-slate-500" strokeWidth={2} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
