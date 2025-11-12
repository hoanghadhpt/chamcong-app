"use client";

import { useState } from "react";
import Toast from "@/components/Toast";
import { vi } from "@/lib/i18n";

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

export default function ExportPage() {
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [format, setFormat] = useState<"detail" | "matrix">("detail");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(DETAIL_COLUMNS.map((col) => col.key))
  );
  const [showColumnSelection, setShowColumnSelection] = useState(false);

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
    <div className="space-y-4 max-w-7xl mx-auto p-4 lg:p-6 xl:p-8">
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-6 lg:mb-8">
          {vi.export.title}
        </h2>

        <form onSubmit={handleExport} className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                {vi.export.fromDate}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 lg:px-5 py-3 lg:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                {vi.export.toDate}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 lg:px-5 py-3 lg:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {vi.export.format}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormat("detail");
                  setShowColumnSelection(false);
                }}
                className={`px-4 py-3 rounded-lg border-2 transition font-semibold text-left ${
                  format === "detail"
                    ? "border-accent bg-blue-50 text-accent"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="font-bold">{vi.export.detailFormat}</div>
                <div className="text-xs mt-1">{vi.export.detailDesc}</div>
              </button>
              <button
                type="button"
                onClick={() => setFormat("matrix")}
                className={`px-4 py-3 rounded-lg border-2 transition font-semibold text-left ${
                  format === "matrix"
                    ? "border-accent bg-blue-50 text-accent"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                <div className="font-bold">{vi.export.matrixFormat}</div>
                <div className="text-xs mt-1">{vi.export.matrixDesc}</div>
              </button>
            </div>
          </div>

          {/* Column selection for detail format */}
          {format === "detail" && (
            <div>
              <button
                type="button"
                onClick={() => setShowColumnSelection(!showColumnSelection)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition text-left flex items-center justify-between"
              >
                <span>📊 Chọn cột cần xuất ({selectedColumns.size}/{DETAIL_COLUMNS.length})</span>
                <span>{showColumnSelection ? "▼" : "▶"}</span>
              </button>

              {showColumnSelection && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {DETAIL_COLUMNS.map((col) => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer">
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
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700">{col.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSelectedColumns(new Set(DETAIL_COLUMNS.map((c) => c.key)))}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-semibold hover:bg-blue-200 transition"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedColumns(new Set())}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300 transition"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">{vi.export.reportDetails}:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                {vi.export.period}: {new Date(fromDate).toLocaleDateString("vi-VN")} {vi.common.to}{" "}
                {new Date(toDate).toLocaleDateString("vi-VN")}
              </li>
              <li>{vi.export.formatLabel}: Excel (.xlsx)</li>
              {format === "detail" ? (
                <li>{vi.export.detailIncludes}</li>
              ) : (
                <li>{vi.export.matrixIncludes}</li>
              )}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3 lg:py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-base lg:text-xl shadow-md"
          >
            {loading ? vi.export.generating + "..." : vi.export.download}
          </button>
        </form>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 lg:p-6">
        <h3 className="font-bold text-green-900 mb-2 lg:mb-3 text-base lg:text-lg">
          💡 {vi.export.tips}
        </h3>
        <ul className="text-sm lg:text-base text-green-800 space-y-1 lg:space-y-2 list-disc list-inside">
          <li>{vi.export.tip1}</li>
          <li>{vi.export.tip2}</li>
          <li>{vi.export.tip3}</li>
          <li>{vi.export.tip4}</li>
        </ul>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
