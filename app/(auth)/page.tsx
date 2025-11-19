"use client";

import { useState, useMemo, useCallback } from "react";
import Toast from "@/components/Toast";
import DateHeader from "@/components/DateHeader";
import TeamFilter from "@/components/TeamFilter";
import TeamSection from "@/components/TeamSection";
import AttendanceTable from "@/components/AttendanceTable";
import BottomSaveBar from "@/components/BottomSaveBar";
import OfflineIndicator from "@/components/OfflineIndicator";
import QuickStatsWidget from "@/components/QuickStatsWidget";
import { useAttendance, Worker, AttendanceRecord } from "@/hooks/useAttendance";
import { LayoutGrid, List, Search } from "lucide-react";

// Get unique teams and group workers by team
const groupWorkersByTeam = (workers: Worker[]): Map<string, Worker[]> => {
  const groups = new Map<string, Worker[]>();
  workers.forEach((worker) => {
    const team = worker.team || "Không có bộ phận";
    if (!groups.has(team)) {
      groups.set(team, []);
    }
    groups.get(team)!.push(worker);
  });
  return groups;
};

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const {
    workers,
    attendance,
    changes,
    loading,
    saving,
    toast,
    setToast,
    setAttendance,
    handleStatusChange,
    handleCheckOut,
    handleTimeChange,
    saveAll,
  } = useAttendance({ selectedDate });

  const [batchMarking, setBatchMarking] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Toggle team expansion (optimized with useCallback)
  const toggleTeamExpanded = useCallback((team: string) => {
    setExpandedTeams((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(team)) {
        newExpanded.delete(team);
      } else {
        newExpanded.add(team);
      }
      return newExpanded;
    });
  }, []);

  // Filter teams by search query (optimized with useMemo)
  const filteredTeams = useMemo(() => {
    const teamsMap = groupWorkersByTeam(workers);
    if (!searchQuery.trim()) {
      return teamsMap;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = new Map<string, Worker[]>();

    for (const [team, teamWorkers] of teamsMap.entries()) {
      // Filter by team name or worker name/code
      const matchingWorkers = teamWorkers.filter(
        (w) =>
          team.toLowerCase().includes(query) ||
          w.name.toLowerCase().includes(query) ||
          w.code.toLowerCase().includes(query)
      );

      if (
        team.toLowerCase().includes(query) ||
        matchingWorkers.length > 0
      ) {
        filtered.set(
          team,
          team.toLowerCase().includes(query) ? teamWorkers : matchingWorkers
        );
      }
    }

    return filtered;
  }, [workers, searchQuery]);

  const handleBatchMark = async (teamName: string, status: string) => {
    setBatchMarking(teamName);

    try {
      const response = await fetch("/api/attendance/batch-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          status,
          workDate: selectedDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh attendance data
        const attendanceRes = await fetch(`/api/attendance?date=${selectedDate}`);
        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          const attendanceMap = new Map();
          attendanceData.forEach((record: AttendanceRecord) => {
            attendanceMap.set(record.worker_id, record);
          });
          setAttendance(attendanceMap);
        }

        const statusLabels: Record<string, string> = {
          present: "Có mặt",
          absent: "Vắng",
          leave_paid: "Phép có lương",
          leave_unpaid: "Phép không lương",
          sick: "Ốm",
          ot: "Tăng ca",
        };
        const statusLabel = statusLabels[status] || status;
        setToast({
          message: `Đã đánh dấu ${result.updated} nhân viên tổ ${teamName} là ${statusLabel}`,
        });
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Lỗi khi đánh dấu tổ" });
      }
    } catch (error) {
      console.error("Error batch marking:", error);
      setToast({ message: "Lỗi khi đánh dấu tổ" });
    } finally {
      setBatchMarking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-text-secondary font-medium text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Offline Indicator */}
      <OfflineIndicator />

      <div className="min-h-screen bg-background pb-32 lg:pb-12">
        <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-stretch">
            {/* Date Header */}
            <div className="w-full lg:w-auto lg:flex-1">
              <DateHeader
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
            
            {/* Quick Stats Widget - Desktop only */}
            <div className="hidden lg:block lg:flex-[2]">
              <QuickStatsWidget />
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between sticky top-0 z-30 bg-background/95 backdrop-blur-sm py-2 lg:py-4 -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-gray-100 lg:border-none">
            <div className="flex-1 w-full lg:max-w-md">
              <TeamFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onExpandAll={() => setExpandedTeams(new Set(filteredTeams.keys()))}
                onCollapseAll={() => setExpandedTeams(new Set())}
              />
            </div>

            {/* View Mode Toggle - Desktop only */}
            <div className="hidden lg:flex gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
                Bảng
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  viewMode === "card"
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-text-secondary hover:bg-gray-50"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Thẻ
              </button>
            </div>
          </div>

          {/* Table View (Desktop) */}
          {viewMode === "table" && (
            <div className="hidden lg:block animate-fadeIn">
              <AttendanceTable
                workers={workers}
                attendance={attendance}
                changes={changes}
                onStatusChange={handleStatusChange}
                onCheckOut={handleCheckOut}
                onTimeChange={handleTimeChange}
                searchQuery={searchQuery}
              />
            </div>
          )}

          {/* Card View (Mobile + Desktop option) */}
          <div className={`${viewMode === "table" ? "lg:hidden" : ""} animate-fadeIn`}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
              {filteredTeams.size === 0 ? (
                <div className="bg-surface-highlight border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center xl:col-span-2 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <Search className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-secondary font-medium text-lg">
                    {searchQuery
                      ? `Không tìm thấy kết quả cho "${searchQuery}"`
                      : "Không có dữ liệu tổ"}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Xóa tìm kiếm
                    </button>
                  )}
                </div>
              ) : (
                Array.from(filteredTeams.entries()).map(([team, teamWorkers]) => (
                  <TeamSection
                    key={team}
                    teamName={team}
                    workers={teamWorkers}
                    attendance={attendance}
                    changes={changes}
                    isExpanded={expandedTeams.has(team)}
                    onToggleExpand={() => toggleTeamExpanded(team)}
                    onStatusChange={handleStatusChange}
                    onCheckOut={handleCheckOut}
                    onTimeChange={handleTimeChange}
                    onBatchMark={handleBatchMark}
                    batchMarking={batchMarking}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <BottomSaveBar
          visible={true}
          changeCount={changes.size}
          onSave={saveAll}
          saving={saving}
        />

        {/* Toast Notification */}
        {toast && <Toast message={toast.message} offline={toast.offline} />}
      </div>
    </>
  );
}
