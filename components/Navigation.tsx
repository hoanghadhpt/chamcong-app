"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

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
    { path: "/", label: "Chấm công", icon: "✅" },
    { path: "/workers", label: "Nhân viên", icon: "👥" },
    { path: "/export", label: "Xuất BC", icon: "📊" },
  ];

  return (
    <nav className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white sticky top-0 z-50 shadow-xl border-b-2 border-accent/30">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Header with Logo and Logout */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span>📱</span>
            <span>Chấm Công</span>
          </h1>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? "⏳ Đang thoát..." : "🚪 Thoát"}
          </button>
        </div>

        {/* Navigation Tabs - Mobile First */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-2 shadow-md ${
                  active
                    ? "bg-gradient-to-r from-accent to-accent-light text-white scale-105 shadow-accent/50"
                    : "bg-beige-100/10 hover:bg-beige-100/20 active:bg-beige-100/30 text-beige-100 border border-beige-100/20"
                }`}
              >
                <span className="text-base">{item.icon}</span>
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
