"use client";

import React, { useState } from "react";
import AttendanceStatusChip from "./AttendanceStatusChip";
import { StatusCell, TimeCell, ShiftCell } from "./AttendanceTableCells";
import { extractTimeFromTimestamp } from "@/lib/i18n";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Palmtree, 
  AlertCircle, 
  Stethoscope, 
  Sun, 
  CloudSun,
  MoreHorizontal
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
}

interface AttendanceTableProps {
  workers: Worker[];
  attendance: Map<number, AttendanceRecord>;
  changes: Map<number, AttendanceRecord>;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
  onCheckOut: (workerId: number) => void;
  onTimeChange?: (workerId: number, field: 'check_in' | 'check_out', time: string) => void;
  searchQuery?: string;
}

const STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", icon: CheckCircle2, color: "bg-green-500", text: "text-green-700", bgLight: "bg-green-50" },
  { key: "absent", label: "Vắng", icon: XCircle, color: "bg-red-500", text: "text-red-700", bgLight: "bg-red-50" },
  { key: "leave_paid", label: "Phép CL", icon: Palmtree, color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-50" },
  { key: "leave_unpaid", label: "Phép KL", icon: AlertCircle, color: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50" },
  { key: "sick", label: "Ốm", icon: Stethoscope, color: "bg-purple-500", text: "text-purple-700", bgLight: "bg-purple-50" },
  { key: "ot", label: "Tăng ca", icon: Clock, color: "bg-yellow-500", text: "text-yellow-800", bgLight: "bg-yellow-50" },
];

export default function AttendanceTable({
  workers,
  attendance,
  changes,
  onStatusChange,
  onCheckOut,
  onTimeChange,
  searchQuery = "",
}: AttendanceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedWorkers, setSelectedWorkers] = useState<Set<number>>(new Set());
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

  const toggleSelectAll = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map((w) => w.id)));
    }
  };

  const toggleSelectRow = (workerId: number) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkers(newSelected);
  };

  const handleBulkStatusChange = (status: string) => {
    selectedWorkers.forEach((id) => {
      const current = changes.get(id) || attendance.get(id);
      onStatusChange(id, status, false, current?.shift_amount || 1.0);
    });
    setSelectedWorkers(new Set());
  };

  const handleBulkShiftChange = (shiftAmount: number) => {
    selectedWorkers.forEach((id) => {
      const current = changes.get(id) || attendance.get(id);
      if (current?.status) {
        onStatusChange(id, current.status, false, shiftAmount);
      }
    });
    setSelectedWorkers(new Set());
  };

  const handleBulkCheckOut = () => {
    selectedWorkers.forEach((id) => {
      const current = changes.get(id) || attendance.get(id);
      if (current?.status === "present") {
        onCheckOut(id);
      }
    });
    setSelectedWorkers(new Set());
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden relative">
      {/* Filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-secondary">Bộ phận:</span>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="text-sm font-medium text-text-primary bg-transparent border-none focus:ring-0 cursor-pointer pr-6"
          >
            <option value="all">Tất cả</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-secondary">Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm font-medium text-text-primary bg-transparent border-none focus:ring-0 cursor-pointer pr-6"
          >
            <option value="all">Tất cả</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1"></div>

        <div className="text-sm text-text-secondary font-medium flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
          <span>Hiển thị:</span>
          <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md font-bold">{filteredWorkers.length}</span>
          <span>/ {workers.length} nhân viên</span>
        </div>
      </div>

      {/* Bulk Action Bar - Top Sticky */}
      {selectedWorkers.size > 0 && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-md px-4 py-3 flex items-center gap-4 animate-fadeIn">
          <div className="font-bold text-sm whitespace-nowrap text-primary-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Đã chọn {selectedWorkers.size}
          </div>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleBulkStatusChange(option.key)}
                className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <option.icon className={`w-3 h-3 ${option.text}`} />
                {option.label}
              </button>
            ))}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button
              onClick={() => handleBulkShiftChange(1.0)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Sun className="w-3 h-3 text-orange-500" />
              1.0
            </button>
            <button
              onClick={() => handleBulkShiftChange(0.5)}
              className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-text-secondary hover:text-text-primary text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <CloudSun className="w-3 h-3 text-orange-400" />
              0.5
            </button>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <button
              onClick={handleBulkCheckOut}
              className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3 h-3" />
              Chấm ra
            </button>
          </div>
          <button
            onClick={() => setSelectedWorkers(new Set())}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-white shadow-sm">
            <tr className="bg-white border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedWorkers.size === filteredWorkers.length && filteredWorkers.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-12">STT</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Mã NV</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Họ tên</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Bộ phận</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Loại ca</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Giờ vào</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider">Giờ ra</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-24">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-text-muted">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">Không tìm thấy nhân viên phù hợp</p>
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker, index) => {
                const current = changes.get(worker.id) || attendance.get(worker.id);
                const isExpanded = expandedRows.has(worker.id);
                const isSelected = selectedWorkers.has(worker.id);
                const showHalfDaySelector =
                  current?.status === "leave_paid" ||
                  current?.status === "leave_unpaid" ||
                  current?.status === "sick" ||
                  current?.status === "absent";

                return (
                  <React.Fragment key={worker.id}>
                    <tr className={`hover:bg-primary-50/30 transition-colors ${isExpanded ? "bg-primary-50/20" : ""} ${isSelected ? "bg-blue-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(worker.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text-secondary">
                        {worker.code}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                        {worker.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        <span className="px-2 py-1 rounded-lg bg-gray-100 text-xs font-medium">
                          {worker.team || "---"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusCell
                          status={current?.status || null}
                          workerId={worker.id}
                          shiftAmount={current?.shift_amount || 1.0}
                          onStatusChange={onStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <ShiftCell
                          shiftAmount={current?.shift_amount || 1.0}
                          status={current?.status || null}
                          workerId={worker.id}
                          onStatusChange={onStatusChange}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <TimeCell
                          time={current?.check_in || null}
                          workerId={worker.id}
                          type="check_in"
                          status={current?.status || null}
                          onTimeChange={onTimeChange}
                          onMarkNow={() => onStatusChange(worker.id, "present", true, current?.shift_amount || 1.0)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <TimeCell
                          time={current?.check_out || null}
                          workerId={worker.id}
                          type="check_out"
                          status={current?.status || null}
                          onTimeChange={onTimeChange}
                          onMarkNow={() => onCheckOut(worker.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRowExpanded(worker.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            isExpanded 
                              ? "bg-primary-100 text-primary-600 rotate-90" 
                              : "text-text-muted hover:bg-gray-100 hover:text-text-primary"
                          }`}
                          title="Xem chi tiết"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row - Status Actions */}
                    {isExpanded && (
                      <tr className="animate-fadeIn">
                        <td colSpan={10} className="px-0 py-0 border-b border-gray-100">
                          <div className="bg-gray-50/50 p-4 lg:p-6 border-t border-gray-100 shadow-inner">
                            <div className="max-w-4xl mx-auto space-y-6">
                              {/* Status Buttons */}
                              <div>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Chọn trạng thái</p>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                  {STATUS_OPTIONS.map((option) => {
                                    const isActive = current?.status === option.key;
                                    const Icon = option.icon;
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
                                        className={`
                                          relative p-3 rounded-xl font-semibold transition-all text-sm flex flex-col items-center gap-2 group
                                          ${isActive
                                            ? `${option.color} text-white shadow-lg shadow-${option.color}/30 scale-105 ring-2 ring-offset-2 ring-${option.color}`
                                            : "bg-white text-text-secondary hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                          }
                                        `}
                                      >
                                        <Icon className={`w-6 h-6 ${isActive ? "text-white" : option.text}`} />
                                        <span>{option.label}</span>
                                        {isActive && (
                                          <div className="absolute -top-2 -right-2 bg-white text-primary-600 rounded-full p-0.5 shadow-sm">
                                            <CheckCircle2 className="w-4 h-4 fill-current" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Half-day selector */}
                                {showHalfDaySelector && (
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Loại ca</p>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() =>
                                          onStatusChange(worker.id, current?.status || "absent", false, 1.0)
                                        }
                                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                          (current?.shift_amount || 1.0) === 1.0
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                            : "bg-gray-50 text-text-secondary hover:bg-gray-100 border border-gray-200"
                                        }`}
                                      >
                                        <Sun className="w-5 h-5" />
                                        Cả ngày (1.0)
                                      </button>
                                      <button
                                        onClick={() =>
                                          onStatusChange(worker.id, current?.status || "absent", false, 0.5)
                                        }
                                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                          current?.shift_amount === 0.5
                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                            : "bg-gray-50 text-text-secondary hover:bg-gray-100 border border-gray-200"
                                        }`}
                                      >
                                        <CloudSun className="w-5 h-5" />
                                        Nửa ngày (0.5)
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Check-in/out editable time (for present status) */}
                                {current?.status === "present" && (
                                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
                                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Thời gian chấm công</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Check In */}
                                      <div className="space-y-2">
                                        <label className="text-xs text-text-secondary font-bold flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> Giờ vào
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="time"
                                            value={extractTimeFromTimestamp(current.check_in || null)}
                                            onChange={(e) => {
                                              if (onTimeChange) {
                                                onTimeChange(worker.id, 'check_in', e.target.value);
                                              }
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                                          />
                                          <button
                                            onClick={() =>
                                              onStatusChange(worker.id, "present", true, current.shift_amount || 1.0)
                                            }
                                            className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-green-500/20 whitespace-nowrap"
                                          >
                                            Hiện tại
                                          </button>
                                        </div>
                                      </div>

                                      {/* Check Out */}
                                      <div className="space-y-2">
                                        <label className="text-xs text-text-secondary font-bold flex items-center gap-1">
                                          <LogOut className="w-3 h-3" /> Giờ ra
                                        </label>
                                        <div className="flex gap-2">
                                          <input
                                            type="time"
                                            value={extractTimeFromTimestamp(current.check_out || null)}
                                            onChange={(e) => {
                                              if (onTimeChange) {
                                                onTimeChange(worker.id, 'check_out', e.target.value);
                                              }
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                          />
                                          <button
                                            onClick={() => onCheckOut(worker.id)}
                                            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap"
                                          >
                                            Hiện tại
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
