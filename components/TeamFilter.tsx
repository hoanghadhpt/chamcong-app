"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

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
    <div className={`bg-white rounded-2xl shadow-card border border-gray-100 p-4 ${className}`}>
      <div className="flex gap-3 items-center">
        {/* Search Box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-text-muted" />
          </div>
          <input
            type="text"
            placeholder="Tìm tổ, tên hoặc mã NV..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary placeholder:text-text-muted font-medium"
          />
        </div>

        {/* Expand/Collapse Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onExpandAll}
            title="Mở rộng tất cả"
            className="p-3 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 active:scale-95 transition-all border border-primary-100 shadow-sm"
            aria-label="Mở rộng tất cả"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onCollapseAll}
            title="Thu gọn tất cả"
            className="p-3 bg-gray-50 text-text-secondary rounded-xl hover:bg-gray-100 active:scale-95 transition-all border border-gray-200 shadow-sm"
            aria-label="Thu gọn tất cả"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
