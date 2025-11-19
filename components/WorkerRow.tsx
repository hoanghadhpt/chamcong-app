"use client";

import AttendanceStatusChip from "./AttendanceStatusChip";
import { extractTimeFromTimestamp } from "@/lib/i18n";
import { Clock, LogOut } from "lucide-react";

interface Worker {
  id: number;
  code: string;
  name: string;
  team: string | null;
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

interface WorkerRowProps {
  worker: Worker;
  attendance: AttendanceRecord | undefined;
  onStatusChange: (workerId: number, status: string, isCheckIn: boolean, shiftAmount: number) => void;
  onCheckOut: (workerId: number) => void;
  onTimeChange?: (workerId: number, field: 'check_in' | 'check_out', time: string) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { key: "present", label: "Có mặt", emoji: "✅", activeClass: "bg-success text-white ring-2 ring-success ring-offset-2" },
  { key: "absent", label: "Vắng", emoji: "❌", activeClass: "bg-error text-white ring-2 ring-error ring-offset-2" },
  { key: "leave_paid", label: "Phép CL", emoji: "🏖️", activeClass: "bg-primary-400 text-white ring-2 ring-primary-400 ring-offset-2" },
  { key: "leave_unpaid", label: "Phép KL", emoji: "🚫", activeClass: "bg-gray-500 text-white ring-2 ring-gray-500 ring-offset-2" },
  { key: "sick", label: "Ốm", emoji: "🤒", activeClass: "bg-warning text-white ring-2 ring-warning ring-offset-2" },
  { key: "ot", label: "Tăng ca", emoji: "⏰", activeClass: "bg-purple-500 text-white ring-2 ring-purple-500 ring-offset-2" },
];

export default function WorkerRow({
  worker,
  attendance,
  onStatusChange,
  onCheckOut,
  onTimeChange,
  className = "",
}: WorkerRowProps) {
  const currentStatus = attendance?.status;
  const currentShiftAmount = attendance?.shift_amount || 1.0;

  const showHalfDaySelector =
    currentStatus === "leave_paid" ||
    currentStatus === "leave_unpaid" ||
    currentStatus === "sick" ||
    currentStatus === "absent";

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 ${className}`}>
      {/* Worker Info Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-text-primary">{worker.name}</p>
            {worker.team && (
              <span className="px-2 py-0.5 bg-surface-highlight text-primary-700 text-xs font-medium rounded-full">
                {worker.team}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1 font-mono">
            #{worker.code}
          </p>
        </div>
        {currentStatus && (
          <AttendanceStatusChip
            status={currentStatus as any}
            size="sm"
          />
        )}
      </div>

      {/* Status Buttons */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {STATUS_OPTIONS.map((option) => {
          const isActive = currentStatus === option.key;
          return (
            <button
              key={option.key}
              onClick={() => onStatusChange(worker.id, option.key, false, currentShiftAmount)}
              className={`
                relative px-2 py-3 rounded-xl font-medium transition-all duration-200 
                flex flex-col items-center justify-center gap-1.5 min-h-[64px]
                ${isActive 
                  ? option.activeClass 
                  : "bg-gray-50 text-text-secondary hover:bg-gray-100 border border-transparent hover:border-gray-200"
                }
              `}
            >
              <span className="text-xl filter drop-shadow-sm">{option.emoji}</span>
              <span className="text-xs leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Half-day Selector */}
      {showHalfDaySelector && (
        <div className="flex gap-3 mb-4 animate-scaleIn">
          <button
            onClick={() => onStatusChange(worker.id, currentStatus || "absent", false, 1.0)}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 ${
              currentShiftAmount === 1.0
                ? "bg-primary-500 text-white shadow-md ring-2 ring-primary-500 ring-offset-1"
                : "bg-gray-50 text-text-secondary hover:bg-gray-100"
            }`}
          >
            <span>🌞</span> Cả ngày
          </button>
          <button
            onClick={() => onStatusChange(worker.id, currentStatus || "absent", false, 0.5)}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all text-sm flex items-center justify-center gap-2 ${
              currentShiftAmount === 0.5
                ? "bg-primary-500 text-white shadow-md ring-2 ring-primary-500 ring-offset-1"
                : "bg-gray-50 text-text-secondary hover:bg-gray-100"
            }`}
          >
            <span>🌤️</span> Nửa ngày
          </button>
        </div>
      )}

      {/* Check-in/Check-out (only for "present" status) */}
      {currentStatus === "present" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-scaleIn bg-surface-highlight/50 p-4 rounded-xl border border-primary-100">
          {/* Check In */}
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Giờ vào
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={extractTimeFromTimestamp(attendance?.check_in || null)}
                onChange={(e) => {
                  if (onTimeChange) {
                    onTimeChange(worker.id, 'check_in', e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
              />
              <button
                onClick={() => onStatusChange(worker.id, "present", true, currentShiftAmount)}
                className="px-4 py-2 bg-success hover:bg-success/90 text-white rounded-lg font-medium text-xs transition-all shadow-sm whitespace-nowrap"
              >
                Hiện tại
              </button>
            </div>
          </div>

          {/* Check Out */}
          <div className="space-y-2">
            <label className="text-xs text-text-muted font-semibold uppercase tracking-wider flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Giờ ra
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={extractTimeFromTimestamp(attendance?.check_out || null)}
                onChange={(e) => {
                  if (onTimeChange) {
                    onTimeChange(worker.id, 'check_out', e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
              <button
                onClick={() => onCheckOut(worker.id)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium text-xs transition-all shadow-sm whitespace-nowrap"
              >
                Hiện tại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
