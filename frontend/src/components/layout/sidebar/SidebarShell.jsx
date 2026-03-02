import React from "react";
import { useSidebar } from "./SidebarContext";

export function Sidebar({ children }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={`h-screen sticky top-0 border-r bg-white transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children }) {
  return <div className="p-4 border-b">{children}</div>;
}

export function SidebarContent({ children }) {
  return <div className="p-2">{children}</div>;
}

export function SidebarGroup({ children }) {
  return <div className="mt-2">{children}</div>;
}

export function SidebarGroupLabel({ children }) {
  return (
    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500">
      {children}
    </div>
  );
}

export function SidebarMenu({ children }) {
  return <ul className="space-y-1">{children}</ul>;
}

export function SidebarMenuItem({ children }) {
  return <li>{children}</li>;
}

export function SidebarMenuButton({ children, isActive }) {
  return (
    <div
      className={`w-full rounded-md transition ${
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </div>
  );
}