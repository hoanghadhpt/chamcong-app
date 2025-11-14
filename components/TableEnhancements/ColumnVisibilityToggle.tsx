"use client";

import { useState, useRef, useEffect } from "react";

interface Column {
  key: string;
  label: string;
  visible: boolean;
  disabled?: boolean; // Some columns should always be visible
}

interface ColumnVisibilityToggleProps {
  columns: Column[];
  onToggle: (key: string) => void;
}

export default function ColumnVisibilityToggle({
  columns,
  onToggle,
}: ColumnVisibilityToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const visibleCount = columns.filter((col) => col.visible).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold shadow-sm"
      >
        <span>👁️</span>
        <span>Cột hiển thị</span>
        <span className="text-xs text-gray-500">
          ({visibleCount}/{columns.length})
        </span>
        <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b bg-gray-50">
            <p className="text-xs font-bold text-gray-700 uppercase">
              Chọn cột hiển thị
            </p>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.key}
                className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors ${
                  column.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={column.visible}
                  disabled={column.disabled}
                  onChange={() => !column.disabled && onToggle(column.key)}
                  className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-2 focus:ring-accent disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">
                  {column.label}
                </span>
                {column.disabled && (
                  <span className="ml-auto text-xs text-gray-400">(Bắt buộc)</span>
                )}
              </label>
            ))}
          </div>
          <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
            Chọn/bỏ chọn cột để tùy chỉnh hiển thị
          </div>
        </div>
      )}
    </div>
  );
}
