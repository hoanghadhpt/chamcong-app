"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { getOfflineQueue, addToQueue, removeFromQueue } from "@/lib/offlineQueue";
import { vi, formatDate, getCurrentTime } from "@/lib/i18n";

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

const STATUS_OPTIONS = [
  { key: "present", label: vi.attendance.statusPresent },
  { key: "absent", label: vi.attendance.statusAbsent },
  { key: "leave_paid", label: vi.attendance.statusLeavePaid },
  { key: "leave_unpaid", label: vi.attendance.statusLeaveUnpaid },
  { key: "sick", label: vi.attendance.statusSick },
  { key: "ot", label: vi.attendance.statusOT },
];

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

  const today = new Date().toISOString().split("T")[0];

  // Toggle team expansion
  const toggleTeamExpanded = (team: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(team)) {
      newExpanded.delete(team);
    } else {
      newExpanded.add(team);
    }
    setExpandedTeams(newExpanded);
  };

  // Filter teams by search query
  const getFilteredTeams = () => {
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
  };

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

        const statusLabel = STATUS_OPTIONS.find((o) => o.key === status)?.label || status;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">{vi.common.loading}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-4">{vi.attendance.title}</h2>

        {/* Date selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {vi.attendance.dateLabel}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setChanges(new Map()); // Clear unsaved changes when changing date
              }}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base"
            />
            {selectedDate === today && (
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-semibold">
                {vi.attendance.today}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600">
          {new Date(selectedDate).toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Search input with expand/collapse controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2 items-center mb-3">
          <input
            type="text"
            placeholder={`${vi.attendance.search}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base"
          />
          <button
            onClick={() => {
              const teamsMap = getFilteredTeams();
              setExpandedTeams(new Set(teamsMap.keys()));
            }}
            title="Mở rộng tất cả"
            className="px-3 py-3 bg-blue-100 text-primary rounded-lg hover:bg-blue-200 transition font-semibold text-sm"
          >
            ▼
          </button>
          <button
            onClick={() => setExpandedTeams(new Set())}
            title="Thu gọn tất cả"
            className="px-3 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="space-y-3 sm:pb-0">
        {(() => {
          const filteredTeams = getFilteredTeams();

          if (filteredTeams.size === 0) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800">
                  {searchQuery
                    ? `Không tìm thấy tổ hoặc nhân viên phù hợp với "${searchQuery}"`
                    : "Không có tổ nào"}
                </p>
              </div>
            );
          }

          return Array.from(filteredTeams.entries()).map(([team, teamWorkers]) => {
            const isExpanded = expandedTeams.has(team);
            const presentCount = teamWorkers.filter((w) => {
              const current = changes.get(w.id) || attendance.get(w.id);
              return current?.status === "present";
            }).length;

          return (
            <div key={team} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Team Header */}
              <div className="bg-gradient-to-r from-primary to-blue-800 text-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => toggleTeamExpanded(team)}
                    className="flex-1 text-left hover:opacity-80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{isExpanded ? "▼" : "▶"}</span>
                      <div>
                        <h3 className="text-lg font-bold">{team}</h3>
                        <p className="text-sm text-blue-100">
                          {presentCount}/{teamWorkers.length} {vi.attendance.statusPresent}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Batch Mark Buttons - optimized for mobile */}
                <div className="grid grid-cols-2 sm:flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={`batch-${option.key}`}
                      onClick={() => handleBatchMark(team, option.key)}
                      disabled={batchMarking === team}
                      className="px-3 py-2 sm:px-4 sm:py-2 bg-white text-primary hover:bg-blue-50 font-semibold rounded transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {batchMarking === team ? "Đang..." : `Đánh dấu ${option.label}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Workers - shown only when expanded */}
              {isExpanded && (
                <div className="space-y-2 p-4 border-t border-gray-100">
                  {teamWorkers.map((worker) => {
                  const current = changes.get(worker.id) || attendance.get(worker.id);

                  return (
                    <div
                      key={worker.id}
                      className="bg-gray-50 rounded-lg p-3 border-l-4 border-accent"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-base">{worker.name}</p>
                          <p className="text-xs text-gray-600">{worker.code}</p>
                        </div>
                        {current?.status && (
                          <span className="text-xs font-semibold px-2 py-1 bg-accent text-white rounded">
                            {STATUS_OPTIONS.find((o) => o.key === current.status)?.label}
                          </span>
                        )}
                      </div>

                      {/* Status buttons - optimized for mobile */}
                      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2 sm:flex-wrap">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.key}
                            onClick={() => handleStatusChange(worker.id, option.key, false, current?.shift_amount || 1.0)}
                            className={`px-3 py-2 sm:px-4 sm:py-2 rounded font-semibold transition text-sm sm:text-base ${
                              current?.status === option.key
                                ? "bg-accent text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {/* Half-day selector for leave/absence statuses */}
                      {(current?.status === "leave_paid" || current?.status === "leave_unpaid" || current?.status === "sick" || current?.status === "absent") && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleStatusChange(worker.id, current.status || "absent", false, 1.0)}
                            className={`flex-1 px-3 py-2 rounded font-semibold transition text-sm ${
                              (current?.shift_amount || 1.0) === 1.0
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                          >
                            {vi.attendance.fullDay}
                          </button>
                          <button
                            onClick={() => handleStatusChange(worker.id, current.status || "absent", false, 0.5)}
                            className={`flex-1 px-3 py-2 rounded font-semibold transition text-sm ${
                              (current?.shift_amount || 1.0) === 0.5
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                          >
                            {vi.attendance.halfDay}
                          </button>
                        </div>
                      )}

                      {current?.status === "present" && (
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleStatusChange(worker.id, "present", true, current?.shift_amount || 1.0)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded font-semibold transition text-base"
                          >
                            {vi.attendance.checkIn}: {current.check_in || "---"}
                          </button>
                          <button
                            onClick={() => handleCheckOut(worker.id)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded font-semibold transition text-base"
                          >
                            {vi.attendance.checkOut}: {current.check_out || "---"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          );
          });
        })()}
      </div>

      {changes.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <button
            onClick={saveAll}
            disabled={saving}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {saving ? vi.common.saving + "..." : `${vi.common.saveAll} (${changes.size})`}
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} offline={toast.offline} />}
    </div>
  );
}
