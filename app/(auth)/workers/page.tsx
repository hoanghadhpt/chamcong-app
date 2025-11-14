"use client";

import { useEffect, useState, useRef } from "react";
import Toast from "@/components/Toast";
import WorkersTable from "@/components/WorkersTable";
import WorkerEditModal from "@/components/WorkerEditModal";
import { vi } from "@/lib/i18n";

interface Worker {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

interface ColumnMapping {
  code: string | null;
  name: string | null;
  phone: string | null;
  team: string | null;
  active: string | null;
}

interface ImportPreview {
  headers: string[];
  mapping: ColumnMapping;
  file: File;
  totalRows: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workers");
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      setToast(vi.common.loadError);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorker = async (workerData: Partial<Worker> & { id?: number }) => {
    setSaving(true);

    try {
      if (workerData.id) {
        // Update existing worker
        const response = await fetch("/api/workers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workerData),
        });

        if (response.ok) {
          const updated = await response.json();
          setWorkers(
            workers.map((w) => (w.id === workerData.id ? updated : w))
          );
          setToast(vi.workers.updateSuccess);
          setModalOpen(false);
          setEditingWorker(null);
        } else {
          const data = await response.json();
          setToast(data.error || vi.workers.updateError);
        }
      } else {
        // Create new worker
        const response = await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workerData),
        });

