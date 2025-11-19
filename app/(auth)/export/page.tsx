"use client";

import { useState } from "react";
import Toast from "@/components/Toast";
import { vi, formatDateLocal } from "@/lib/i18n";
import { 
  Download, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  LayoutGrid, 
  List, 
  CheckSquare, 
  Square, 
  Info,
  Loader2
} from "lucide-react";

const DETAIL_COLUMNS = [
  { key: "date", label: "Ngày" },
  { key: "workerCode", label: "Mã NV" },
  { key: "workerName", label: "Họ tên" },
  { key: "team", label: "Bộ phận" },
  { key: "status", label: "Trạng thái" },
  { key: "shiftAmount", label: "Loại ca" },
  { key: "checkIn", label: "Vào" },
  { key: "checkOut", label: "Ra" },
  { key: "lateMinutes", label: "Trễ (phút)" },
  { key: "earlyMinutes", label: "Sớm (phút)" },
  { key: "ot_1_5", label: "OT 1.5x" },
  { key: "ot_2_0", label: "OT 2.0x" },
  { key: "ot_3_0", label: "OT 3.0x" },
  { key: "note", label: "Ghi chú" },
];

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

export default function ExportPage() {
  // Initialize with current month
  const currentMonth = getCurrentMonthBounds();
  const [fromDate, setFromDate] = useState(currentMonth.firstDay);
  const [toDate, setToDate] = useState(currentMonth.lastDay);
  const [format, setFormat] = useState<"detail" | "matrix">("detail");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(DETAIL_COLUMNS.map((col) => col.key))
  );
  const [showColumnSelection, setShowColumnSelection] = useState(false);

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

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate,
          toDate,
          format,
          selectedColumns: format === "detail" ? Array.from(selectedColumns) : undefined,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const formatName = format === "detail" ? "chi_tiet" : "ma_tran";
        a.download = `chamcong_${formatName}_${fromDate}_den_${toDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast(vi.export.exportSuccess);
      } else {
        setToast(vi.export.exportError);
      }
    } catch (error) {
      console.error("Error exporting:", error);
      setToast(vi.common.exportError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Download className="w-8 h-8 text-primary-500" />
            {vi.export.title}
          </h1>
          <p className="text-text-secondary mt-1">Xuất dữ liệu chấm công ra file Excel</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-6 lg:p-8 border border-gray-100">
              <form onSubmit={handleExport} className="space-y-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1 border border-gray-200">
                  <button
                    type="button"
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
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-text-secondary transition-all"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 mx-2"></div>
                  <button
                    type="button"
                    onClick={goToCurrentMonth}
                    className="px-3 py-1.5 text-sm font-semibold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    Hôm nay
                  </button>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      {vi.export.fromDate}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays className="h-5 w-5 text-text-muted" />
                      </div>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">
                      {vi.export.toDate}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays className="h-5 w-5 text-text-muted" />
                      </div>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-3">
                    {vi.export.format}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormat("detail");
                        setShowColumnSelection(false);
                      }}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        format === "detail"
                          ? "border-primary-500 bg-primary-50/50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${format === "detail" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"}`}>
                          <List className="w-5 h-5" />
                        </div>
                        {format === "detail" && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                      </div>
                      <div className="font-bold text-text-primary">{vi.export.detailFormat}</div>
                      <div className="text-xs text-text-secondary mt-1">{vi.export.detailDesc}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat("matrix")}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        format === "matrix"
                          ? "border-primary-500 bg-primary-50/50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg ${format === "matrix" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"}`}>
                          <LayoutGrid className="w-5 h-5" />
                        </div>
                        {format === "matrix" && <div className="w-3 h-3 rounded-full bg-primary-500"></div>}
                      </div>
                      <div className="font-bold text-text-primary">{vi.export.matrixFormat}</div>
                      <div className="text-xs text-text-secondary mt-1">{vi.export.matrixDesc}</div>
                    </button>
                  </div>
                </div>

                {/* Column selection for detail format */}
                {format === "detail" && (
                  <div className="animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => setShowColumnSelection(!showColumnSelection)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-text-primary rounded-xl font-semibold transition-all text-left flex items-center justify-between border border-gray-200"
                    >
                      <span className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-primary-500" />
                        Chọn cột cần xuất ({selectedColumns.size}/{DETAIL_COLUMNS.length})
                      </span>
                      <ChevronRight className={`w-5 h-5 transition-transform ${showColumnSelection ? "rotate-90" : ""}`} />
                    </button>

                    {showColumnSelection && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2 space-y-4 shadow-sm animate-slideUp">
                        <div className="grid grid-cols-2 gap-3">
                          {DETAIL_COLUMNS.map((col) => (
                            <label key={col.key} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                              <div className="relative flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedColumns.has(col.key)}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedColumns);
                                    if (e.target.checked) {
                                      newSelected.add(col.key);
                                    } else {
                                      newSelected.delete(col.key);
                                    }
                                    setSelectedColumns(newSelected);
                                  }}
                                  className="peer sr-only"
                                />
                                <div className="w-5 h-5 border-2 border-gray-300 rounded transition-colors peer-checked:bg-primary-500 peer-checked:border-primary-500"></div>
                                <CheckSquare className="w-5 h-5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                              </div>
                              <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">{col.label}</span>
                            </label>
                          ))}
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setSelectedColumns(new Set(DETAIL_COLUMNS.map((c) => c.key)))}
                            className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors"
                          >
                            Chọn tất cả
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedColumns(new Set())}
                            className="flex-1 px-3 py-2 bg-gray-100 text-text-secondary rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                          >
                            Bỏ chọn tất cả
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-success hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {vi.export.generating}...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-6 h-6" />
                      {vi.export.download}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-500" />
                Chi tiết báo cáo
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xs text-text-muted uppercase font-bold mb-1">Thời gian</div>
                  <div className="font-medium text-text-primary">
                    {new Date(fromDate).toLocaleDateString("vi-VN")} - {new Date(toDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xs text-text-muted uppercase font-bold mb-1">Định dạng</div>
                  <div className="font-medium text-text-primary flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-success" />
                    Excel (.xlsx)
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-xs text-text-muted uppercase font-bold mb-1">Nội dung</div>
                  <div className="font-medium text-text-primary">
                    {format === "detail" ? vi.export.detailIncludes : vi.export.matrixIncludes}
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-sm p-6 border border-primary-100">
              <h3 className="font-bold text-primary-800 mb-3 flex items-center gap-2">
                💡 {vi.export.tips}
              </h3>
              <ul className="space-y-3">
                {[
                  vi.export.tip1,
                  vi.export.tip2,
                  vi.export.tip3,
                  vi.export.tip4
                ].map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-primary-900/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0"></span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
