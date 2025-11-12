"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  offline?: boolean;
  type?: "success" | "error" | "info" | "warning";
}

export default function Toast({ message, offline, type = "success" }: ToastProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(timer);
  }, [message]);

  if (!show) return null;

  const typeStyles = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-blue-600 text-white",
    warning: "bg-orange-600 text-white",
  };

  const typeIcons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const currentType = offline ? "warning" : type;

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${typeStyles[currentType]} px-5 py-3 rounded-xl z-[100] font-semibold text-sm shadow-2xl max-w-md mx-auto animate-slideUp`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{offline ? "📡" : typeIcons[currentType]}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
