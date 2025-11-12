"use client";

import { useState } from "react";
import Toast from "@/components/Toast";
import { vi } from "@/lib/i18n";

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

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDate, toDate, format }),
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {vi.export.title}
        </h2>

        <form onSubmit={handleExport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {vi.export.fromDate}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {vi.export.toDate}
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base"
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
                onClick={() => setFormat("detail")}
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
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? vi.export.generating + "..." : vi.export.download}
          </button>
        </form>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-green-900 mb-2">
          💡 {vi.export.tips}
        </h3>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
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
