"use client";

interface BottomSaveBarProps {
  visible: boolean;
  changeCount: number;
  onSave: () => void;
  saving?: boolean;
  className?: string;
}

export default function BottomSaveBar({
  visible,
  changeCount,
  onSave,
  saving = false,
  className = "",
}: BottomSaveBarProps) {
  if (!visible || changeCount === 0) return null;

  return (
    <div
      className={`fixed lg:sticky bottom-0 lg:bottom-auto left-0 right-0 bg-white border-t-2 border-gray-200 p-4 lg:p-6 shadow-2xl lg:shadow-md z-50 transition-all lg:rounded-xl lg:mt-4 ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-bold py-4 lg:py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg lg:text-base shadow-lg flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>Lưu tất cả ({changeCount} thay đổi)</span>
            </>
          )}
        </button>

        {/* Unsaved Changes Warning */}
        <p className="text-center text-xs lg:text-sm text-gray-600 mt-2">
          {changeCount} thay đổi chưa lưu
        </p>
      </div>
    </div>
  );
}
