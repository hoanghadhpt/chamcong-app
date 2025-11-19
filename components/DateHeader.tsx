"use client";

import { formatDate } from "@/lib/i18n";
import { CalendarDays } from "lucide-react";

interface DateHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export default function DateHeader({
  selectedDate,
  onDateChange,
  className = "",
}: DateHeaderProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = selectedDate === today;

  const displayDate = new Date(selectedDate);
  const formattedDate = displayDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-gray-100 p-5 h-full flex flex-col justify-center ${className}`}>
      {/* Title */}
      <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
          <CalendarDays className="w-5 h-5" />
        </div>
        <span>Chấm công ngày</span>
      </h2>

      {/* Date Picker with Today Badge */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-base font-medium transition-all hover:bg-white"
          />
        </div>
        {isToday && (
          <span className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-lg font-bold whitespace-nowrap border border-success/20">
            Hôm nay
          </span>
        )}
      </div>

      {/* Formatted Date Display */}
      <p className="text-sm text-text-muted mt-2 font-medium capitalize">
        {formattedDate}
      </p>
    </div>
  );
}
