"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Download, 
  User, 
  LogOut,
  Menu
} from "lucide-react";

export default function Navigation() {
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
    { path: "/", label: "Chấm công", icon: LayoutDashboard },
    { path: "/workers", label: "Nhân viên", icon: Users },
    { path: "/reports", label: "Báo cáo", icon: BarChart3 },
    { path: "/export", label: "Xuất BC", icon: Download },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-lg border-b border-gray-100">
      <div className="px-4 py-3">
        {/* Header with Logo and Logout */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold text-text-primary">Chấm Công</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-error hover:bg-error/5 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loading ? "Đang thoát..." : "Thoát"}
          </button>
        </div>

        {/* Navigation Tabs - Horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            // Hide "Báo cáo" on very small screens if needed, but horizontal scroll handles it
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex items-center gap-2
                  px-4 py-2.5
                  rounded-xl
                  font-bold text-sm whitespace-nowrap
                  transition-all
                  ${
                    active
                      ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                      : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${active ? "text-white" : "text-text-muted"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hide scrollbar for horizontal scroll on mobile */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
}
