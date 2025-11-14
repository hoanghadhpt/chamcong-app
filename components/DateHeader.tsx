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
    <div className={`bg-gradient-to-br from-beige-50 to-white rounded-xl shadow-lg border border-beige-200 p-5 ${className}`}>
      {/* Title */}
      <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
        <span className="text-2xl">📅</span>
        <span>Chấm công ngày</span>
      </h2>

      {/* Date Picker with Today Badge */}
      <div className="flex gap-2 items-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-beige-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-base font-medium transition-all hover:border-accent-light"
        />
        {isToday && (
          <span className="text-xs bg-gradient-to-r from-accent to-accent-light text-white px-3 py-2 rounded-lg font-bold whitespace-nowrap shadow-md">
            Hôm nay
          </span>
        )}
      </div>

      {/* Formatted Date Display */}
      <p className="text-sm text-warm-dark/70 mt-3 font-medium">
        {formattedDate}
      </p>
    </div>
  );
}
