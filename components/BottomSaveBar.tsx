"use client";

import { Save, Loader2, AlertCircle } from "lucide-react";

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
      className={`fixed bottom-0 left-0 right-0 lg:left-auto lg:right-auto lg:fixed lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 z-50 transition-all duration-300 animate-slideUp ${className}`}
    >
      <div className="bg-white border border-gray-200 shadow-2xl rounded-t-2xl lg:rounded-2xl p-4 lg:p-3 lg:pr-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-6 min-w-[320px] lg:min-w-[400px]">
        <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-text-primary text-sm">Thay đổi chưa lưu</p>
            <p className="text-xs text-text-secondary">{changeCount} thay đổi đang chờ</p>
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full lg:w-auto bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang lưu...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Lưu thay đổi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