        if (response.ok) {
          const newWorker = await response.json();
          setWorkers([...workers, newWorker]);
          setToast(vi.workers.addSuccess);
          setModalOpen(false);
          setEditingWorker(null);
        } else {
          const data = await response.json();
          setToast(data.error || vi.workers.addError);
        }
      }
    } catch (error) {
      console.error("Error saving worker:", error);
      setToast(vi.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingWorker(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingWorker(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(vi.common.confirmDelete)) return;

    try {
      const response = await fetch(`/api/workers?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkers(workers.filter((w) => w.id !== id));
        setToast(vi.workers.deleteSuccess);
      } else {
        setToast(vi.workers.deleteError);
      }
    } catch (error) {
      console.error("Error deleting worker:", error);
      setToast(vi.common.deleteError);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("action", "detect");

    setSaving(true);
    try {
      const response = await fetch("/api/workers/import", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        setImportPreview({
          headers: result.headers,
          mapping: result.mapping,
          file: file,
          totalRows: result.totalRows,
        });
      } else {
        const data = await response.json();
        setToast(data.error || vi.workers.importError);
      }
    } catch (error) {
      console.error("Error detecting columns:", error);
      setToast(vi.common.importError);
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    setSaving(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append("file", importPreview.file);
      formDataObj.append("action", "import");
      formDataObj.append("mapping", JSON.stringify(importPreview.mapping));

      const response = await fetch("/api/workers/import", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.errors.length > 0
          ? vi.workers.importPartial.replace("{count}", result.imported.toString()).replace("{errors}", result.errors.length.toString())
          : vi.workers.importSuccess.replace("{count}", result.imported.toString());
        setToast(message);
        setImportPreview(null);
        fetchWorkers();
      } else {
        const data = await response.json();
        setToast(data.error || vi.workers.importError);
      }
    } catch (error) {
      console.error("Error importing:", error);
      setToast(vi.common.importError);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/workers/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `danh_sach_nhan_vien_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast(vi.workers.exportSuccess);
      }
    } catch (error) {
      console.error("Error exporting:", error);
      setToast(vi.workers.exportError);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">{vi.common.loading}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-6 xl:p-8">
      <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-primary mb-4 lg:mb-6">{vi.workers.title}</h2>

        {/* Action buttons - responsive grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4 lg:mb-6">
          <button
            onClick={handleAddNew}
            className="bg-accent hover:bg-blue-600 text-white px-4 py-3 lg:py-2.5 rounded-lg font-semibold transition text-base lg:text-lg"
          >
            {vi.workers.add}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 lg:py-2.5 rounded-lg font-semibold transition disabled:opacity-50 text-base lg:text-lg"
          >
            {vi.workers.import}
          </button>

          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = "/api/workers/template";
              a.download = `mau_danh_sach_nhan_vien_${new Date().toISOString().split("T")[0]}.xlsx`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 lg:py-2.5 rounded-lg font-semibold transition text-base lg:text-lg"
            title="Tải file mẫu Excel để nhập"
          >
            📥 {vi.workers.downloadTemplate || "Tải mẫu"}
          </button>

          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 lg:py-2.5 rounded-lg font-semibold transition text-base lg:text-lg col-span-2 lg:col-span-1"
          >
            {vi.workers.export}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Search Bar + View Mode Toggle */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-4 lg:mb-6">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Tìm theo tên, mã NV, bộ phận, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 lg:px-5 py-3 lg:py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* View Mode Toggle - Desktop only */}
          <div className="hidden lg:flex gap-2 bg-white rounded-lg p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                viewMode === "table"
                  ? "bg-accent text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📊 Bảng
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`px-4 py-2 rounded font-semibold text-sm transition-all ${
                viewMode === "card"
                  ? "bg-accent text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📇 Thẻ
            </button>
          </div>
        </div>

      </div>

      {/* Table View (Desktop) */}
      {viewMode === "table" && (
        <div className="hidden lg:block">
          <WorkersTable
            workers={workers}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchQuery={searchQuery}
          />
        </div>
      )}

      {/* Card View (Mobile + Desktop option) */}
      <div className={viewMode === "table" ? "lg:hidden" : ""}>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {workers.length === 0 ? (
            <div className="text-center py-8 text-gray-600 lg:col-span-2 xl:col-span-3">
              {vi.workers.emptyState}
            </div>
          ) : (
            workers
              .filter((worker) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  worker.name.toLowerCase().includes(query) ||
                  worker.code.toLowerCase().includes(query) ||
                  (worker.team || "").toLowerCase().includes(query) ||
                  (worker.phone || "").toLowerCase().includes(query)
                );
              })
              .map((worker) => (
                <div
                  key={worker.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 lg:p-5 flex flex-col gap-3"
                >
                  <div className="flex-1">
                    <p className="font-bold text-base lg:text-lg">{worker.name}</p>
                    <p className="text-sm lg:text-base text-gray-600">
                      {worker.code} | {worker.team || vi.workers.noTeam}
                    </p>
                    {worker.phone && (
                      <p className="text-sm lg:text-base text-gray-600">{worker.phone}</p>
                    )}
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          worker.active === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {worker.active === 1 ? "✅ Đang làm" : "❌ Đã nghỉ"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons - responsive */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(worker)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition text-base lg:text-lg"
                    >
                      {vi.common.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(worker.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 lg:py-2.5 rounded-lg font-semibold transition text-base lg:text-lg"
                    >
                      {vi.common.delete}
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Import Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-primary mb-4">
                Xác nhận ánh xạ cột
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm text-blue-800">
                  File có {importPreview.totalRows} hàng. Hệ thống đã tự động phát hiện ánh xạ cột sau:
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mã NV (Code):
                  </label>
                  <select
                    value={importPreview.mapping.code || ""}
                    onChange={(e) =>
                      setImportPreview({
                        ...importPreview,
                        mapping: {
                          ...importPreview.mapping,
                          code: e.target.value || null,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Không chọn --</option>
                    {importPreview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ tên (Name):
                  </label>
                  <select
                    value={importPreview.mapping.name || ""}
                    onChange={(e) =>
                      setImportPreview({
                        ...importPreview,
                        mapping: {
                          ...importPreview.mapping,
                          name: e.target.value || null,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Không chọn --</option>
                    {importPreview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Điện thoại (Phone):
                  </label>
                  <select
                    value={importPreview.mapping.phone || ""}
                    onChange={(e) =>
                      setImportPreview({
                        ...importPreview,
                        mapping: {
                          ...importPreview.mapping,
                          phone: e.target.value || null,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Không chọn --</option>
                    {importPreview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bộ phận (Team):
                  </label>
                  <select
                    value={importPreview.mapping.team || ""}
                    onChange={(e) =>
                      setImportPreview({
                        ...importPreview,
                        mapping: {
                          ...importPreview.mapping,
                          team: e.target.value || null,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Không chọn --</option>
                    {importPreview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Trạng thái (Active):
                  </label>
                  <select
                    value={importPreview.mapping.active || ""}
                    onChange={(e) =>
                      setImportPreview({
                        ...importPreview,
                        mapping: {
                          ...importPreview.mapping,
                          active: e.target.value || null,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- Không chọn --</option>
                    {importPreview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 transition"
                >
                  {vi.common.cancel}
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={saving || !importPreview.mapping.code || !importPreview.mapping.name}
                  className="flex-1 px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Đang nhập..." : "Xác nhận & Nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Edit/Add Modal */}
      <WorkerEditModal
        isOpen={modalOpen}
        worker={editingWorker}
        onClose={handleCloseModal}
        onSave={handleSaveWorker}
        saving={saving}
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}
