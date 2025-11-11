"use client";

import { useEffect, useState, useRef } from "react";
import Toast from "@/components/Toast";

interface Worker {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      setToast("Failed to load workers");
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
          setToast("Worker updated successfully");
        } else {
          const data = await response.json();
          setToast(data.error || "Failed to update worker");
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
          setToast("Worker added successfully");
        } else {
          const data = await response.json();
          setToast(data.error || "Failed to add worker");
        }
      }

      setFormData({ code: "", name: "", phone: "", team: "" });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving worker:", error);
      setToast("An error occurred while saving");
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
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/workers?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkers(workers.filter((w) => w.id !== id));
        setToast("Worker deleted successfully");
      } else {
        setToast("Failed to delete worker");
      }
    } catch (error) {
      console.error("Error deleting worker:", error);
      setToast("An error occurred while deleting");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataObj = new FormData();
    formDataObj.append("file", file);

    setSaving(true);
    try {
      const response = await fetch("/api/workers/import", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        setToast(
          `Imported ${result.imported} workers${
            result.errors.length > 0
              ? ` (${result.errors.length} errors)`
              : ""
          }`
        );
        fetchWorkers();
      } else {
        setToast("Failed to import workers");
      }
    } catch (error) {
      console.error("Error importing:", error);
      setToast("An error occurred during import");
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        a.download = `workers_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setToast("Workers exported successfully");
      }
    } catch (error) {
      console.error("Error exporting:", error);
      setToast("Failed to export workers");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-primary mb-4">Manage Workers</h2>

        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ code: "", name: "", phone: "", team: "" });
            }}
            className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition"
          >
            {showForm && !editingId ? "Cancel" : "Add Worker"}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold transition disabled:opacity-50"
          >
            Import CSV
          </button>

          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
          >
            Export CSV
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
                placeholder="Worker Code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
                required
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded text-base"
              />
              <input
                type="text"
                placeholder="Team"
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
              {saving ? "Saving..." : editingId ? "Update Worker" : "Add Worker"}
            </button>
          </form>
        )}
      </div>

      <div className="space-y-2">
        {workers.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No workers yet. Add your first worker!
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
                  {worker.code} | {worker.team || "No team"}
                </p>
                {worker.phone && (
                  <p className="text-sm text-gray-600">{worker.phone}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(worker)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(worker.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
