"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Download, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface UserProfile {
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Fetch user profile for avatar
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

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

  // Generate avatar URL (custom or auto-generated)
  const getAvatarUrl = (): string => {
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }

    if (profile) {
      const name = profile.display_name || profile.email.split("@")[0];
      const encodedName = encodeURIComponent(name);
      return `https://ui-avatars.com/api/?name=${encodedName}&background=CC785C&color=fff&size=128&bold=true`;
    }

    return "";
  };

  const displayName = profile?.display_name || "Quản lý";
  const displayEmail = profile?.email || "manager@example.com";
  const avatarUrl = getAvatarUrl();

  const navItems = [
    { path: "/", label: "Chấm công", icon: LayoutDashboard },
    { path: "/workers", label: "Nhân viên", icon: Users },
    { path: "/reports", label: "Báo cáo", icon: BarChart3 },
    { path: "/export", label: "Xuất BC", icon: Download },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <aside
      className={`
        hidden lg:flex flex-col
        bg-white
        h-screen sticky top-0
        shadow-xl
        border-r border-gray-100
        transition-all duration-300 ease-in-out
        z-50
        ${isCollapsed ? "w-20" : "w-72"}
      `}
    >
      {/* Logo & Toggle */}
      <div className="p-6 border-b border-gray-100 relative">
        <div className="flex items-center justify-between h-8">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <h1 className="text-xl font-bold text-text-primary tracking-tight">Chấm Công</h1>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-8 bg-white hover:bg-gray-50 text-text-secondary w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-gray-200 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3
                px-4 py-3
                rounded-xl
                font-medium
                transition-all duration-200
                group
                ${
                  active
                    ? "bg-primary-50 text-primary-600 shadow-sm"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                }
                ${isCollapsed ? "justify-center px-2" : ""}
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon 
                className={`
                  w-5 h-5 transition-colors
                  ${active ? "text-primary-600" : "text-text-muted group-hover:text-text-primary"}
                `} 
              />
              {!isCollapsed && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-100 space-y-2 bg-gray-50/50">
        {/* User Info */}
        {!isCollapsed && (
          <Link
            href="/profile"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group border border-transparent hover:border-gray-100"
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-primary-100 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary-600 transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-text-muted truncate">
                {displayEmail}
              </p>
            </div>
          </Link>
        )}

        {isCollapsed && (
          <Link
            href="/profile"
            className="flex justify-center p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all group"
          >
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className={`
            w-full
            flex items-center gap-2
            px-4 py-2.5
            rounded-xl
            font-medium text-sm
            transition-all
            text-error hover:bg-error/5 hover:text-red-600
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isCollapsed ? "justify-center px-2" : ""}
          `}
          title={isCollapsed ? "Đăng xuất" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && (
            <span>
              {loading ? "Đang thoát..." : "Đăng xuất"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
