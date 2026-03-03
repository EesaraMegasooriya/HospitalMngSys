import React from "react";
import { useSidebar } from "./SidebarContext";

export function Sidebar({ children }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`h-screen sticky top-0 transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        background: "linear-gradient(175deg, #1a3a2a 0%, #1e4433 55%, #163628 100%)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children }) {
  return (
    <div
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      className="p-4 shrink-0"
    >
      {children}
    </div>
  );
}

export function SidebarContent({ children }) {
  return (
    <div className="p-2 flex-1 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
    >
      {children}
    </div>
  );
}

export function SidebarGroup({ children }) {
  return <div className="mt-2">{children}</div>;
}

export function SidebarGroupLabel({ children }) {
  return (
    <div
      className="px-3 py-2 text-[10px] uppercase tracking-widest font-semibold"
      style={{ color: "rgba(180,220,195,0.4)" }}
    >
      {children}
    </div>
  );
}

export function SidebarMenu({ children }) {
  return <ul className="space-y-0.5">{children}</ul>;
}

export function SidebarMenuItem({ children }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ children, isActive }) {
  return (
    <div
      className="w-full rounded-lg transition-all duration-150"
      style={
        isActive
          ? {
              background:
                "linear-gradient(90deg, rgba(58,153,102,0.25) 0%, rgba(58,153,102,0.08) 100%)",
              boxShadow: "inset 3px 0 0 #3a9966",
            }
          : {}
      }
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </div>
  );
}