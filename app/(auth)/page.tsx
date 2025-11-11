"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { getOfflineQueue, addToQueue, removeFromQueue } from "@/lib/offlineQueue";

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

const STATUS_OPTIONS = ["present", "absent", "leave", "ot"];

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
        ? new Date().toLocaleTimeString()
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
      check_out: new Date().toLocaleTimeString(),
    };

    const newChanges = new Map(changes);
    newChanges.set(workerId, updated);
    setChanges(newChanges);
  };

  const saveAll = async () => {
    if (changes.size === 0) {
      setToast({ message: "No changes to save" });
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
            status: record.status,
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
              status: record.status,
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
        message: `Saved ${saved} records. ${failed} queued (offline – will sync)`,
        offline: true,
      });
    } else if (saved > 0) {
      setToast({ message: `Saved ${saved} records successfully` });
    }

    if (failed > 0 && isOnline) {
      setToast({ message: `${failed} records failed to save` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-2">Daily Attendance</h2>
        <p className="text-gray-600">
          {new Date(today).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="space-y-3">
        {workers.map((worker) => {
          const current = changes.get(worker.id) || attendance.get(worker.id);

          return (
            <div
              key={worker.id}
              className="bg-white rounded-lg shadow p-4 border-l-4 border-accent"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-lg">{worker.name}</p>
                  <p className="text-sm text-gray-600">
                    Code: {worker.code} | Team: {worker.team || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(worker.id, status)}
                    className={`px-4 py-2 rounded font-semibold transition uppercase text-sm ${
                      current?.status === status
                        ? "bg-accent text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {current?.status === "present" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleStatusChange(worker.id, "present", true)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-semibold transition text-sm"
                  >
                    Check In: {current.check_in || "---"}
                  </button>
                  <button
                    onClick={() => handleCheckOut(worker.id)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded font-semibold transition text-sm"
                  >
                    Check Out: {current.check_out || "---"}
                  </button>
                </div>
              )}
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
            {saving ? "Saving..." : `Save All (${changes.size})`}
          </button>
        </div>
      )}

      {toast && <Toast message={toast.message} offline={toast.offline} />}
    </div>
  );
}
