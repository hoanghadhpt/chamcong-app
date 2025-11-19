"use client";

import { useEffect, useState, useMemo } from "react";
import Toast from "@/components/Toast";
import AttendanceStatusChip from "@/components/AttendanceStatusChip";
import { vi, extractTimeFromTimestamp, formatDateLocal } from "@/lib/i18n";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  LayoutGrid, 
  List, 
  Search,
  FileSpreadsheet,
  AlertTriangle,
  BarChart3
} from "lucide-react";

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
    firstDay: formatDateLocal(firstDay),
    lastDay: formatDateLocal(lastDay),
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
          setWorkers(activeWorkers);
        }

        if (attendanceRes.ok) {
          const attendanceRecords: AttendanceWithWorker[] = await attendanceRes.json();
          setAttendanceData(attendanceRecords);
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
      return { dates: [], workerRows: [] };
    }

    // Get all dates in range
    const dates: string[] = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(formatDateLocal(d));
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

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Mobile Warning */}
        <div className="lg:hidden bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center shadow-sm">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-yellow-900 mb-2">
            Chức năng chỉ dành cho Desktop
          </h3>
          <p className="text-yellow-800 mb-4">
            Vui lòng sử dụng máy tính để xem báo cáo chi tiết và ma trận.
          </p>
          <button
            onClick={handleExport}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-yellow-600/20 flex items-center justify-center gap-2 w-full"
          >
            <Download className="w-5 h-5" />
            Tải file Excel
          </button>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary-500" />
                Báo cáo Chấm công
              </h1>
              <p className="text-text-secondary mt-1">
                Xem thống kê chi tiết và xuất báo cáo
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-text-muted">View:</span>
                <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">{viewType === 'detail' ? 'Chi tiết' : 'Ma trận'}</span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Nhân viên:</span>
                <span className="text-text-primary">{workers.length}</span>
              </div>
              <div className="w-px h-4 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Bản ghi:</span>
                <span className="text-text-primary">{attendanceData.length}</span>
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 sticky top-4 z-40">
            <div className="flex flex-col gap-6">
              {/* Top Row: Month Nav & View Toggle */}
              <div className="flex items-center justify-between">
                {/* Month Navigation */}
                <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-text-secondary transition-all"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 font-bold text-text-primary min-w-[140px] text-center">
                    {getCurrentMonthDisplay()}
                  </div>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-text-secondary transition-all"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-2"></div>
                  <button
                    onClick={goToCurrentMonth}
                    className="px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Hôm nay
                  </button>
                </div>

                {/* View Type Toggle */}
                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={() => setViewType("detail")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      viewType === "detail"
                        ? "bg-white text-primary-600 shadow-sm"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Chi tiết
                  </button>
                  <button
                    onClick={() => setViewType("matrix")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      viewType === "matrix"
                        ? "bg-white text-primary-600 shadow-sm"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Ma trận
                  </button>
                </div>
              </div>

              {/* Bottom Row: Date Range & Export */}
              <div className="flex items-end gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Từ ngày
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays className="h-5 w-5 text-text-muted" />
                      </div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      Đến ngày
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays className="h-5 w-5 text-text-muted" />
                      </div>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleExport}
                  className="px-6 py-2.5 bg-success hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-success/20 flex items-center gap-2 h-[46px]"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Xuất Excel
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                <p className="text-text-secondary font-medium">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <>
                {/* Detail View */}
                {viewType === "detail" && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-12">STT</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Ngày</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Mã NV</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Họ tên</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Bộ phận</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Công</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Vào</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Ra</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Trễ</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Sớm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {attendanceData.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-6 py-12 text-center text-text-muted">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                              </div>
                              <p className="font-medium">Không có dữ liệu chấm công trong khoảng thời gian này</p>
                            </td>
                          </tr>
                        ) : (
                          attendanceData.map((record, index) => (
                            <tr key={record.id} className="hover:bg-primary-50/30 transition-colors">
                              <td className="px-4 py-3 text-sm text-text-secondary">{index + 1}</td>
                              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                                {new Date(record.work_date).toLocaleDateString("vi-VN")}
                              </td>
                              <td className="px-4 py-3 text-sm text-text-secondary">{record.workerCode}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-text-primary">{record.workerName}</td>
                              <td className="px-4 py-3 text-sm text-text-secondary">
                                <span className="px-2 py-1 rounded-lg bg-gray-100 text-xs font-medium">
                                  {record.team || "---"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <AttendanceStatusChip status={record.status as any} size="sm" />
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium text-text-primary">
                                {record.shift_amount || 1.0}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary font-mono">
                                {extractTimeFromTimestamp(record.check_in) || "---"}
                              </td>
                              <td className="px-4 py-3 text-center text-sm text-text-secondary font-mono">
                                {extractTimeFromTimestamp(record.check_out) || "---"}
                              </td>
                              <td className={`px-4 py-3 text-center text-sm font-medium ${
                                (record.late_minutes || 0) > 0 ? "text-error" : "text-text-secondary"
                              }`}>
                                {record.late_minutes || 0}
                              </td>
                              <td className={`px-4 py-3 text-center text-sm font-medium ${
                                (record.early_minutes || 0) > 0 ? "text-error" : "text-text-secondary"
                              }`}>
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
                {viewType === "matrix" && matrixData && (
                  <div className="p-6">
                    {/* Legend */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                      <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Chú thích ký hiệu
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                          { code: "P", label: "Có mặt", sub: "Present", color: "bg-green-100 text-green-800" },
                          { code: "V", label: "Vắng mặt", sub: "Absent", color: "bg-red-100 text-red-800" },
                          { code: "L", label: "Nghỉ phép", sub: "Leave", color: "bg-blue-100 text-blue-800" },
                          { code: "S", label: "Ốm đau", sub: "Sick", color: "bg-purple-100 text-purple-800" },
                          { code: "OT", label: "Tăng ca", sub: "Overtime", color: "bg-yellow-100 text-yellow-800" },
                        ].map((item) => (
                          <div key={item.code} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                            <div className={`w-10 h-10 ${item.color} font-bold rounded-lg flex items-center justify-center text-sm`}>
                              {item.code}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-text-primary">{item.label}</span>
                              <span className="text-xs text-text-muted">{item.sub}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative border border-gray-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px]">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-30">
                            <tr>
                              <th className="px-3 py-3 text-left font-bold text-text-primary sticky left-0 bg-gray-50 z-40 border-b border-r border-gray-200 min-w-[80px]">
                                Mã NV
                              </th>
                              <th className="px-3 py-3 text-left font-bold text-text-primary sticky left-[80px] bg-gray-50 z-40 border-b border-r border-gray-200 min-w-[150px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                Họ tên
                              </th>
                              {matrixData.dates.map((date) => {
                                const d = new Date(date);
                                const day = d.getDate();
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                return (
                                  <th
                                    key={date}
                                    className={`px-2 py-3 text-center font-bold border-b border-r border-gray-200 min-w-[40px] ${
                                      isWeekend ? "bg-gray-100 text-text-secondary" : "text-text-primary"
                                    }`}
                                  >
                                    {day}
                                  </th>
                                );
                              })}
                              <th className="px-2 py-3 text-center font-bold text-green-700 bg-green-50 border-b border-r border-green-100 min-w-[50px]">P</th>
                              <th className="px-2 py-3 text-center font-bold text-red-700 bg-red-50 border-b border-r border-red-100 min-w-[50px]">V</th>
                              <th className="px-2 py-3 text-center font-bold text-blue-700 bg-blue-50 border-b border-r border-blue-100 min-w-[50px]">L</th>
                              <th className="px-2 py-3 text-center font-bold text-purple-700 bg-purple-50 border-b border-r border-purple-100 min-w-[50px]">S</th>
                              <th className="px-2 py-3 text-center font-bold text-yellow-700 bg-yellow-50 border-b border-yellow-100 min-w-[50px]">OT</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {matrixData.workerRows.length === 0 ? (
                              <tr>
                                <td colSpan={matrixData.dates.length + 7} className="px-6 py-12 text-center text-text-muted">
                                  Không có dữ liệu hiển thị
                                </td>
                              </tr>
                            ) : (
                              matrixData.workerRows.map((row) => (
                                <tr key={row.worker.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-2 font-medium text-text-secondary sticky left-0 bg-white z-20 border-r border-gray-200 group-hover:bg-gray-50">
                                    {row.worker.code}
                                  </td>
                                  <td className="px-3 py-2 font-semibold text-text-primary sticky left-[80px] bg-white z-20 border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] group-hover:bg-gray-50">
                                    {row.worker.name}
                                  </td>
                                  {row.dateData.map((record, idx) => {
                                    const date = matrixData.dates[idx];
                                    const d = new Date(date);
                                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                                    let cellContent = "";
                                    let cellClass = "";

                                    if (!record) {
                                      cellClass = isWeekend ? "bg-gray-50" : "";
                                    } else {
                                      switch (record.status) {
                                        case "present":
                                          cellContent = "P";
                                          cellClass = "bg-green-100 text-green-800 font-bold";
                                          break;
                                        case "absent":
                                          cellContent = "V";
                                          cellClass = "bg-red-100 text-red-800 font-bold";
                                          break;
                                        case "leave_paid":
                                        case "leave_unpaid":
                                          cellContent = "L";
                                          cellClass = "bg-blue-100 text-blue-800 font-bold";
                                          break;
                                        case "sick":
                                          cellContent = "S";
                                          cellClass = "bg-purple-100 text-purple-800 font-bold";
                                          break;
                                        case "ot":
                                          cellContent = "OT";
                                          cellClass = "bg-yellow-100 text-yellow-800 font-bold";
                                          break;
                                      }
                                    }

                                    return (
                                      <td
                                        key={idx}
                                        className={`px-1 py-2 text-center border-r border-gray-100 ${cellClass}`}
                                      >
                                        {cellContent}
                                      </td>
                                    );
                                  })}
                                  <td className="px-2 py-2 text-center font-bold bg-green-50 text-green-800 border-r border-green-100">
                                    {row.totals.present}
                                  </td>
                                  <td className="px-2 py-2 text-center font-bold bg-red-50 text-red-800 border-r border-red-100">
                                    {row.totals.absent}
                                  </td>
                                  <td className="px-2 py-2 text-center font-bold bg-blue-50 text-blue-800 border-r border-blue-100">
                                    {row.totals.leave}
                                  </td>
                                  <td className="px-2 py-2 text-center font-bold bg-purple-50 text-purple-800 border-r border-purple-100">
                                    {row.totals.sick}
                                  </td>
                                  <td className="px-2 py-2 text-center font-bold bg-yellow-50 text-yellow-800">
                                    {row.totals.ot}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {toast && <Toast message={toast} />}
      </div>
    </div>
  );
}
