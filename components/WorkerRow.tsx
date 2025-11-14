"use client";

import AttendanceStatusChip from "./AttendanceStatusChip";
import { extractTimeFromTimestamp } from "@/lib/i18n";

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
  { key: "present", label: "Có mặt", emoji: "✅" },
  { key: "absent", label: "Vắng", emoji: "❌" },
  { key: "leave_paid", label: "Phép CL", emoji: "🏖️" },
  { key: "leave_unpaid", label: "Phép KL", emoji: "🚫" },
  { key: "sick", label: "Ốm", emoji: "🤒" },
  { key: "ot", label: "Tăng ca", emoji: "⏰" },
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
    <div className={`bg-gray-50 rounded-xl p-4 lg:p-5 border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Worker Info Header */}
      <div className="flex items-start justify-between mb-3 lg:mb-4">
        <div className="flex-1">
          <p className="font-bold text-base lg:text-lg text-gray-900">{worker.name}</p>
          <p className="text-xs lg:text-sm text-gray-600 mt-0.5">
            {worker.code} {worker.team && `• ${worker.team}`}
          </p>
        </div>
        {currentStatus && (
          <AttendanceStatusChip
            status={currentStatus as any}
            size="sm"
          />
        )}
      </div>

      {/* Status Buttons - 3 columns on mobile, 6 columns on desktop */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        {STATUS_OPTIONS.map((option) => {
          const isActive = currentStatus === option.key;
          return (
            <button
              key={option.key}
              onClick={() => onStatusChange(worker.id, option.key, false, currentShiftAmount)}
              className={`px-2 lg:px-3 py-2.5 lg:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm lg:text-base flex flex-col items-center justify-center gap-1 ${
                isActive
                  ? "bg-blue-500 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-300"
              }`}
            >
              <span className="text-base lg:text-lg">{option.emoji}</span>
              <span className="leading-tight">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Half-day Selector */}
      {showHalfDaySelector && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onStatusChange(worker.id, currentStatus || "absent", false, 1.0)}
            className={`flex-1 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition-all text-sm lg:text-base ${
              currentShiftAmount === 1.0
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            🌞 Cả ngày
          </button>
          <button
            onClick={() => onStatusChange(worker.id, currentStatus || "absent", false, 0.5)}
            className={`flex-1 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition-all text-sm lg:text-base ${
              currentShiftAmount === 0.5
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            🌤️ Nửa ngày
          </button>
        </div>
      )}

      {/* Check-in/Check-out (only for "present" status) */}
      {currentStatus === "present" && (
        <div className="space-y-2">
          {/* Check In */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">⏰ Giờ vào</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={extractTimeFromTimestamp(attendance?.check_in || null)}
                onChange={(e) => {
                  if (onTimeChange) {
                    onTimeChange(worker.id, 'check_in', e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="--:--"
              />
              <button
                onClick={() => onStatusChange(worker.id, "present", true, currentShiftAmount)}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-xs transition-all shadow-sm whitespace-nowrap"
              >
                Hiện tại
              </button>
            </div>
          </div>

          {/* Check Out */}
          <div className="space-y-1">
            <label className="text-xs text-gray-600 font-medium">🏁 Giờ ra</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={extractTimeFromTimestamp(attendance?.check_out || null)}
                onChange={(e) => {
                  if (onTimeChange) {
                    onTimeChange(worker.id, 'check_out', e.target.value);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="--:--"
              />
              <button
                onClick={() => onCheckOut(worker.id)}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-xs transition-all shadow-sm whitespace-nowrap"
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
