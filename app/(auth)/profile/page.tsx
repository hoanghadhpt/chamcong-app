"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { vi } from "@/lib/i18n";

interface ProfileData {
  id: number;
  email: string;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

// Helper function to generate automatic avatar URL
function getAvatarUrl(profile: ProfileData | null, customUrl: string): string {
  // If custom URL provided, use it
  if (customUrl && customUrl.trim()) {
    return customUrl;
  }

  // Otherwise, generate automatic avatar from name or email
  if (!profile) return "";

  const name = profile.display_name || profile.email.split("@")[0];
  const encodedName = encodeURIComponent(name);

  // Using UI Avatars API with app's color scheme
  return `https://ui-avatars.com/api/?name=${encodedName}&background=CC785C&color=fff&size=256&bold=true`;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    phone: "",
    avatar_url: "",
    bio: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          display_name: data.display_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          bio: data.bio || "",
        });
      } else {
        setToast({ message: "Không thể tải thông tin profile", type: "error" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setToast({ message: vi.common.loadError, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setToast({ message: "Cập nhật profile thành công", type: "success" });
      } else {
        const data = await response.json();
        setToast({ message: data.error || "Cập nhật profile thất bại", type: "error" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setToast({ message: "Cập nhật profile thất bại", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get the avatar URL (custom or auto-generated)
  const currentAvatarUrl = getAvatarUrl(profile, formData.avatar_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-warm-dark/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Thông tin cá nhân</h1>
            <p className="text-gray-300">Quản lý thông tin profile của bạn</p>
          </div>

          {/* Avatar Preview - Always shown */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-accent shadow-lg"
              />
              {!formData.avatar_url && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                    Avatar tự động
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-gray-400 border border-white/10 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-white mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="Nhập tên hiển thị của bạn"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar_url" className="block text-sm font-medium text-white mb-2">
                URL ảnh đại diện (Tùy chọn)
              </label>
              <input
                type="url"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all"
                placeholder="https://example.com/avatar.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">
                Để trống để sử dụng avatar tự động từ tên của bạn
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-white mb-2">
                Giới thiệu bản thân
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-black/30 text-white border border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/50 transition-all resize-none"
                placeholder="Viết vài dòng giới thiệu về bản thân..."
              />
            </div>

            {/* Created At */}
            {profile?.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ngày tạo tài khoản
                </label>
                <div className="text-gray-400">
                  {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
