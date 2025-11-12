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

  const today = new Date().toISOString().split("T")[0];

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
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, attendanceRes] = await Promise.all([
        fetch("/api/workers"),
        fetch(`/api/attendance?date=${today}`),
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
    isCheckIn: boolean = false
  ) => {
    const existing = attendance.get(workerId) || changes.get(workerId);
    const updated: AttendanceRecord = {
      id: existing?.id || 0,
      worker_id: workerId,
      work_date: today,
      status: status,
      check_in: isCheckIn
        ? getCurrentTime()
        : existing?.check_in || null,
      check_out: existing?.check_out || null,
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
      work_date: today,
      status: existing?.status || "present",
      check_in: existing?.check_in || null,
      check_out: getCurrentTime(),
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
          workDate: today,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Refresh attendance data
        const attendanceRes = await fetch(`/api/attendance?date=${today}`);
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-2">{vi.attendance.title}</h2>
        <p className="text-gray-600">
          {new Date(today).toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-6">
        {Array.from(groupWorkersByTeam(workers).entries()).map(([team, teamWorkers]) => {
          const presentCount = teamWorkers.filter((w) => {
            const current = changes.get(w.id) || attendance.get(w.id);
            return current?.status === "present";
          }).length;

          return (
            <div key={team} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Team Header */}
              <div className="bg-gradient-to-r from-primary to-blue-800 text-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{team}</h3>
                    <p className="text-blue-100">
                      {presentCount}/{teamWorkers.length} {vi.attendance.statusPresent}
                    </p>
                  </div>
                </div>

                {/* Batch Mark Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={`batch-${option.key}`}
                      onClick={() => handleBatchMark(team, option.key)}
                      disabled={batchMarking === team}
                      className="px-4 py-2 bg-white text-primary hover:bg-blue-50 font-semibold rounded transition text-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                      {batchMarking === team ? "Đang xử lý..." : `Đánh dấu cả ${option.label}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Workers */}
              <div className="space-y-2 p-4">
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

                      <div className="flex gap-2 flex-wrap">
                        {STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.key}
                            onClick={() => handleStatusChange(worker.id, option.key)}
                            className={`px-2 py-1 rounded font-semibold transition text-xs ${
                              current?.status === option.key
                                ? "bg-accent text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {current?.status === "present" && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleStatusChange(worker.id, "present", true)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded font-semibold transition text-xs"
                          >
                            {vi.attendance.checkIn}: {current.check_in || "---"}
                          </button>
                          <button
                            onClick={() => handleCheckOut(worker.id)}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded font-semibold transition text-xs"
                          >
                            {vi.attendance.checkOut}: {current.check_out || "---"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {changes.size > 0 && (
        <div className="sticky-bottom">
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex-1 bg-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? vi.common.saving + "..." : `${vi.common.saveAll} (${changes.size})`}
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} offline={toast.offline} />}
    </div>
  );
}
