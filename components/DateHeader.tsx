"use client";

import { formatDate } from "@/lib/i18n";

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
  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  const displayDate = new Date(selectedDate);
  const formattedDate = displayDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      {/* Title */}
      <h2 className="text-xl font-bold text-primary mb-3">
        📅 Chấm công ngày
      </h2>

      {/* Date Picker with Today Badge */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-base font-medium transition-all"
        />
        {isToday && (
          <span className="text-xs bg-blue-500 text-white px-3 py-2 rounded-lg font-bold whitespace-nowrap shadow-sm">
            Hôm nay
          </span>
        )}
      </div>

      {/* Formatted Date Display */}
      <p className="text-sm text-gray-600 mt-2 font-medium">
        {formattedDate}
      </p>
    </div>
  );
}
