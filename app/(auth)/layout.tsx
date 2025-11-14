"use client";

import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8">
          {/* Breadcrumbs - Desktop only */}
          <div className="hidden lg:block">
            <Breadcrumbs />
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
