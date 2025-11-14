"use client";

import { useEffect, useState } from "react";
import { vi } from "@/lib/i18n";

interface Worker {
  id: number;
  code: string;
  name: string;
  phone: string | null;
  team: string | null;
  active: number;
}

interface WorkerEditModalProps {
  isOpen: boolean;
  worker: Worker | null;
  onClose: () => void;
  onSave: (worker: Partial<Worker> & { id?: number }) => Promise<void>;
  saving: boolean;
}

export default function WorkerEditModal({
  isOpen,
  worker,
  onClose,
  onSave,
  saving,
}: WorkerEditModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    phone: "",
    team: "",
    active: 1,
  });

  useEffect(() => {
    if (worker) {
      setFormData({
        code: worker.code,
        name: worker.name,
        phone: worker.phone || "",
        team: worker.team || "",
        active: worker.active,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        phone: "",
        team: "",
        active: 1,
      });
    }
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = worker
      ? { id: worker.id, ...formData }
      : formData;
    await onSave(dataToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl lg:text-3xl font-bold text-primary">
              {worker ? vi.workers.update : vi.workers.add}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition"
              disabled={saving}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã NV */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {vi.workers.code} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                  placeholder="VD: NV001"
                  required
                  disabled={saving}
                />
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {vi.workers.name} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                  placeholder="VD: Nguyễn Văn A"
                  required
                  disabled={saving}
                />
              </div>

              {/* Điện thoại */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {vi.workers.phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                  placeholder="VD: 0912345678"
                  disabled={saving}
                />
              </div>

              {/* Bộ phận */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {vi.workers.team}
                </label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) =>
                    setFormData({ ...formData, team: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base lg:text-lg"
                  placeholder="VD: Sản xuất"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Trạng thái Hoạt động */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Trạng thái <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="active"
                    value="1"
                    checked={formData.active === 1}
                    onChange={() => setFormData({ ...formData, active: 1 })}
                    className="w-5 h-5 text-accent focus:ring-accent"
                    disabled={saving}
                  />
                  <span className="text-base lg:text-lg font-medium text-gray-700">
                    ✅ Đang làm việc
                  </span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="active"
                    value="0"
                    checked={formData.active === 0}
                    onChange={() => setFormData({ ...formData, active: 0 })}
                    className="w-5 h-5 text-red-500 focus:ring-red-500"
                    disabled={saving}
                  />
                  <span className="text-base lg:text-lg font-medium text-gray-700">
                    ❌ Đã nghỉ việc
                  </span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-base lg:text-lg"
                disabled={saving}
              >
                {vi.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-accent hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-base lg:text-lg"
              >
                {saving
                  ? vi.common.saving + "..."
                  : worker
                  ? vi.workers.update
                  : vi.workers.add}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
