"use client";

import { useState, useEffect } from "react";

interface TeamFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  className?: string;
}

export default function TeamFilter({
  searchQuery,
  onSearchChange,
  onExpandAll,
  onCollapseAll,
  className = "",
}: TeamFilterProps) {
  // Local state for immediate UI feedback
  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce effect: update parent after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== searchQuery) {
        onSearchChange(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, searchQuery, onSearchChange]);

  // Sync with external changes
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  return (
    <div className={`bg-gradient-to-br from-white to-beige-50 rounded-xl shadow-md border border-beige-200 p-4 lg:p-5 ${className}`}>
      {/* Search Box */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary text-lg lg:text-xl">
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm tổ, tên hoặc mã NV..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-3.5 border-2 border-beige-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-base lg:text-lg transition-all hover:border-accent-light"
          />
        </div>

        {/* Expand/Collapse Buttons - Responsive */}
        <button
          onClick={onExpandAll}
          title="Mở rộng tất cả"
          className="p-3 lg:p-3.5 bg-gradient-to-br from-accent-light to-accent text-white rounded-xl hover:shadow-lg active:scale-95 transition-all font-bold text-base lg:text-lg min-w-[48px] lg:min-w-[56px] shadow-md"
          aria-label="Mở rộng tất cả"
        >
          ▼
        </button>
        <button
          onClick={onCollapseAll}
          title="Thu gọn tất cả"
          className="p-3 lg:p-3.5 bg-beige-100 text-warm-dark rounded-xl hover:bg-beige-200 active:scale-95 transition-all font-bold text-base lg:text-lg min-w-[48px] lg:min-w-[56px] shadow-md border border-beige-200"
          aria-label="Thu gọn tất cả"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
