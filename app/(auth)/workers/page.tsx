"use client";

import { useEffect, useState, useRef } from "react";
import Toast from "@/components/Toast";
import WorkersTable from "@/components/WorkersTable";
import WorkerEditModal from "@/components/WorkerEditModal";
import { vi } from "@/lib/i18n";
import { 
  Plus, 
  Upload, 
  Download, 
  FileDown, 
  Search, 
  LayoutGrid, 
  List,
  X,
  User,
  Phone,
  Briefcase,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2
} from "lucide-react";

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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-text-secondary font-medium text-lg">{vi.common.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">{vi.workers.title}</h1>
            <p className="text-text-secondary mt-1">Quản lý danh sách nhân viên và thông tin chi tiết</p>
          </div>
          
          <div className="flex gap-2 w-full lg:w-auto">
            <button
              onClick={handleAddNew}
              className="flex-1 lg:flex-none bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {vi.workers.add}
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl shadow-soft p-4 flex flex-col lg:flex-row gap-4 items-center sticky top-0 z-30 border border-gray-100">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, bộ phận, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Actions Group */}
          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="px-4 py-2.5 bg-surface-highlight text-primary-700 hover:bg-primary-100 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
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
              className="px-4 py-2.5 bg-surface-highlight text-primary-700 hover:bg-primary-100 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              title="Tải file mẫu Excel"
            >
              <FileDown className="w-4 h-4" />
              Mẫu
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-surface-highlight text-primary-700 hover:bg-primary-100 rounded-xl font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              {vi.workers.export}
            </button>
            
            <div className="w-px h-8 bg-gray-200 mx-1 hidden lg:block"></div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "card"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Table View (Desktop) */}
        {viewMode === "table" && (
          <div className="hidden lg:block animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              <WorkersTable
                workers={workers}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        )}

        {/* Card View (Mobile + Desktop option) */}
        <div className={`${viewMode === "table" ? "lg:hidden" : ""} animate-fadeIn`}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workers.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary font-medium">{vi.workers.emptyState}</p>
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
                    className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 p-5 border border-gray-100 group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-lg">
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-lg">{worker.name}</h3>
                          <p className="text-sm text-text-muted font-medium">{worker.code}</p>
                        </div>
                      </div>
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
                    </div>

                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Briefcase className="w-4 h-4 text-text-muted" />
                        <span>{worker.team || vi.workers.noTeam}</span>
                      </div>
                      {worker.phone && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Phone className="w-4 h-4 text-text-muted" />
                          <span>{worker.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => handleEdit(worker)}
                        className="flex-1 bg-surface-highlight hover:bg-primary-100 text-primary-700 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                        {vi.common.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(worker.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
              <div className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-text-primary">
                    Xác nhận ánh xạ cột
                  </h3>
                  <button 
                    onClick={() => setImportPreview(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-text-muted" />
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      File có {importPreview.totalRows} hàng.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Hệ thống đã tự động phát hiện ánh xạ cột. Vui lòng kiểm tra lại.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    { label: "Mã NV (Code)", key: "code" },
                    { label: "Họ tên (Name)", key: "name" },
                    { label: "Điện thoại (Phone)", key: "phone" },
                    { label: "Bộ phận (Team)", key: "team" },
                    { label: "Trạng thái (Active)", key: "active" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">
                        {field.label}
                      </label>
                      <div className="relative">
                        <select
                          value={(importPreview.mapping as any)[field.key] || ""}
                          onChange={(e) =>
                            setImportPreview({
                              ...importPreview,
                              mapping: {
                                ...importPreview.mapping,
                                [field.key]: e.target.value || null,
                              },
                            })
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none text-sm font-medium"
                        >
                          <option value="">-- Không chọn --</option>
                          {importPreview.headers.map((header) => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setImportPreview(null)}
                    className="flex-1 px-6 py-3 border border-gray-200 text-text-secondary rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    {vi.common.cancel}
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={saving || !importPreview.mapping.code || !importPreview.mapping.name}
                    className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang nhập...
                      </span>
                    ) : "Xác nhận & Nhập"}
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
    </div>
  );
}
