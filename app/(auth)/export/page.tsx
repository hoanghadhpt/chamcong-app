"use client";

import { useState } from "react";
import Toast from "@/components/Toast";

export default function ExportPage() {
  const [fromDate, setFromDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDate, toDate }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance_${fromDate}_to_${toDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast("Attendance exported successfully");
      } else {
        setToast("Failed to export attendance");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      setToast("An error occurred during export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-6">
          Export Attendance Report
        </h2>

        <form onSubmit={handleExport} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
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
                To Date
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

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Report Details:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Period: {new Date(fromDate).toLocaleDateString()} to{" "}
                {new Date(toDate).toLocaleDateString()}
              </li>
              <li>Format: Excel (.xlsx) with worker and attendance details</li>
              <li>Includes: Code, Name, Team, Date, Status, Check In/Out times</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {loading ? "Generating Excel..." : "Download Excel Report"}
          </button>
        </form>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-green-900 mb-2">
          💡 Tips for exporting:
        </h3>
        <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
          <li>Select a date range to include only the period you need</li>
          <li>The Excel file can be opened in Google Sheets, Excel, or Calc</li>
          <li>
            All data is aggregated per worker and sorted by date
          </li>
          <li>You can further edit or share the Excel file as needed</li>
        </ul>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
