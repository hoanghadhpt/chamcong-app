"use client";

import { useEffect, useState } from "react";
import { vi } from "@/lib/i18n";
import { X, User, Phone, Briefcase, Hash, CheckCircle2, XCircle, Loader2 } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-text-primary">
                {worker ? vi.workers.update : vi.workers.add}
              </h3>
              <p className="text-text-secondary mt-1">
                {worker ? "Cập nhật thông tin nhân viên" : "Thêm nhân viên mới vào hệ thống"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={saving}
            >
              <X className="w-6 h-6 text-text-muted" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã NV */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  {vi.workers.code} <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                    placeholder="VD: NV001"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  {vi.workers.name} <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                    placeholder="VD: Nguyễn Văn A"
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Điện thoại */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  {vi.workers.phone}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                    placeholder="VD: 0912345678"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Bộ phận */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  {vi.workers.team}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) =>
                      setFormData({ ...formData, team: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                    placeholder="VD: Sản xuất"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Trạng thái Hoạt động */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <label className="block text-sm font-semibold text-text-secondary mb-3">
                Trạng thái làm việc <span className="text-error">*</span>
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.active === 1 
                    ? "border-success bg-success/5 text-success" 
                    : "border-transparent bg-white hover:bg-gray-100 text-text-secondary"
                }`}>
                  <input
                    type="radio"
                    name="active"
                    value="1"
                    checked={formData.active === 1}
                    onChange={() => setFormData({ ...formData, active: 1 })}
                    className="sr-only"
                    disabled={saving}
                  />
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Đang làm việc</span>
                  </div>
                </label>
                
                <label className={`flex-1 relative flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.active === 0 
                    ? "border-error bg-error/5 text-error" 
                    : "border-transparent bg-white hover:bg-gray-100 text-text-secondary"
                }`}>
                  <input
                    type="radio"
                    name="active"
                    value="0"
                    checked={formData.active === 0}
                    onChange={() => setFormData({ ...formData, active: 0 })}
                    className="sr-only"
                    disabled={saving}
                  />
                  <div className="flex items-center gap-2 font-bold">
                    <XCircle className="w-5 h-5" />
                    <span>Đã nghỉ việc</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-200 text-text-secondary rounded-xl font-bold hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                {vi.common.cancel}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {vi.common.saving}...
                  </>
                ) : (
                  worker ? vi.workers.update : vi.workers.add
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
