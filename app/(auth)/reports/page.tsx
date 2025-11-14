"use client";

import { useEffect, useState, useMemo } from "react";
import Toast from "@/components/Toast";
import AttendanceStatusChip from "@/components/AttendanceStatusChip";
import { vi, extractTimeFromTimestamp } from "@/lib/i18n";

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
  late_minutes?: number;
  early_minutes?: number;
  ot_1_5?: number;
  ot_2_0?: number;
  ot_3_0?: number;
  note?: string | null;
}

interface AttendanceWithWorker extends AttendanceRecord {
  workerCode: string;
  workerName: string;
  team: string | null;
}

// Helper function to get first and last day of a month
function getMonthBounds(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    firstDay: firstDay.toISOString().split("T")[0],
    lastDay: lastDay.toISOString().split("T")[0],
  };
}

// Get current month bounds
function getCurrentMonthBounds() {
  const now = new Date();
  return getMonthBounds(now.getFullYear(), now.getMonth());
}

export default function ReportsPage() {
  // Initialize with current month
  const currentMonth = getCurrentMonthBounds();
  const [fromDate, setFromDate] = useState(currentMonth.firstDay);
  const [toDate, setToDate] = useState(currentMonth.lastDay);
  const [viewType, setViewType] = useState<"detail" | "matrix">("detail");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceWithWorker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);

  // Month navigation handlers
  const goToPreviousMonth = () => {
    const current = new Date(fromDate);
    const prevMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const bounds = getMonthBounds(prevMonth.getFullYear(), prevMonth.getMonth());
    setFromDate(bounds.firstDay);
    setToDate(bounds.lastDay);
  };

  const goToNextMonth = () => {
    const current = new Date(fromDate);
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const bounds = getMonthBounds(nextMonth.getFullYear(), nextMonth.getMonth());
    setFromDate(bounds.firstDay);
    setToDate(bounds.lastDay);
  };

  const goToCurrentMonth = () => {
    const bounds = getCurrentMonthBounds();
    setFromDate(bounds.firstDay);
    setToDate(bounds.lastDay);
  };

  // Get current month/year display
  const getCurrentMonthDisplay = () => {
    const date = new Date(fromDate);
    const monthNames = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data for range:", fromDate, "to", toDate);
      setLoading(true);
      try {
        const [workersRes, attendanceRes] = await Promise.all([
          fetch("/api/workers"),
          fetch(`/api/attendance/range?fromDate=${fromDate}&toDate=${toDate}`),
        ]);

        // Parse workers data once
        let workersData: Worker[] = [];
        if (workersRes.ok) {
          workersData = await workersRes.json();
          const activeWorkers = workersData.filter((w: Worker) => w.active === 1);
          console.log("Workers fetched:", workersData.length, "active:", activeWorkers.length);
          setWorkers(activeWorkers);
        } else {
          console.error("Failed to fetch workers:", workersRes.status);
        }

        if (attendanceRes.ok) {
          const attendanceRecords: AttendanceWithWorker[] = await attendanceRes.json();
          console.log("Attendance records fetched:", attendanceRecords.length);
          setAttendanceData(attendanceRecords);
        } else {
          console.error("Failed to fetch attendance:", attendanceRes.status);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setToast("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate]);

  // Export Excel
  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate,
          toDate,
          format: viewType,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const formatName = viewType === "detail" ? "chi_tiet" : "ma_tran";
        a.download = `baocao_${formatName}_${fromDate}_den_${toDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast("Đã xuất báo cáo thành công!");
      } else {
        setToast("Lỗi khi xuất báo cáo");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      setToast("Lỗi khi xuất báo cáo");
    }
  };

  // Generate matrix data - memoized for performance
  const matrixData = useMemo(() => {
    if (viewType !== "matrix") {
      return null;
    }

    if (!workers.length) {
      console.log("Ma trận: Không có workers");
      return { dates: [], workerRows: [] };
    }

    // Get all dates in range
    const dates: string[] = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }

    // Create matrix
    const workerRows = workers.map((worker) => {
      const attendanceMap = new Map<string, AttendanceRecord>();
      const filteredAttendance = attendanceData.filter((a) => a.worker_id === worker.id);

      filteredAttendance.forEach((a) => {
        // Normalize work_date to YYYY-MM-DD format (remove time part)
        const normalizedDate = a.work_date.split('T')[0];
        attendanceMap.set(normalizedDate, a);
      });

      const dateData = dates.map((date) => attendanceMap.get(date) || null);

      // Calculate totals
      const totals = {
        present: dateData.filter((d) => d?.status === "present").length,
        absent: dateData.filter((d) => d?.status === "absent").length,
        leave: dateData.filter((d) => d?.status === "leave_paid" || d?.status === "leave_unpaid").length,
        sick: dateData.filter((d) => d?.status === "sick").length,
        ot: dateData.filter((d) => d?.status === "ot").length,
      };

      return {
        worker,
        dateData,
        totals,
      };
    });

    return { dates, workerRows };
  }, [viewType, workers, attendanceData, fromDate, toDate]);

  // Mobile warning
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  return (
    <div className="space-y-4 p-4 lg:p-6 xl:p-8">
      {/* Mobile Warning */}
      <div className="lg:hidden bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">💻</div>
        <h3 className="text-xl font-bold text-yellow-900 mb-2">
          Chức năng chỉ dành cho Desktop
        </h3>
        <p className="text-yellow-800">
          Vui lòng sử dụng máy tính để xem báo cáo chi tiết và ma trận.
          <br />
          Hoặc sử dụng chức năng <strong>"Xuất BC"</strong> để tải về file Excel.
        </p>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-primary">📊 Báo cáo Chấm công</h2>
            <div className="text-sm text-gray-500">
              View: <span className="font-bold text-accent">{viewType}</span> |
              Workers: <span className="font-bold">{workers.length}</span> |
              Records: <span className="font-bold">{attendanceData.length}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4 mb-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <button
                onClick={goToPreviousMonth}
                className="px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg font-semibold text-blue-700 transition shadow-sm hover:shadow"
                title="Tháng trước"
              >
                ◀ Tháng trước
              </button>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-blue-900">
                  {getCurrentMonthDisplay()}
                </span>
                <button
                  onClick={goToCurrentMonth}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold transition"
                  title="Về tháng hiện tại"
                >
                  Hôm nay
                </button>
              </div>
              <button
                onClick={goToNextMonth}
                className="px-4 py-2 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg font-semibold text-blue-700 transition shadow-sm hover:shadow"
                title="Tháng sau"
              >
                Tháng sau ▶
              </button>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Từ ngày:
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đến ngày:
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* View Type Toggle */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log("Switching to detail view");
                  setViewType("detail");
                }}
                className={`flex-1 px-6 py-3 rounded-lg border-2 transition font-semibold ${
                  viewType === "detail"
                    ? "border-accent bg-blue-50 text-accent"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                📋 Chi tiết
              </button>
              <button
                onClick={() => {
                  console.log("Switching to matrix view");
                  setViewType("matrix");
                }}
                className={`flex-1 px-6 py-3 rounded-lg border-2 transition font-semibold ${
                  viewType === "matrix"
                    ? "border-accent bg-blue-50 text-accent"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                📊 Ma trận
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-md"
              >
                💾 Xuất Excel
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detail View */}
              {viewType === "detail" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">STT</th>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">Ngày</th>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">Mã NV</th>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">Họ tên</th>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">Bộ phận</th>
                        <th className="px-3 py-3 text-left text-xs font-bold uppercase">Trạng thái</th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase">Loại ca</th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase">Vào</th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase">Ra</th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase">Trễ</th>
                        <th className="px-3 py-3 text-center text-xs font-bold uppercase">Sớm</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                            <div className="text-3xl mb-2">📭</div>
                            <p>Không có dữ liệu chấm công trong khoảng thời gian này</p>
                          </td>
                        </tr>
                      ) : (
                        attendanceData.map((record, index) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                            <td className="px-3 py-2 text-sm">
                              {new Date(record.work_date).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="px-3 py-2 text-sm font-medium">{record.workerCode}</td>
                            <td className="px-3 py-2 text-sm font-semibold">{record.workerName}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">
                              {record.team || "---"}
                            </td>
                            <td className="px-3 py-2">
                              <AttendanceStatusChip status={record.status as any} size="sm" />
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {record.shift_amount || 1.0}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {extractTimeFromTimestamp(record.check_in) || "---"}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {extractTimeFromTimestamp(record.check_out) || "---"}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {record.late_minutes || 0}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">
                              {record.early_minutes || 0}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Matrix View */}
              {viewType === "matrix" && !matrixData && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="text-gray-600 font-medium">Đang tải ma trận...</p>
                  </div>
                </div>
              )}
              {viewType === "matrix" && matrixData && (
                <div className="relative">
                  {/* Scroll Indicator */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-200 to-transparent pointer-events-none z-20 rounded-r-lg"></div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white">
                        <tr>
                          <th className="px-2 py-2 text-left font-bold sticky left-0 bg-warm-dark z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                            Mã NV
                          </th>
                          <th className="px-2 py-2 text-left font-bold sticky left-[4rem] bg-warm-dark z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                            Họ tên
                          </th>
                        {matrixData.dates.map((date) => {
                          const d = new Date(date);
                          const day = d.getDate();
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          return (
                            <th
                              key={date}
                              className={`px-2 py-2 text-center font-bold ${
                                isWeekend ? "bg-gray-600" : ""
                              }`}
                            >
                              {day}
                            </th>
                          );
                        })}
                        <th className="px-2 py-2 text-center font-bold bg-green-700">P</th>
                        <th className="px-2 py-2 text-center font-bold bg-red-700">V</th>
                        <th className="px-2 py-2 text-center font-bold bg-blue-700">L</th>
                        <th className="px-2 py-2 text-center font-bold bg-purple-700">S</th>
                        <th className="px-2 py-2 text-center font-bold bg-yellow-700">OT</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {matrixData.workerRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={matrixData.dates.length + 7}
                            className="px-6 py-12 text-center text-gray-500"
                          >
                            <div className="text-3xl mb-2">📭</div>
                            <p className="font-semibold text-gray-700 mb-2">Không có dữ liệu hiển thị</p>
                            <p className="text-sm">
                              {workers.length === 0 ? (
                                "Không có nhân viên nào đang hoạt động"
                              ) : (
                                "Không có dữ liệu chấm công trong khoảng thời gian này"
                              )}
                            </p>
                            <p className="text-xs mt-2 text-gray-500">
                              Vui lòng thêm nhân viên và chấm công để xem báo cáo
                            </p>
                          </td>
                        </tr>
                      ) : (
                        matrixData.workerRows.map((row) => (
                          <tr key={row.worker.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-2 py-2 font-medium sticky left-0 bg-white z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)] border-r border-gray-200">
                              {row.worker.code}
                            </td>
                            <td className="px-2 py-2 font-semibold sticky left-[4rem] bg-white z-20 shadow-[2px_0_4px_rgba(0,0,0,0.05)] border-r-2 border-gray-300">
                              {row.worker.name}
                            </td>
                            {row.dateData.map((record, idx) => {
                              const date = matrixData.dates[idx];
                              const d = new Date(date);
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                              let cellContent = "";
                              let cellColor = "";

                              if (!record) {
                                cellContent = "";
                                cellColor = isWeekend ? "bg-gray-100" : "";
                              } else {
                                switch (record.status) {
                                  case "present":
                                    cellContent = "P";
                                    cellColor = "bg-green-100 text-green-800";
                                    break;
                                  case "absent":
                                    cellContent = "V";
                                    cellColor = "bg-red-100 text-red-800";
                                    break;
                                  case "leave_paid":
                                  case "leave_unpaid":
                                    cellContent = "L";
                                    cellColor = "bg-blue-100 text-blue-800";
                                    break;
                                  case "sick":
                                    cellContent = "S";
                                    cellColor = "bg-purple-100 text-purple-800";
                                    break;
                                  case "ot":
                                    cellContent = "OT";
                                    cellColor = "bg-yellow-100 text-yellow-800";
                                    break;
                                }
                              }

                              return (
                                <td
                                  key={idx}
                                  className={`px-2 py-2 text-center font-bold ${cellColor}`}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center font-bold bg-green-50">
                              {row.totals.present}
                            </td>
                            <td className="px-2 py-2 text-center font-bold bg-red-50">
                              {row.totals.absent}
                            </td>
                            <td className="px-2 py-2 text-center font-bold bg-blue-50">
                              {row.totals.leave}
                            </td>
                            <td className="px-2 py-2 text-center font-bold bg-purple-50">
                              {row.totals.sick}
                            </td>
                            <td className="px-2 py-2 text-center font-bold bg-yellow-50">
                              {row.totals.ot}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
