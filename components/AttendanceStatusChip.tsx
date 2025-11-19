"use client";

import { CheckCircle2, XCircle, Palmtree, AlertCircle, Stethoscope, Clock } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "leave_paid" | "leave_unpaid" | "sick" | "ot" | null;

interface AttendanceStatusChipProps {
  status: AttendanceStatus;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  present: { 
    bg: "bg-green-100", 
    text: "text-green-700", 
    label: "Có mặt",
    icon: CheckCircle2
  },
  absent: { 
    bg: "bg-red-100", 
    text: "text-red-700", 
    label: "Vắng",
    icon: XCircle
  },
  leave_paid: { 
    bg: "bg-blue-100", 
    text: "text-blue-700", 
    label: "Phép CL",
    icon: Palmtree
  },
  leave_unpaid: { 
    bg: "bg-orange-100", 
    text: "text-orange-700", 
    label: "Phép KL",
    icon: AlertCircle
  },
  sick: { 
    bg: "bg-purple-100", 
    text: "text-purple-700", 
    label: "Ốm",
    icon: Stethoscope
  },
  ot: { 
    bg: "bg-yellow-100", 
    text: "text-yellow-800", 
    label: "Tăng ca",
    icon: Clock
  },
};

export default function AttendanceStatusChip({
  status,
  className = "",
  size = "md",
}: AttendanceStatusChipProps) {
  if (!status || !STATUS_CONFIG[status]) {
    return (
      <span className={`inline-flex items-center justify-center px-2 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium ${className}`}>
        ---
      </span>
    );
  }

  const { bg, text, label, icon: Icon } = STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };

  return (
    <span
      className={`inline-flex items-center ${bg} ${text} ${sizeClasses[size]} rounded-lg font-bold whitespace-nowrap shadow-sm transition-all hover:opacity-90 ${className}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />
      {label}
    </span>
  );
}
