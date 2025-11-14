interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string;
  currentSortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
  align?: "left" | "center" | "right";
}

export default function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className = "",
  align = "left",
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey;
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <th
      className={`px-3 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none ${alignClass} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-2 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
        <span>{label}</span>
        <span className="text-xs">
          {isActive ? (
            currentSortDirection === "asc" ? "▲" : "▼"
          ) : (
            <span className="opacity-30">⇅</span>
          )}
        </span>
      </div>
    </th>
  );
}
