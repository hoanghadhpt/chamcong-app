"use client";

import { useState } from "react";
import AttendanceStatusChip from "./AttendanceStatusChip";

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
}

interface AttendanceTableProps {
  workers: Worker[];
  attendance: Map<number, AttendanceRecord>;
  changes: Map<number, AttendanceRecord>;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
  onCheckOut: (workerId: number) => void;
  searchQuery?: string;
}

const STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", emoji: "✅", color: "bg-green-500" },
  { key: "absent", label: "Vắng", emoji: "❌", color: "bg-red-500" },
  { key: "leave_paid", label: "Phép CL", emoji: "🏖️", color: "bg-blue-500" },
  { key: "leave_unpaid", label: "Phép KL", emoji: "🚫", color: "bg-orange-500" },
  { key: "sick", label: "Ốm", emoji: "🤒", color: "bg-purple-500" },
  { key: "ot", label: "Tăng ca", emoji: "⏰", color: "bg-yellow-500" },
];

export default function AttendanceTable({
  workers,
  attendance,
  changes,
  onStatusChange,
  onCheckOut,
  searchQuery = "",
}: AttendanceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
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
        (worker.team || "").toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Team filter
    if (filterTeam !== "all") {
      if ((worker.team || "Không có bộ phận") !== filterTeam) return false;
    }

    // Status filter
    if (filterStatus !== "all") {
      const current = changes.get(worker.id) || attendance.get(worker.id);
      if (current?.status !== filterStatus) return false;
    }

    return true;
  });

  const toggleRowExpanded = (workerId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(workerId)) {
      newExpanded.delete(workerId);
    } else {
      newExpanded.add(workerId);
    }
    setExpandedRows(newExpanded);
  };

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
            {STATUS_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1"></div>

        <div className="text-sm text-gray-600 font-medium">
          Hiển thị: <span className="text-accent font-bold">{filteredWorkers.length}</span> / {workers.length} nhân viên
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
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Bộ phận</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">Trạng thái</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Loại ca</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Giờ vào</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">Giờ ra</th>
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-24">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <p>Không tìm thấy nhân viên phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker, index) => {
                const current = changes.get(worker.id) || attendance.get(worker.id);
                const isExpanded = expandedRows.has(worker.id);
                const showHalfDaySelector =
                  current?.status === "leave_paid" ||
                  current?.status === "leave_unpaid" ||
                  current?.status === "sick" ||
                  current?.status === "absent";

                return (
                  <>
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
                        {worker.team || "---"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <AttendanceStatusChip status={current?.status as any} size="sm" />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                        {current?.status ? (
                          <span className="font-semibold">
                            {current.shift_amount === 0.5 ? "🌤️ 0.5" : "🌞 1.0"}
                          </span>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                        {current?.status === "present" ? (
                          <button
                            onClick={() => onStatusChange(worker.id, "present", true, current.shift_amount || 1.0)}
                            className="text-green-600 hover:text-green-800 font-semibold hover:underline"
                          >
                            {current.check_in || "Chấm vào"}
                          </button>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                        {current?.status === "present" ? (
                          <button
                            onClick={() => onCheckOut(worker.id)}
                            className="text-orange-600 hover:text-orange-800 font-semibold hover:underline"
                          >
                            {current.check_out || "Chấm ra"}
                          </button>
                        ) : (
                          <span className="text-gray-400">---</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleRowExpanded(worker.id)}
                          className="text-accent hover:text-blue-700 font-bold text-lg"
                          title="Xem chi tiết"
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row - Status Actions */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            {/* Status Buttons */}
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">Chọn trạng thái:</p>
                              <div className="grid grid-cols-6 gap-2">
                                {STATUS_OPTIONS.map((option) => {
                                  const isActive = current?.status === option.key;
                                  return (
                                    <button
                                      key={option.key}
                                      onClick={() =>
                                        onStatusChange(
                                          worker.id,
                                          option.key,
                                          false,
                                          current?.shift_amount || 1.0
                                        )
                                      }
                                      className={`px-3 py-2 rounded-lg font-semibold transition-all text-sm flex flex-col items-center gap-1 ${
                                        isActive
                                          ? `${option.color} text-white shadow-md`
                                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                      }`}
                                    >
                                      <span className="text-lg">{option.emoji}</span>
                                      <span className="text-xs">{option.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Half-day selector */}
                            {showHalfDaySelector && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">Loại ca:</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      onStatusChange(worker.id, current?.status || "absent", false, 1.0)
                                    }
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                                      (current?.shift_amount || 1.0) === 1.0
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                    }`}
                                  >
                                    🌞 Cả ngày (1.0)
                                  </button>
                                  <button
                                    onClick={() =>
                                      onStatusChange(worker.id, current?.status || "absent", false, 0.5)
                                    }
                                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                                      current?.shift_amount === 0.5
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                                    }`}
                                  >
                                    🌤️ Nửa ngày (0.5)
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Check-in/out buttons (for present status) */}
                            {current?.status === "present" && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">Chấm công:</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      onStatusChange(worker.id, "present", true, current.shift_amount || 1.0)
                                    }
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-bold transition-all shadow-md"
                                  >
                                    ⏰ Vào: {current.check_in || "---"}
                                  </button>
                                  <button
                                    onClick={() => onCheckOut(worker.id)}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-bold transition-all shadow-md"
                                  >
                                    🏁 Ra: {current.check_out || "---"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
