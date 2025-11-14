"use client";

import { useEscapeKey } from "@/hooks/useKeyboardShortcut";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ["Ctrl", "K"], description: "Mở tìm kiếm nhanh", category: "Navigation" },
  { keys: ["Ctrl", "N"], description: "Thêm mới (tùy trang)", category: "Navigation" },
  { keys: ["Esc"], description: "Đóng modal/hủy", category: "Navigation" },
  { keys: ["?"], description: "Hiển thị shortcuts này", category: "Navigation" },

  // Actions
  { keys: ["Ctrl", "S"], description: "Lưu thay đổi", category: "Actions" },
  { keys: ["Ctrl", "E"], description: "Xuất báo cáo", category: "Actions" },

  // Table Navigation
  { keys: ["Tab"], description: "Di chuyển đến ô tiếp theo", category: "Table" },
  { keys: ["Shift", "Tab"], description: "Di chuyển đến ô trước", category: "Table" },
  { keys: ["↑", "↓"], description: "Di chuyển lên/xuống hàng", category: "Table" },
  { keys: ["←", "→"], description: "Di chuyển trái/phải cột", category: "Table" },
];

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  useEscapeKey(onClose);

  if (!isOpen) return null;

  // Group shortcuts by category
  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white p-6 flex items-center justify-between">
            <div>
              <h2 id="shortcuts-title" className="text-2xl font-bold flex items-center gap-2">
                ⌨️ Phím tắt
              </h2>
              <p className="text-beige-100 text-sm mt-1">
                Sử dụng các phím tắt để làm việc nhanh hơn
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryShortcuts = SHORTCUTS.filter((s) => s.category === category);

                return (
                  <div key={category}>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      {category === "Navigation" && "🧭"}
                      {category === "Actions" && "⚡"}
                      {category === "Table" && "📊"}
                      <span>{category}</span>
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-gray-700 font-medium">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <span key={keyIndex} className="flex items-center gap-1">
                                <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-mono font-bold text-gray-900">
                                  {key}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-gray-400 text-sm">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 Tip: Nhấn <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">?</kbd> bất cứ lúc nào để xem phím tắt
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
