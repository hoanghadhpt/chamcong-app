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

  return (
    <nav className="bg-primary text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Chấm Công</h1>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold transition disabled:opacity-50"
          >
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <Link
            href="/"
            className={`px-4 py-2 rounded font-semibold transition whitespace-nowrap ${
              isActive("/")
                ? "bg-accent text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Attendance
          </Link>
          <Link
            href="/workers"
            className={`px-4 py-2 rounded font-semibold transition whitespace-nowrap ${
              isActive("/workers")
                ? "bg-accent text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Workers
          </Link>
          <Link
            href="/export"
            className={`px-4 py-2 rounded font-semibold transition whitespace-nowrap ${
              isActive("/export")
                ? "bg-accent text-white"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            Export
          </Link>
        </div>
      </div>
    </nav>
  );
}
