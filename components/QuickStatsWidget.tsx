"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserX, Briefcase } from "lucide-react";

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
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-soft p-5 animate-pulse border border-gray-100"
          >
            <div className="h-10 w-10 bg-gray-100 rounded-lg mb-4"></div>
            <div className="h-8 bg-gray-100 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
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
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
      subtitle: `${stats.totalWorkers} tổng`,
    },
    {
      label: "Có mặt hôm nay",
      value: stats.todayPresent,
      percentage: `${attendanceRate}%`,
      icon: UserCheck,
      color: "text-green-500",
      bg: "bg-green-50",
      subtitle: `${attendanceRate}% tỷ lệ`,
    },
    {
      label: "Vắng mặt",
      value: stats.todayAbsent,
      icon: UserX,
      color: "text-red-500",
      bg: "bg-red-50",
      subtitle: `${stats.todayTotal} đã chấm`,
    },
    {
      label: "Nghỉ phép",
      value: stats.todayLeave,
      icon: Briefcase,
      color: "text-orange-500",
      bg: "bg-orange-50",
      subtitle: "Hôm nay",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-soft hover:shadow-card-hover transition-all p-5 border border-gray-100 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color} transition-transform group-hover:scale-110`}>
                <Icon className="w-6 h-6" />
              </div>
              {card.percentage && (
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-lg border border-success/20">
                  {card.percentage}
                </span>
              )}
            </div>

            <div>
              <div className="text-2xl font-bold text-text-primary mb-1 flex items-baseline gap-1">
                {card.value}
                {card.total && (
                  <span className="text-sm text-text-muted font-normal">
                    / {card.total}
                  </span>
                )}
              </div>

              <div className="text-sm font-medium text-text-secondary">
                {card.label}
              </div>
              
              <div className="text-xs text-text-muted mt-1">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
