"use client";

import { useState, useMemo } from "react";
import { vi } from "@/lib/i18n";
import SortableTableHeader from "./TableEnhancements/SortableTableHeader";
import Pagination from "./TableEnhancements/Pagination";
import ColumnVisibilityToggle from "./TableEnhancements/ColumnVisibilityToggle";
import { Edit2, Trash2, Search, Filter, CheckCircle2, XCircle } from "lucide-react";

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
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
      {/* Filters */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-text-muted" />
          <label className="font-medium text-sm text-text-secondary">Bộ phận:</label>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-text-primary focus:ring-0 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-text-muted" />
          <label className="font-medium text-sm text-text-secondary">Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-text-primary focus:ring-0 cursor-pointer"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang làm</option>
            <option value="inactive">Đã nghỉ</option>
          </select>
        </div>

        <div className="flex-1"></div>

        {/* Column Visibility Toggle */}
        <ColumnVisibilityToggle columns={columns} onToggle={handleColumnToggle} />

        <div className="text-sm text-text-secondary font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
          Hiển thị: <span className="text-primary-600 font-bold">{sortedWorkers.length}</span> / {workers.length} nhân viên
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columnVisibility.stt && (
                <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-12">
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
                <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase tracking-wider w-32">
                  Hành động
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {paginatedWorkers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-medium">
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
                <tr key={worker.id} className="hover:bg-primary-50/30 transition-colors group">
                  {columnVisibility.stt && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                      {absoluteIndex}
                    </td>
                  )}
                  {columnVisibility.code && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-text-primary">
                      {worker.code}
                    </td>
                  )}
                  {columnVisibility.name && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-text-primary">
                      {worker.name}
                    </td>
                  )}
                  {columnVisibility.phone && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                      {worker.phone || "---"}
                    </td>
                  )}
                  {columnVisibility.team && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-text-secondary text-xs font-medium">
                        {worker.team || vi.workers.noTeam}
                      </span>
                    </td>
                  )}
                  {columnVisibility.active && (
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          worker.active === 1
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-error/10 text-error border-error/20"
                        }`}
                      >
                        {worker.active === 1 ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> Đang làm</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Đã nghỉ</>
                        )}
                      </span>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(worker)}
                          className="p-2 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors"
                          title={vi.common.edit}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(worker.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title={vi.common.delete}
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className="border-t border-gray-100 bg-gray-50/50 p-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedWorkers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
}
