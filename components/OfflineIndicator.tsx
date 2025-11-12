"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Don't show anything if online
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-3 z-[60] shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
        <span className="text-lg">📡</span>
        <span className="font-bold text-sm">
          Chế độ Offline - Dữ liệu sẽ được đồng bộ khi có mạng
        </span>
      </div>
    </div>
  );
}
