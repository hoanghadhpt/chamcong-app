"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Map routes to breadcrumb items
  const routeMap: Record<string, BreadcrumbItem[]> = {
    "/": [{ label: "🏠 Trang chủ" }, { label: "Chấm công" }],
    "/workers": [{ label: "🏠 Trang chủ", href: "/" }, { label: "Nhân viên" }],
    "/reports": [{ label: "🏠 Trang chủ", href: "/" }, { label: "Báo cáo" }],
    "/export": [{ label: "🏠 Trang chủ", href: "/" }, { label: "Xuất báo cáo" }],
  };

  const breadcrumbs = routeMap[pathname] || [{ label: "🏠 Trang chủ" }];

  return (
    <nav aria-label="Breadcrumb" className="mb-4 lg:mb-6">
      <ol className="flex items-center gap-2 text-sm lg:text-base flex-wrap">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-warm-dark/60 hover:text-warm-dark font-medium transition-colors hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={`font-bold ${
                    isLast ? "text-warm-dark" : "text-warm-dark/60"
                  }`}
                >
                  {crumb.label}
                </span>
              )}

              {!isLast && (
                <span className="text-warm-dark/30 font-bold">/</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
