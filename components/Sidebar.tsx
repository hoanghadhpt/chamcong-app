"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: "/", label: "Chấm công", icon: "✅" },
    { path: "/workers", label: "Nhân viên", icon: "👥" },
    { path: "/reports", label: "Báo cáo", icon: "📊" },
    { path: "/export", label: "Xuất BC", icon: "💾" },
    { path: "/profile", label: "Profile", icon: "👤" },
  ];

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-gradient-to-b from-warm-dark to-warm-dark/95
        text-white
        h-screen sticky top-0
        shadow-2xl
        border-r-2 border-accent/30
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}
      `}
      role="navigation"
      aria-label="Navigation chính"
    >
      {/* Logo & Toggle */}
      <div className="p-4 border-b border-beige-100/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2" role="banner">
              <span className="text-2xl" aria-hidden="true">📱</span>
              <h1 className="text-xl font-bold">Chấm Công</h1>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full" role="banner">
              <span className="text-2xl" aria-hidden="true">📱</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 bg-accent hover:bg-accent-light active:scale-95 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all border-2 border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-warm-dark"
          aria-label={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-expanded={!isCollapsed}
        >
          <span className="text-xs font-bold text-white" aria-hidden="true">
            {isCollapsed ? "→" : "←"}
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto" aria-label="Menu điều hướng">
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                font-bold
                transition-all
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-warm-dark
                ${
                  active
                    ? "bg-gradient-to-r from-accent to-accent-light text-white shadow-lg shadow-accent/30 scale-105"
                    : "bg-beige-100/5 hover:bg-beige-100/10 active:bg-beige-100/15 text-beige-100 border border-beige-100/10 hover:border-beige-100/20"
                }
                ${isCollapsed ? "justify-center" : ""}
              `}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              {!isCollapsed && (
                <span className="text-base whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-beige-100/10 space-y-2" role="contentinfo" aria-label="Thông tin người dùng">
        {/* User Info */}
        {!isCollapsed && (
          <div className="px-4 py-3 bg-beige-100/5 rounded-xl border border-beige-100/10" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-xl" aria-hidden="true">
                👤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  Quản lý
                </p>
                <p className="text-xs text-beige-100/70 truncate">
                  manager@example.com
                </p>
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex justify-center" role="status" aria-label="Người dùng: Quản lý">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-xl" aria-hidden="true">
              👤
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className={`
            w-full
            bg-red-600 hover:bg-red-700 active:bg-red-800
            px-4 py-3
            rounded-xl
            font-bold
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-md
            flex items-center gap-2
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-warm-dark
            ${isCollapsed ? "justify-center" : "justify-center"}
          `}
          title={isCollapsed ? "Đăng xuất" : undefined}
          aria-label={loading ? "Đang đăng xuất..." : "Đăng xuất"}
          aria-busy={loading}
        >
          <span className="text-lg" aria-hidden="true">🚪</span>
          {!isCollapsed && (
            <span className="text-sm">
              {loading ? "Đang thoát..." : "Đăng xuất"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
