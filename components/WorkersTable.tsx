"use client";

import { useState } from "react";
import { vi } from "@/lib/i18n";

interface Worker {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

interface WorkersTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (id: number) => void;
  searchQuery?: string;
}

export default function WorkersTable({
  workers,
  onEdit,
  onDelete,
  searchQuery = "",
}: WorkersTableProps) {
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Get unique teams
  const teams = Array.from(new Set(workers.map((w) => w.team || "Không có bộ phận")));

  // Filter workers
  const filteredWorkers = workers.filter((worker) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        worker.name.toLowerCase().includes(query) ||
        worker.code.toLowerCase().includes(query) ||
        (worker.team || "").toLowerCase().includes(query) ||
        (worker.phone || "").toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Team filter
    if (filterTeam !== "all") {
      if ((worker.team || "Không có bộ phận") !== filterTeam) return false;
    }

    // Status filter
    if (filterStatus === "active" && worker.active !== 1) return false;
    if (filterStatus === "inactive" && worker.active !== 0) return false;

    return true;
  });

  // Sort workers by name
  const sortedWorkers = [...filteredWorkers].sort((a, b) =>
    a.name.localeCompare(b.name, "vi")
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Filters */}
      <div className="p-4 bg-beige-50 border-b flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-sm text-gray-700">Bộ phận:</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Tất cả</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold text-sm text-gray-700">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Tất cả</option>
            <option value="active">✅ Đang làm</option>
            <option value="inactive">❌ Đã nghỉ</option>
          </select>
        </div>

        <div className="flex-1"></div>

        <div className="text-sm text-gray-600 font-medium">
          Hiển thị: <span className="text-accent font-bold">{sortedWorkers.length}</span> / {workers.length} nhân viên
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-12">STT</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Mã NV</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Họ tên</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Điện thoại</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Bộ phận</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Trạng thái</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-40">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedWorkers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <p>
                    {searchQuery || filterTeam !== "all" || filterStatus !== "all"
                      ? "Không tìm thấy nhân viên phù hợp"
                      : vi.workers.emptyState}
                  </p>
                </td>
              </tr>
            ) : (
              sortedWorkers.map((worker, index) => (
                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {worker.code}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {worker.name}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {worker.phone || "---"}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                    {worker.team || vi.workers.noTeam}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        worker.active === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {worker.active === 1 ? "✅ Đang làm" : "❌ Đã nghỉ"}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(worker)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-semibold text-xs transition-all shadow-sm"
                      >
                        ✏️ {vi.common.edit}
                      </button>
                      <button
                        onClick={() => onDelete(worker.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-semibold text-xs transition-all shadow-sm"
                      >
                        🗑️ {vi.common.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Summary */}
      <div className="p-3 bg-gray-50 border-t flex items-center justify-between text-sm">
        <div className="text-gray-600">
          <span className="font-semibold text-green-700">
            {workers.filter((w) => w.active === 1).length}
          </span>{" "}
          đang làm,{" "}
          <span className="font-semibold text-red-700">
            {workers.filter((w) => w.active === 0).length}
          </span>{" "}
          đã nghỉ
        </div>
        <div className="text-gray-500">
          Tổng: <span className="font-bold text-gray-900">{workers.length}</span> nhân viên
        </div>
      </div>
    </div>
  );
}
