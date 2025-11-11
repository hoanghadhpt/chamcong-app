"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  offline?: boolean;
}

export default function Toast({ message, offline }: ToastProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!show) return null;

  return (
    <div className="toast">
      {offline ? "✓ " : ""}
      {message}
    </div>
  );
}
