"use client";

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
  return (
    <div className={`bg-white rounded-xl shadow-md p-4 ${className}`}>
      {/* Search Box */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            placeholder="Tìm tổ, tên hoặc mã NV..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-base transition-all"
          />
        </div>

        {/* Expand/Collapse Buttons - Mobile Optimized */}
        <button
          onClick={onExpandAll}
          title="Mở rộng tất cả"
          className="p-3 bg-beige-100 text-primary rounded-xl hover:bg-beige-200 active:bg-beige-200/80 transition-all font-bold text-base min-w-[48px] shadow-sm"
          aria-label="Mở rộng tất cả"
        >
          ▼
        </button>
        <button
          onClick={onCollapseAll}
          title="Thu gọn tất cả"
          className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-all font-bold text-base min-w-[48px] shadow-sm"
          aria-label="Thu gọn tất cả"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
