"use client";

import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import { useState } from "react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useRouter } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();

  // Global keyboard shortcuts
  useKeyboardShortcut({
    key: "?",
    onTrigger: () => setShowShortcuts(true),
    preventDefault: true,
  });

  useKeyboardShortcut({
    ctrl: true,
    key: "b",
    onTrigger: () => setSidebarCollapsed(!sidebarCollapsed),
    preventDefault: true,
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop Sidebar (≥1024px) */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navigation (<1024px) */}
        <div className="lg:hidden">
          <Navigation />
        </div>

        {/* Main Content */}
        <main
          className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8"
          role="main"
          aria-label="Nội dung chính"
        >
          {/* Breadcrumbs - Desktop only */}
          <div className="hidden lg:block">
            <Breadcrumbs />
          </div>

          {children}
        </main>

        {/* Keyboard Shortcuts Help Button - Desktop only */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="hidden lg:flex fixed bottom-6 right-6 items-center gap-2 bg-warm-dark hover:bg-warm-dark/90 text-white px-4 py-3 rounded-full shadow-xl transition-all hover:scale-105 z-40"
          aria-label="Xem phím tắt (nhấn ? để mở)"
          title="Phím tắt (nhấn ? để mở)"
        >
          <span className="text-lg">⌨️</span>
          <span className="font-semibold text-sm">Phím tắt</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
