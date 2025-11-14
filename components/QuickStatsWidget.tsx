"use client";

import { useEffect, useState } from "react";

interface StatsData {
  totalWorkers: number;
  activeWorkers: number;
  todayPresent: number;
  todayAbsent: number;
  todayLeave: number;
  todayTotal: number;
}

export default function QuickStatsWidget() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const [workersRes, attendanceRes] = await Promise.all([
          fetch("/api/workers"),
          fetch(`/api/attendance?date=${today}`),
        ]);

        if (workersRes.ok && attendanceRes.ok) {
          const workers = await workersRes.json();
          const attendance = await attendanceRes.json();

          const activeWorkers = workers.filter((w: any) => w.active === 1);
          const todayPresent = attendance.filter((a: any) => a.status === "present").length;
          const todayAbsent = attendance.filter((a: any) => a.status === "absent").length;
          const todayLeave = attendance.filter(
            (a: any) => a.status === "leave_paid" || a.status === "leave_unpaid"
          ).length;

          setStats({
            totalWorkers: workers.length,
            activeWorkers: activeWorkers.length,
            todayPresent,
            todayAbsent,
            todayLeave,
            todayTotal: attendance.length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-md p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const attendanceRate = stats.activeWorkers > 0
    ? ((stats.todayPresent / stats.activeWorkers) * 100).toFixed(1)
    : "0.0";

  const statCards = [
    {
      label: "Nhân viên",
      value: stats.activeWorkers,
      total: stats.totalWorkers,
      icon: "👥",
      color: "bg-blue-500",
      subtitle: `${stats.totalWorkers} tổng`,
    },
    {
      label: "Có mặt hôm nay",
      value: stats.todayPresent,
      percentage: `${attendanceRate}%`,
      icon: "✅",
      color: "bg-green-500",
      subtitle: `${attendanceRate}% attendance`,
    },
    {
      label: "Vắng mặt",
      value: stats.todayAbsent,
      icon: "❌",
      color: "bg-red-500",
      subtitle: `${stats.todayTotal} đã chấm`,
    },
    {
      label: "Phép",
      value: stats.todayLeave,
      icon: "🏖️",
      color: "bg-orange-500",
      subtitle: "Hôm nay",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border-l-4"
          style={{ borderLeftColor: card.color.replace("bg-", "").replace("-500", "") }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl" aria-hidden="true">
              {card.icon}
            </span>
            {card.percentage && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {card.percentage}
              </span>
            )}
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-1">
            {card.value}
            {card.total && (
              <span className="text-lg text-gray-400 ml-1">
                / {card.total}
              </span>
            )}
          </div>

          <div className="text-sm font-medium text-gray-600">
            {card.label}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            {card.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
