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

/* ─────────────────────────────────────────────
   Scoped styles — same green design language
   as DietPlans.jsx
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  /* ── Sidebar shell ── */
  .sb-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: linear-gradient(175deg, #1a3a2a 0%, #1e4433 55%, #163628 100%);
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* subtle grain texture overlay */
  .sb-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-size: 180px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Header ── */
  .sb-header {
    position: relative; z-index: 1;
    padding: 1.25rem 1rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,.07);
  }

  .sb-logo-wrap {
    display: flex;
    align-items: center;
    gap: .75rem;
  }

  .sb-logo-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3a9966 0%, #2d7d52 100%);
    box-shadow: 0 4px 12px rgba(45,125,82,.45);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: transform .2s;
  }
  .sb-logo-icon:hover { transform: rotate(-6deg) scale(1.08); }

  .sb-logo-name {
    font-family: 'DM Serif Display', serif;
    font-size: 1.15rem;
    color: #e8f5ee;
    letter-spacing: .01em;
    line-height: 1.2;
  }

  .sb-logo-sub {
    font-size: .68rem;
    color: rgba(200,230,210,.5);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-top: .05rem;
  }

  /* ── Content / scroll area ── */
  .sb-content {
    position: relative; z-index: 1;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: .75rem 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,.1) transparent;
  }
  .sb-content::-webkit-scrollbar { width: 3px; }
  .sb-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius:99px; }

  /* ── Group ── */
  .sb-group { padding: 0 .75rem; }

  .sb-group-label {
    font-size: .65rem;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(180,220,195,.4);
    padding: .5rem .5rem .35rem;
    margin-bottom: .1rem;
  }

  /* ── Menu ── */
  .sb-menu {
    list-style: none;
    margin: 0; padding: 0;
    display: flex; flex-direction: column; gap: .15rem;
  }

  .sb-menu-item { border-radius: 10px; overflow: hidden; }

  /* ── Menu button / link ── */
  .sb-link {
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .65rem .75rem;
    border-radius: 10px;
    text-decoration: none;
    color: rgba(210,240,220,.7);
    font-size: .85rem;
    font-weight: 400;
    transition: background .15s, color .15s, padding-left .15s;
    position: relative;
  }

  .sb-link:hover {
    background: rgba(255,255,255,.07);
    color: #e8f5ee;
    padding-left: 1rem;
  }

  .sb-link.active {
    background: linear-gradient(90deg, rgba(58,153,102,.25) 0%, rgba(58,153,102,.08) 100%);
    color: #c8f0d8;
    font-weight: 500;
  }

  /* active left indicator */
  .sb-link.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, #3a9966, #2d7d52);
    box-shadow: 0 0 8px rgba(58,153,102,.6);
  }

  .sb-link-icon {
    display: flex; align-items: center; justify-content: center;
    width: 20px; height: 20px;
    flex-shrink: 0;
    opacity: .8;
    transition: opacity .15s, transform .15s;
  }
  .sb-link:hover .sb-link-icon,
  .sb-link.active .sb-link-icon { opacity: 1; }
  .sb-link.active .sb-link-icon { filter: drop-shadow(0 0 4px rgba(58,153,102,.5)); }

  .sb-link-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* active dot badge on icon (collapsed mode) */
  .sb-link-icon-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .sb-active-dot {
    position: absolute;
    top: -2px; right: -3px;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #3a9966;
    box-shadow: 0 0 6px rgba(58,153,102,.8);
  }

  /* collapsed: center icon */
  .sb-link.collapsed-mode {
    justify-content: center;
    padding: .7rem;
  }
  .sb-link.collapsed-mode:hover { padding-left: .7rem; }

  /* ── Bottom user strip ── */
  .sb-footer {
    position: relative; z-index: 1;
    padding: .75rem;
    border-top: 1px solid rgba(255,255,255,.07);
  }

  .sb-user-pill {
    display: flex;
    align-items: center;
    gap: .65rem;
    padding: .55rem .75rem;
    border-radius: 10px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(255,255,255,.08);
  }

  .sb-user-avatar {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: linear-gradient(135deg, #2d7d52, #1a3a2a);
    border: 1.5px solid rgba(58,153,102,.4);
    display: flex; align-items: center; justify-content: center;
    font-size: .8rem; font-weight: 600;
    color: #c8f0d8;
    flex-shrink: 0;
  }

  .sb-user-name {
    font-size: .8rem; font-weight: 500;
    color: #c8f0d8;
    line-height: 1.2;
  }
  .sb-user-role {
    font-size: .68rem;
    color: rgba(180,220,195,.5);
    text-transform: capitalize;
  }

  /* staggered mount animation */
  @keyframes sbFadeSlide {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sb-menu-item {
    animation: sbFadeSlide .22s ease both;
  }
  .sb-menu-item:nth-child(1) { animation-delay: .04s; }
  .sb-menu-item:nth-child(2) { animation-delay: .08s; }
  .sb-menu-item:nth-child(3) { animation-delay: .12s; }
  .sb-menu-item:nth-child(4) { animation-delay: .16s; }
  .sb-menu-item:nth-child(5) { animation-delay: .20s; }
  .sb-menu-item:nth-child(6) { animation-delay: .24s; }
  .sb-menu-item:nth-child(7) { animation-delay: .28s; }
  .sb-menu-item:nth-child(8) { animation-delay: .32s; }
`;

/* Utensil icon — same as before but crisper */
const UtensilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 3v9M10 3v9M6 7h4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 3v7c0 1.1.9 2 2 2v9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

const AppSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { collapsed } = useSidebar();

  if (!user) return null;

  const navItems = NAV_ITEMS[user.role] || [];
  const initials = user.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <style>{styles}</style>

      <Sidebar>
        {/* ── Header ── */}
        <SidebarHeader>
          <div className="sb-header">
            <div className="sb-logo-wrap">
              <div className="sb-logo-icon">
                <UtensilIcon />
              </div>
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <div className="sb-logo-name">MealFlow</div>
                  <div className="sb-logo-sub">Hospital Meals</div>
                </div>
              )}
            </div>
          </div>
        </SidebarHeader>

        {/* ── Nav ── */}
        <SidebarContent>
          <div className="sb-content">
            <SidebarGroup>
              <div className="sb-group">
                {!collapsed && (
                  <SidebarGroupLabel>
                    <div className="sb-group-label">Navigation</div>
                  </SidebarGroupLabel>
                )}

                <SidebarMenu>
                  <ul className="sb-menu">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.url}>
                          <li className="sb-menu-item">
                            <SidebarMenuButton isActive={isActive}>
                              <Link
                                to={item.url}
                                className={`sb-link ${isActive ? "active" : ""} ${collapsed ? "collapsed-mode" : ""}`}
                                title={collapsed ? item.title : undefined}
                              >
                                <span className="sb-link-icon-wrap">
                                  <span className="sb-link-icon">
                                    <Icon size={17} />
                                  </span>
                                  {collapsed && isActive && <span className="sb-active-dot" />}
                                </span>
                                {!collapsed && (
                                  <span className="sb-link-text">{item.title}</span>
                                )}
                              </Link>
                            </SidebarMenuButton>
                          </li>
                        </SidebarMenuItem>
                      );
                    })}
                  </ul>
                </SidebarMenu>
              </div>
            </SidebarGroup>
          </div>
        </SidebarContent>

        {/* ── User footer ── */}
        <div className="sb-footer">
          <div className="sb-user-pill">
            <div className="sb-user-avatar">{initials}</div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <div className="sb-user-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name || "User"}
                </div>
                <div className="sb-user-role">{user.role || "staff"}</div>
              </div>
            )}
          </div>
        </div>
      </Sidebar>
    </>
  );
};

export default AppSidebar;