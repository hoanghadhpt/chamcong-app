"use client";

type AttendanceStatus = "present" | "absent" | "leave_paid" | "leave_unpaid" | "sick" | "ot" | null;

interface AttendanceStatusChipProps {
  status: AttendanceStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-green-100", text: "text-green-800", label: "Có mặt" },
  absent: { bg: "bg-red-100", text: "text-red-800", label: "Vắng" },
  leave_paid: { bg: "bg-blue-100", text: "text-blue-800", label: "Phép CL" },
  leave_unpaid: { bg: "bg-orange-100", text: "text-orange-800", label: "Phép KL" },
  sick: { bg: "bg-purple-100", text: "text-purple-800", label: "Ốm" },
  ot: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Tăng ca" },
};

export default function AttendanceStatusChip({
  status,
  className = "",
  size = "md",
}: AttendanceStatusChipProps) {
  if (!status || !STATUS_COLORS[status]) {
    return (
      <span className={`text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg ${className}`}>
        ---
      </span>
    );
  }

  const { bg, text, label } = STATUS_COLORS[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`${bg} ${text} ${sizeClasses[size]} rounded-lg font-bold whitespace-nowrap shadow-sm ${className}`}
    >
      {label}
    </span>
  );
}
