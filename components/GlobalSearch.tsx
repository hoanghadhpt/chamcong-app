"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEscapeKey } from "@/hooks/useKeyboardShortcut";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  type: "page" | "worker" | "action";
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [workers, setWorkers] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 200);

  useEscapeKey(onClose);

  // Fetch workers when opened
  useEffect(() => {
    if (isOpen) {
      fetch("/api/workers")
        .then((res) => res.json())
        .then((data) => setWorkers(data))
        .catch((err) => console.error("Failed to fetch workers:", err));

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigation pages
  const pages: SearchResult[] = [
    {
      id: "page-home",
      type: "page",
      title: "Chấm công",
      subtitle: "Trang chấm công hàng ngày",
      icon: "✅",
      action: () => {
        router.push("/");
        onClose();
      },
    },
    {
      id: "page-workers",
      type: "page",
      title: "Nhân viên",
      subtitle: "Quản lý danh sách nhân viên",
      icon: "👥",
      action: () => {
        router.push("/workers");
        onClose();
      },
    },
    {
      id: "page-reports",
      type: "page",
      title: "Báo cáo",
      subtitle: "Xem báo cáo chi tiết và ma trận",
      icon: "📊",
      action: () => {
        router.push("/reports");
        onClose();
      },
    },
    {
      id: "page-export",
      type: "page",
      title: "Xuất báo cáo",
      subtitle: "Xuất báo cáo Excel",
      icon: "💾",
      action: () => {
        router.push("/export");
        onClose();
      },
    },
  ];

  // Filter results based on query
  const results: SearchResult[] = (() => {
    if (!debouncedQuery.trim()) {
      return pages; // Show pages by default
    }

    const q = debouncedQuery.toLowerCase();
    const filtered: SearchResult[] = [];

    // Search pages
    pages.forEach((page) => {
      if (
        page.title.toLowerCase().includes(q) ||
        page.subtitle?.toLowerCase().includes(q)
      ) {
        filtered.push(page);
      }
    });

    // Search workers
    workers.forEach((worker) => {
      if (
        worker.name.toLowerCase().includes(q) ||
        worker.code.toLowerCase().includes(q) ||
        (worker.team || "").toLowerCase().includes(q)
      ) {
        filtered.push({
          id: `worker-${worker.id}`,
          type: "worker",
          title: worker.name,
          subtitle: `${worker.code} · ${worker.team || "Không có bộ phận"}`,
          icon: "👤",
          action: () => {
            router.push(`/workers`);
            onClose();
          },
        });
      }
    });

    return filtered.slice(0, 8); // Limit to 8 results
  })();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Modal */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[60vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm trang, nhân viên..."
                className="flex-1 text-lg outline-none"
                aria-label="Tìm kiếm"
                id="search-title"
              />
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                Esc
              </kbd>
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[calc(60vh-80px)]" role="listbox">
            {results.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">Không tìm thấy kết quả</p>
                <p className="text-sm mt-1">Thử từ khóa khác</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={result.id}
                      onClick={result.action}
                      className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "bg-accent/10 border-l-4 border-accent"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="text-2xl" aria-hidden="true">
                        {result.icon}
                      </span>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-600">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.type === "page" && (
                        <span className="text-xs text-gray-400">Trang</span>
                      )}
                      {result.type === "worker" && (
                        <span className="text-xs text-gray-400">Nhân viên</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono">↑</kbd>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono">↓</kbd>
                <span>Di chuyển</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded font-mono">Enter</kbd>
                <span>Chọn</span>
              </span>
            </div>
            <div className="text-gray-500">
              {results.length} kết quả
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
