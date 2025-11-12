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
      className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl z-50 transition-all ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent active:from-primary active:to-accent text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg flex items-center justify-center gap-2"
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
        <p className="text-center text-xs text-gray-600 mt-2">
          {changeCount} thay đổi chưa lưu
        </p>
      </div>
    </div>
  );
}
