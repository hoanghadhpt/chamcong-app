import { useState, useEffect, useCallback } from "react";
import { getCurrentTime, vi } from "@/lib/i18n";
import { getOfflineQueue, addToQueue, removeFromQueue } from "@/lib/offlineQueue";

export interface Worker {
  id: number;
  code: string;
  name: string;
  team: string | null;
  active: number;
}

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  work_date: string;
  status: string | null;
  check_in: string | null;
  check_out: string | null;
  shift_amount?: number;
}

interface UseAttendanceProps {
  selectedDate: string;
}

export function useAttendance({ selectedDate }: UseAttendanceProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<Map<number, AttendanceRecord>>(new Map());
  const [changes, setChanges] = useState<Map<number, AttendanceRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<{ message: string; offline?: boolean } | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
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
      setToast({ message: "Lỗi khi tải dữ liệu", offline: true });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Initial check
    if (typeof window !== 'undefined') {
        setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchData]);

  // Handle status change
  const handleStatusChange = useCallback((
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
      check_in: isCheckIn ? getCurrentTime() : existing?.check_in || null,
      check_out: existing?.check_out || null,
      shift_amount: shiftAmount,
    };

    setChanges((prev) => {
      const newChanges = new Map(prev);
      newChanges.set(workerId, updated);
      return newChanges;
    });
  }, [attendance, changes, selectedDate]);

  // Handle check out
  const handleCheckOut = useCallback((workerId: number) => {
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

    setChanges((prev) => {
      const newChanges = new Map(prev);
      newChanges.set(workerId, updated);
      return newChanges;
    });
  }, [attendance, changes, selectedDate]);

  // Handle time change
  const handleTimeChange = useCallback((workerId: number, field: 'check_in' | 'check_out', time: string) => {
    const existing = attendance.get(workerId) || changes.get(workerId);
    const updated: AttendanceRecord = {
      id: existing?.id || 0,
      worker_id: workerId,
      work_date: selectedDate,
      status: existing?.status || "present",
      check_in: field === 'check_in' ? time : (existing?.check_in || null),
      check_out: field === 'check_out' ? time : (existing?.check_out || null),
      shift_amount: existing?.shift_amount || 1.0,
    };

    setChanges((prev) => {
      const newChanges = new Map(prev);
      newChanges.set(workerId, updated);
      return newChanges;
    });
  }, [attendance, changes, selectedDate]);

  // Save all changes
  const saveAll = useCallback(async () => {
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
          setAttendance((prev) => {
            const newAttendance = new Map(prev);
            newAttendance.set(workerId, savedRecord);
            return newAttendance;
          });
          saved++;
          removeFromQueue(workerId);
        } else {
          throw new Error("Failed to save");
        }
      } catch (error) {
        console.error("Error saving record:", error);
        failed++;

        if (!isOnline) {
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
    } else if (failed > 0 && isOnline) {
      setToast({ message: vi.common.saveFailed.replace("{count}", failed.toString()) });
    }
  }, [changes, isOnline]);

  // Clear changes when date changes
  useEffect(() => {
    setChanges(new Map());
  }, [selectedDate]);

  return {
    workers,
    attendance,
    changes,
    loading,
    saving,
    toast,
    isOnline,
    setToast,
    setAttendance, // Exposed for batch updates
    handleStatusChange,
    handleCheckOut,
    handleTimeChange,
    saveAll,
    refreshData: fetchData,
  };
}
