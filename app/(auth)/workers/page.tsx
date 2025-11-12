"use client";

import { useEffect, useState, useRef } from "react";
import Toast from "@/components/Toast";
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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    team: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const response = await fetch("/api/workers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            ...formData,
            active: 1,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setWorkers(
            workers.map((w) => (w.id === editingId ? updated : w))
          );
          setToast(vi.workers.updateSuccess);
        } else {
          const data = await response.json();
          setToast(data.error || vi.workers.updateError);
        }
      } else {
        const response = await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newWorker = await response.json();
          setWorkers([...workers, newWorker]);
          setToast(vi.workers.addSuccess);
        } else {
          const data = await response.json();
          setToast(data.error || vi.workers.addError);
        }
      }

      setFormData({ code: "", name: "", phone: "", team: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving worker:", error);
      setToast(vi.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (worker: Worker) => {
    setFormData({
      code: worker.code,
      name: worker.name,
      phone: worker.phone || "",
      team: worker.team || "",
    });
    setEditingId(worker.id);
    setShowForm(true);
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
        a.download = `nhan_vien_${new Date().toISOString().split("T")[0]}.csv`;
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
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-4">{vi.workers.title}</h2>

        {/* Action buttons - optimized for mobile */}
        <div className="grid grid-cols-2 sm:flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ code: "", name: "", phone: "", team: "" });
            }}
            className="bg-accent hover:bg-blue-600 text-white px-4 py-3 sm:py-2 rounded font-semibold transition text-base sm:text-base"
          >
            {showForm && !editingId ? vi.common.cancel : vi.workers.add}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded font-semibold transition disabled:opacity-50 text-base"
          >
            {vi.workers.import}
          </button>

          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded font-semibold transition text-base col-span-2 sm:col-span-1"
          >
            {vi.workers.export}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={vi.workers.code}
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
                required
              />
              <input
                type="text"
                placeholder={vi.workers.name}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
                required
              />
              <input
                type="tel"
                placeholder={vi.workers.phone}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
              />
              <input
                type="text"
                placeholder={vi.workers.team}
                value={formData.team}
                onChange={(e) =>
                  setFormData({ ...formData, team: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-2 rounded transition disabled:opacity-50"
            >
              {saving ? vi.common.saving + "..." : editingId ? vi.workers.update : vi.workers.add}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {workers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            {vi.workers.emptyState}
          </div>
        ) : (
          workers.map((worker) => (
            <div
              key={worker.id}
              className="bg-white rounded-lg shadow p-4 flex items-start justify-between"
            >
              <div>
                <p className="font-bold">{worker.name}</p>
                <p className="text-sm text-gray-600">
                  {worker.code} | {worker.team || vi.workers.noTeam}
                </p>
                {worker.phone && (
                  <p className="text-sm text-gray-600">{worker.phone}</p>
                )}
              </div>

              {/* Action buttons - optimized for mobile */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <button
                  onClick={() => handleEdit(worker)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition text-base"
                >
                  {vi.common.edit}
                </button>
                <button
                  onClick={() => handleDelete(worker.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold transition text-base"
                >
                  {vi.common.delete}
                </button>
              </div>
            </div>
          ))
        )}
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

      {toast && <Toast message={toast} />}
    </div>
  );
}
