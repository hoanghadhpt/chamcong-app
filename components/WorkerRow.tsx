"use client";

import AttendanceStatusChip from "./AttendanceStatusChip";

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
    <div className={`bg-gray-50 rounded-xl p-4 border-l-4 border-blue-500 shadow-sm ${className}`}>
      {/* Worker Info Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-bold text-base text-gray-900">{worker.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">
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

      {/* Status Buttons - 3 columns grid for mobile */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {STATUS_OPTIONS.map((option) => {
          const isActive = currentStatus === option.key;
          return (
            <button
              key={option.key}
              onClick={() => onStatusChange(worker.id, option.key, false, currentShiftAmount)}
              className={`px-2 py-2.5 rounded-lg font-semibold transition-all text-xs sm:text-sm flex flex-col items-center justify-center gap-1 ${
                isActive
                  ? "bg-blue-500 text-white shadow-md scale-105"
                  : "bg-white text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-gray-300"
              }`}
            >
              <span className="text-base">{option.emoji}</span>
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
            className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
              currentShiftAmount === 1.0
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            🌞 Cả ngày
          </button>
          <button
            onClick={() => onStatusChange(worker.id, currentStatus || "absent", false, 0.5)}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
              currentShiftAmount === 0.5
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            🌤️ Nửa ngày
          </button>
        </div>
      )}

      {/* Check-in/Check-out Buttons (only for "present" status) */}
      {currentStatus === "present" && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onStatusChange(worker.id, "present", true, currentShiftAmount)}
            className="flex-1 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-4 py-3 rounded-lg font-bold transition-all text-sm sm:text-base shadow-md"
          >
            ⏰ Vào: {attendance?.check_in || "---"}
          </button>
          <button
            onClick={() => onCheckOut(worker.id)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-4 py-3 rounded-lg font-bold transition-all text-sm sm:text-base shadow-md"
          >
            🏁 Ra: {attendance?.check_out || "---"}
          </button>
        </div>
      )}
    </div>
  );
}
