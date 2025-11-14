"use client";

import { useState, useMemo } from "react";
import { vi } from "@/lib/i18n";
import SortableTableHeader from "./TableEnhancements/SortableTableHeader";
import Pagination from "./TableEnhancements/Pagination";
import ColumnVisibilityToggle from "./TableEnhancements/ColumnVisibilityToggle";

interface Worker {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

interface WorkersTableProps {
  workers: Worker[];
  onEdit: (worker: Worker) => void;
  onDelete: (id: number) => void;
  searchQuery?: string;
}

type SortKey = "code" | "name" | "phone" | "team" | "active";

export default function WorkersTable({
  workers,
  onEdit,
  onDelete,
  searchQuery = "",
}: WorkersTableProps) {
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    stt: true,
    code: true,
    name: true,
    phone: true,
    team: true,
    active: true,
    actions: true,
  });

  // Get unique teams
  const teams = Array.from(new Set(workers.map((w) => w.team || "Không có bộ phận")));

  // Filter workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          worker.name.toLowerCase().includes(query) ||
          worker.code.toLowerCase().includes(query) ||
          (worker.team || "").toLowerCase().includes(query) ||
          (worker.phone || "").toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Team filter
      if (filterTeam !== "all") {
        if ((worker.team || "Không có bộ phận") !== filterTeam) return false;
      }

      // Status filter
      if (filterStatus === "active" && worker.active !== 1) return false;
      if (filterStatus === "inactive" && worker.active !== 0) return false;

      return true;
    });
  }, [workers, searchQuery, filterTeam, filterStatus]);

  // Sort workers
  const sortedWorkers = useMemo(() => {
    const sorted = [...filteredWorkers].sort((a, b) => {
      let aValue: any = a[sortKey];
      let bValue: any = b[sortKey];

      // Handle null values
      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      // Compare
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "vi")
          : bValue.localeCompare(aValue, "vi");
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    return sorted;
  }, [filteredWorkers, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedWorkers.length / itemsPerPage);
  const paginatedWorkers = useMemo(() => {
    if (itemsPerPage >= sortedWorkers.length) {
      return sortedWorkers; // Show all
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedWorkers.slice(startIndex, endIndex);
  }, [sortedWorkers, currentPage, itemsPerPage]);

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New sort key, default to ascending
      setSortKey(key as SortKey);
      setSortDirection("asc");
    }
    setCurrentPage(1); // Reset to first page
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
  };

  // Handle column visibility
  const handleColumnToggle = (columnKey: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev],
    }));
  };

  const columns = [
    { key: "stt", label: "STT", visible: columnVisibility.stt, disabled: true },
    { key: "code", label: "Mã NV", visible: columnVisibility.code, disabled: false },
    { key: "name", label: "Họ tên", visible: columnVisibility.name, disabled: true },
    { key: "phone", label: "Điện thoại", visible: columnVisibility.phone, disabled: false },
    { key: "team", label: "Bộ phận", visible: columnVisibility.team, disabled: false },
    { key: "active", label: "Trạng thái", visible: columnVisibility.active, disabled: false },
    { key: "actions", label: "Hành động", visible: columnVisibility.actions, disabled: true },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Filters */}
      <div className="p-4 bg-beige-50 border-b flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="font-semibold text-sm text-gray-700">Bộ phận:</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Tất cả</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-semibold text-sm text-gray-700">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">Tất cả</option>
            <option value="active">✅ Đang làm</option>
            <option value="inactive">❌ Đã nghỉ</option>
          </select>
        </div>

        <div className="flex-1"></div>

        {/* Column Visibility Toggle */}
        <ColumnVisibilityToggle columns={columns} onToggle={handleColumnToggle} />

        <div className="text-sm text-gray-600 font-medium">
          Hiển thị: <span className="text-accent font-bold">{sortedWorkers.length}</span> / {workers.length} nhân viên
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-warm-dark to-warm-dark/90 text-white">
            <tr>
              {columnVisibility.stt && (
                <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-12">
                  STT
                </th>
              )}
              {columnVisibility.code && (
                <SortableTableHeader
                  label="Mã NV"
                  sortKey="code"
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}
              {columnVisibility.name && (
                <SortableTableHeader
                  label="Họ tên"
                  sortKey="name"
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}
              {columnVisibility.phone && (
                <SortableTableHeader
                  label="Điện thoại"
                  sortKey="phone"
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}
              {columnVisibility.team && (
                <SortableTableHeader
                  label="Bộ phận"
                  sortKey="team"
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                />
              )}
              {columnVisibility.active && (
                <SortableTableHeader
                  label="Trạng thái"
                  sortKey="active"
                  currentSortKey={sortKey}
                  currentSortDirection={sortDirection}
                  onSort={handleSort}
                  align="center"
                />
              )}
              {columnVisibility.actions && (
                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-40">
                  Hành động
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedWorkers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <p>
                    {searchQuery || filterTeam !== "all" || filterStatus !== "all"
                      ? "Không tìm thấy nhân viên phù hợp"
                      : vi.workers.emptyState}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedWorkers.map((worker, index) => {
                const absoluteIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                  {columnVisibility.stt && (
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {absoluteIndex}
                    </td>
                  )}
                  {columnVisibility.code && (
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {worker.code}
                    </td>
                  )}
                  {columnVisibility.name && (
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {worker.name}
                    </td>
                  )}
                  {columnVisibility.phone && (
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {worker.phone || "---"}
                    </td>
                  )}
                  {columnVisibility.team && (
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                      {worker.team || vi.workers.noTeam}
                    </td>
                  )}
                  {columnVisibility.active && (
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          worker.active === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {worker.active === 1 ? "✅ Đang làm" : "❌ Đã nghỉ"}
                      </span>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => onEdit(worker)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-semibold text-xs transition-all shadow-sm"
                        >
                          ✏️ {vi.common.edit}
                        </button>
                        <button
                          onClick={() => onDelete(worker.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded font-semibold text-xs transition-all shadow-sm"
                        >
                          🗑️ {vi.common.delete}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedWorkers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}
