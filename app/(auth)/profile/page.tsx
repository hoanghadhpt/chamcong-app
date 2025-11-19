"use client";

import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { vi } from "@/lib/i18n";
import { 
  User, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  FileText, 
  Calendar, 
  Save, 
  Loader2,
  Camera
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-text-secondary font-medium text-lg">{vi.common.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-12">
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <User className="w-8 h-8 text-primary-500" />
            Thông tin cá nhân
          </h1>
          <p className="text-text-secondary mt-1">Quản lý thông tin hồ sơ và tài khoản của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 flex flex-col items-center text-center sticky top-8">
              <div className="relative mb-4 group">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-primary-100 to-primary-50">
                  <img
                    src={currentAvatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-primary-600">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-text-primary mb-1">
                {formData.display_name || profile?.email.split("@")[0]}
              </h2>
              <p className="text-text-secondary text-sm mb-4">{profile?.email}</p>
              
              <div className="w-full pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Trạng thái</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-bold text-xs">
                    Hoạt động
                  </span>
                </div>
                {profile?.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Tham gia</span>
                    <span className="text-text-primary font-medium">
                      {new Date(profile.created_at).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-6 lg:p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-text-primary mb-6">Chỉnh sửa thông tin</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-text-muted cursor-not-allowed font-medium"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted"></span>
                    Email không thể thay đổi
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label htmlFor="display_name" className="block text-sm font-semibold text-text-secondary mb-2">
                    Tên hiển thị
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      type="text"
                      id="display_name"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                      placeholder="Nhập tên hiển thị của bạn"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-text-secondary mb-2">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                {/* Avatar URL */}
                <div>
                  <label htmlFor="avatar_url" className="block text-sm font-semibold text-text-secondary mb-2">
                    URL ảnh đại diện (Tùy chọn)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-text-muted" />
                    </div>
                    <input
                      type="url"
                      id="avatar_url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Để trống để sử dụng avatar tự động từ tên của bạn
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-semibold text-text-secondary mb-2">
                    Giới thiệu bản thân
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <FileText className="h-5 w-5 text-text-muted" />
                    </div>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-text-primary font-medium resize-none"
                      placeholder="Viết vài dòng giới thiệu về bản thân..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} />}
    </div>
  );
}
