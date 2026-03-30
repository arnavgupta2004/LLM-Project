"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: "#1a2b5e" }}>
          Something went wrong
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#1a2b5e" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
