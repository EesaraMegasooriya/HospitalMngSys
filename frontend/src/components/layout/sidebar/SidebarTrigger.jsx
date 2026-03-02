import React from "react";
import { useSidebar } from "./SidebarContext";

export default function SidebarTrigger({ className = "" }) {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle sidebar"
      className={`inline-flex items-center justify-center rounded-md border px-2 py-1 text-sm ${className}`}
    >
      {/* simple hamburger icon (no lucide) */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}