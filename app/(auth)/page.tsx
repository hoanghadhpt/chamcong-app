"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Toast from "@/components/Toast";
import DateHeader from "@/components/DateHeader";
import TeamFilter from "@/components/TeamFilter";
import TeamSection from "@/components/TeamSection";
import AttendanceTable from "@/components/AttendanceTable";
import BottomSaveBar from "@/components/BottomSaveBar";
import OfflineIndicator from "@/components/OfflineIndicator";
import QuickStatsWidget from "@/components/QuickStatsWidget";
import { getOfflineQueue, addToQueue, removeFromQueue } from "@/lib/offlineQueue";
import { vi, getCurrentTime } from "@/lib/i18n";

interface Worker {
  id: number;
  code: string;
  name: string;
  team: string | null;
  active: number;
}

interface AttendanceRecord {
  id: number;
  worker_id: number;
  work_date: string;
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  shift_amount?: number;
}

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
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Map<number, AttendanceRecord>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    offline?: boolean;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [changes, setChanges] = useState<Map<number, AttendanceRecord>>(
    new Map()
  );
  const [batchMarking, setBatchMarking] = useState<string | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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

  useEffect(() => {
    fetchData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, attendanceRes] = await Promise.all([
        fetch("/api/workers"),
        fetch(`/api/attendance?date=${selectedDate}`),
      ]);

      if (workersRes.ok) {
        const workersData = await workersRes.json();
        setWorkers(workersData.filter((w: Worker) => w.active === 1));
      }

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        const attendanceMap = new Map();
        attendanceData.forEach((record: AttendanceRecord) => {
          attendanceMap.set(record.worker_id, record);
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    workerId: number,
    status: string,
    isCheckIn: boolean = false,
    shiftAmount: number = 1.0
  ) => {
    const existing = attendance.get(workerId) || changes.get(workerId);
    const updated: AttendanceRecord = {
      id: existing?.id || 0,
      worker_id: workerId,
      work_date: selectedDate,
      status: status,
      check_in: isCheckIn
        ? getCurrentTime()
        : existing?.check_in || null,
      check_out: existing?.check_out || null,
      shift_amount: shiftAmount,
    };

    const newChanges = new Map(changes);
    newChanges.set(workerId, updated);
    setChanges(newChanges);
  };

  const handleCheckOut = (workerId: number) => {
    const existing = attendance.get(workerId) || changes.get(workerId);
    const updated: AttendanceRecord = {
      id: existing?.id || 0,
      worker_id: workerId,
      work_date: selectedDate,
      status: existing?.status || "present",
      check_in: existing?.check_in || null,
      check_out: getCurrentTime(),
      shift_amount: existing?.shift_amount || 1.0,
    };

    const newChanges = new Map(changes);
    newChanges.set(workerId, updated);
    setChanges(newChanges);
  };

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

  const saveAll = async () => {
    if (changes.size === 0) {
      setToast({ message: vi.common.noChanges });
      return;
    }

    setSaving(true);
    let saved = 0;
    let failed = 0;

    for (const [workerId, record] of changes) {
      try {
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: record.worker_id,
            workDate: record.work_date,
            status: record.status || "present",
            checkIn: record.check_in,
            checkOut: record.check_out,
            shiftAmount: record.shift_amount || 1.0,
          }),
        });

        if (response.ok) {
          const savedRecord = await response.json();
          const newAttendance = new Map(attendance);
          newAttendance.set(workerId, savedRecord);
          setAttendance(newAttendance);
          saved++;

          // Remove from offline queue if it was there
          removeFromQueue(workerId);
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        console.error("Error saving record:", error);
        failed++;

        if (!isOnline) {
          // Add to offline queue
          const record = changes.get(workerId);
          if (record) {
            addToQueue({
              workerId: record.worker_id,
              workDate: record.work_date,
              status: record.status || "present",
              checkIn: record.check_in,
              checkOut: record.check_out,
              shiftAmount: record.shift_amount || 1.0,
            });
          }
        }
      }
    }

    setChanges(new Map());
    setSaving(false);

    if (failed > 0 && !isOnline) {
      setToast({
        message: vi.common.savedQueued.replace("{saved}", saved.toString()).replace("{failed}", failed.toString()),
        offline: true,
      });
    } else if (saved > 0) {
      setToast({ message: vi.common.savedSuccess.replace("{count}", saved.toString()) });
    }

    if (failed > 0 && isOnline) {
      setToast({ message: vi.common.saveFailed.replace("{count}", failed.toString()) });
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setChanges(new Map()); // Clear unsaved changes when changing date
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-gray-600 font-medium">{vi.common.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Offline Indicator */}
      <OfflineIndicator />

      <div className="space-y-4 pb-28 lg:pb-8 bg-beige-50 min-h-screen p-4 lg:p-6 xl:p-8">
        {/* Quick Stats Widget - Desktop only */}
        <div className="hidden lg:block">
          <QuickStatsWidget />
        </div>

        {/* Date Header */}
        <DateHeader
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />

        {/* Team Filter / Search + View Mode Toggle */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1">
            <TeamFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onExpandAll={() => setExpandedTeams(new Set(filteredTeams.keys()))}
              onCollapseAll={() => setExpandedTeams(new Set())}
            />
          </div>

          {/* View Mode Toggle - Desktop only */}
          <div className="hidden lg:flex gap-2 bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                viewMode === "table"
                  ? "bg-accent text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Bảng
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                viewMode === "card"
                  ? "bg-accent text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📇 Thẻ
            </button>
          </div>
        </div>

        {/* Table View (Desktop) */}
        {viewMode === "table" && (
          <div className="hidden lg:block">
            <AttendanceTable
              workers={workers}
              attendance={attendance}
              changes={changes}
              onStatusChange={handleStatusChange}
              onCheckOut={handleCheckOut}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {/* Card View (Mobile + Desktop option) */}
        <div className={viewMode === "table" ? "lg:hidden" : ""}>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 xl:gap-4">
            {filteredTeams.size === 0 ? (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center xl:col-span-2">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-yellow-800 font-medium">
                  {searchQuery
                    ? `Không tìm thấy tổ hoặc nhân viên phù hợp với "${searchQuery}"`
                    : "Không có tổ nào"}
                </p>
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
                  onBatchMark={handleBatchMark}
                  batchMarking={batchMarking}
                />
              ))
            )}
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
