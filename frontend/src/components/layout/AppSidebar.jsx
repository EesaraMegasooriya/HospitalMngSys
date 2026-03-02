import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { NAV_ITEMS } from "../../lib/constants";
import { useSidebar } from "./sidebar/SidebarContext";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./sidebar/SidebarShell";

const AppSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { collapsed } = useSidebar();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            {/* simple utensil-ish icon substitute */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 3v9M10 3v9M6 7h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M14 3v7c0 1.1.9 2 2 2v9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">MealFlow</div>
              <div className="text-[10px] text-gray-500 truncate">Hospital Meals</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}

          <SidebarMenu>
            {navItems.map((item) => {
  const isActive = location.pathname === item.url;
  const Icon = item.icon;

  return (
    <SidebarMenuItem key={item.url}>
      <SidebarMenuButton isActive={isActive}>
        <Link
          to={item.url}
          className={`flex items-center gap-3 px-3 py-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">{item.title}</span>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
})}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;