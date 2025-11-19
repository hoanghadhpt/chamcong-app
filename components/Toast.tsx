"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, WifiOff } from "lucide-react";

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
    success: "bg-white border-l-4 border-success text-text-primary",
    error: "bg-white border-l-4 border-error text-text-primary",
    info: "bg-white border-l-4 border-blue-500 text-text-primary",
    warning: "bg-white border-l-4 border-warning text-text-primary",
  };

  const typeIcons = {
    success: <CheckCircle2 className="w-6 h-6 text-success" />,
    error: <XCircle className="w-6 h-6 text-error" />,
    info: <Info className="w-6 h-6 text-blue-500" />,
    warning: <AlertTriangle className="w-6 h-6 text-warning" />,
  };

  const currentType = offline ? "warning" : type;
  const Icon = offline ? <WifiOff className="w-6 h-6 text-warning" /> : typeIcons[currentType];

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 rounded-xl z-[100] shadow-2xl max-w-md w-full mx-auto animate-slideUp flex items-center gap-4 ${typeStyles[currentType]}`}
    >
      <div className="shrink-0">
        {Icon}
      </div>
      <div className="flex-1 font-medium text-sm">
        {message}
      </div>
    </div>
  );
}
