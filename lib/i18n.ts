// Vietnamese localization and formatting utilities

export const vi = {
  // Auth
  auth: {
    email: "Email",
    password: "Mật khẩu",
    displayName: "Tên hiển thị",
    register: "Đăng ký",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    registerTitle: "Tạo tài khoản mới",
    loginTitle: "Đăng nhập",
    alreadyHaveAccount: "Đã có tài khoản?",
    dontHaveAccount: "Chưa có tài khoản?",
    registerHere: "Đăng ký ở đây",
    loginHere: "Đăng nhập ở đây",
    invalidCredentials: "Email hoặc mật khẩu không đúng",
    emailExists: "Email đã được đăng ký",
    registerSuccess: "Đăng ký thành công",
    loginSuccess: "Đăng nhập thành công",
    noAccount: "Chưa có tài khoản?",
    haveAccount: "Đã có tài khoản?",
    createAccount: "Tạo tài khoản mới",
    loggingIn: "Đang đăng nhập",
    loginError: "Đăng nhập thất bại",
    errorOccurred: "Đã xảy ra lỗi. Vui lòng thử lại",
    registerError: "Đăng ký thất bại",
    creatingAccount: "Đang tạo tài khoản",
  },

  // Navigation
  nav: {
    attendance: "Chấm công",
    workers: "Nhân viên",
    shifts: "Ca làm",
    export: "Xuất báo cáo",
    settings: "Cài đặt",
    profile: "Hồ sơ",
  },

  // Attendance marking
  attendance: {
    title: "Chấm công ngày",
    today: "Hôm nay",
    dateLabel: "Ngày",
    teamFilter: "Lọc theo tổ",
    search: "Tìm kiếm",
    markAllPresent: "Đánh dấu tất cả Có mặt",
    copyYesterday: "Sao chép hôm qua",
    saveAll: "Lưu tất cả",
    saving: "Đang lưu",
    batchMark: "Đánh dấu cả tổ",
    batchMarking: "Đang đánh dấu tổ...",
    batchSuccess: "Đã đánh dấu {count} nhân viên tổ {team} là {status}",
    batchError: "Lỗi khi đánh dấu tổ",
    status: {
      present: "Có mặt",
      absent: "Vắng",
      leave_paid: "Phép có lương",
      leave_unpaid: "Phép không lương",
      sick: "Ốm",
      ot: "Tăng ca",
    },
    statusPresent: "Có mặt",
    statusAbsent: "Vắng",
    statusLeavePaid: "Phép có lương",
    statusLeaveUnpaid: "Phép không lương",
    statusSick: "Ốm",
    statusOT: "Tăng ca",
    checkIn: "Vào",
    checkOut: "Ra",
    now: "Bây giờ",
    late: "Trễ",
    early: "Sớm",
    overtime: "Tăng ca",
    ot_1_5: "1.5x",
    ot_2_0: "2.0x",
    ot_3_0: "3.0x",
    note: "Ghi chú",
    noWorkers: "Không có nhân viên",
    saved: "Đã lưu",
    savingOffline: "Đã lưu (Offline – sẽ đồng bộ)",
    halfDay: "Nửa ngày",
    fullDay: "Cả ngày",
    shiftAmount: "Loại ca",
    selectShift: "Chọn loại ca làm",
  },

  // Workers
  workers: {
    title: "Quản lý nhân viên",
    add: "Thêm nhân viên",
    edit: "Sửa",
    delete: "Xóa",
    update: "Cập nhật",
    code: "Mã NV",
    name: "Họ tên",
    phone: "Điện thoại",
    team: "Bộ phận",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    import: "Nhập CSV",
    downloadTemplate: "Tải mẫu",
    export: "Xuất CSV",
    importSuccess: "Nhập {count} nhân viên thành công",
    importPartial: "Nhập {count} nhân viên thành công ({errors} lỗi)",
    importError: "Nhập CSV thất bại",
    exportSuccess: "Xuất nhân viên thành công",
    exportError: "Xuất nhân viên thất bại",
    addSuccess: "Thêm nhân viên thành công",
    addError: "Thêm nhân viên thất bại",
    updateSuccess: "Cập nhật nhân viên thành công",
    updateError: "Cập nhật nhân viên thất bại",
    deleteSuccess: "Xóa nhân viên thành công",
    deleteError: "Xóa nhân viên thất bại",
    noWorkers: "Không có nhân viên",
    emptyState: "Chưa có nhân viên. Hãy thêm nhân viên đầu tiên!",
    noTeam: "Không có bộ phận",
    confirmDelete: "Bạn chắc chắn muốn xóa?",
    deletedSuccess: "Xóa nhân viên thành công",
  },

  // Shifts
  shifts: {
    title: "Quản lý ca làm",
    add: "Thêm ca",
    edit: "Sửa ca",
    delete: "Xóa ca",
    name: "Tên ca",
    startTime: "Giờ vào",
    endTime: "Giờ ra",
    breakMinutes: "Nghỉ giữa (phút)",
    isOvernight: "Ca qua đêm",
    default: "Ca mặc định",
    saved: "Lưu ca thành công",
    deleted: "Xóa ca thành công",
    noShifts: "Không có ca nào",
  },

  // Settings
  settings: {
    title: "Cài đặt",
    workday: "Giờ công chuẩn/ngày",
    roundStep: "Làm tròn (phút)",
    lateGrace: "Ngưỡng trễ (phút)",
    earlyGrace: "Ngưỡng sớm (phút)",
    defaultShift: "Ca mặc định",
    locale: "Ngôn ngữ",
    timezone: "Múi giờ",
    enableGps: "Bật GPS",
    enableSelfie: "Bật chụp ảnh",
    saved: "Lưu cài đặt thành công",
  },

  // Export
  export: {
    title: "Xuất báo cáo",
    fromDate: "Từ ngày",
    toDate: "Đến ngày",
    format: "Định dạng",
    detail: "Chi tiết",
    matrix: "Ma trận tháng",
    detailFormat: "Chi tiết",
    detailDesc: "Danh sách chi tiết từng ngày",
    matrixFormat: "Ma trận",
    matrixDesc: "Bảng tháng (hàng nhân viên, cột ngày)",
    download: "Tải xuống Excel",
    downloading: "Đang tải...",
    generating: "Đang tạo Excel",
    success: "Xuất báo cáo thành công",
    exportSuccess: "Xuất báo cáo thành công",
    exportError: "Xuất báo cáo thất bại",
    error: "Lỗi xuất báo cáo",
    reportDetails: "Chi tiết báo cáo",
    period: "Kỳ hạn",
    formatLabel: "Định dạng",
    detailIncludes: "Bao gồm: Ngày, Mã NV, Họ tên, Bộ phận, Trạng thái, Giờ vào/ra, Trễ/Sớm, OT, Ghi chú",
    matrixIncludes: "Bao gồm: Ma trận tháng với status codes (P=Có mặt, V=Vắng, LP=Phép có lương, LN=Phép không lương, S=Ốm, OT=Tăng ca)",
    tips: "Mẹo xuất báo cáo",
    tip1: "Chọn khoảng ngày cần xuất",
    tip2: "Chọn định dạng phù hợp (Chi tiết hoặc Ma trận)",
    tip3: "File Excel có thể mở trong Excel, Google Sheets, hoặc LibreOffice Calc",
    tip4: "Có thể sửa đổi và chia sẻ file Excel khi cần",
  },

  // Common
  common: {
    yes: "Có",
    no: "Không",
    save: "Lưu",
    cancel: "Hủy",
    add: "Thêm",
    edit: "Sửa",
    delete: "Xóa",
    close: "Đóng",
    search: "Tìm kiếm",
    filter: "Lọc",
    export: "Xuất",
    import: "Nhập",
    error: "Lỗi",
    success: "Thành công",
    loading: "Đang tải",
    saving: "Đang lưu",
    saveAll: "Lưu tất cả",
    noData: "Không có dữ liệu",
    confirm: "Xác nhận",
    confirmDelete: "Bạn chắc chắn muốn xóa?",
    days: "Ngày",
    hours: "Giờ",
    minutes: "Phút",
    to: "đến",
    noChanges: "Không có thay đổi",
    savedSuccess: "Đã lưu {count} bản ghi thành công",
    savedQueued: "Đã lưu {saved} bản ghi. {failed} bản ghi sẽ được đồng bộ khi trực tuyến",
    saveFailed: "Lưu {count} bản ghi thất bại",
    loadError: "Lỗi tải dữ liệu",
    saveError: "Lỗi lưu dữ liệu",
    deleteError: "Lỗi xóa dữ liệu",
    importError: "Lỗi nhập dữ liệu",
    exportError: "Lỗi xuất dữ liệu",
  },
};

// Format date to dd/MM/yyyy
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Parse dd/MM/yyyy to YYYY-MM-DD
export function parseDate(dateStr: string): string {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Format Date object to YYYY-MM-DD in local timezone (no timezone conversion)
// This prevents timezone-related date shifts when using toISOString()
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get day name in Vietnamese
export function getDayNameVi(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const days = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  return days[d.getDay()];
}

// Get month name in Vietnamese
export function getMonthNameVi(monthIndex: number): string {
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  return months[monthIndex];
}

// Round time to nearest step (in minutes)
export function roundTime(
  timeStr: string,
  stepMinutes: number,
  roundUp: boolean = false
): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  let rounded: number;
  if (roundUp) {
    rounded = Math.ceil(totalMinutes / stepMinutes) * stepMinutes;
  } else {
    rounded = Math.round(totalMinutes / stepMinutes) * stepMinutes;
  }

  const newHours = Math.floor(rounded / 60);
  const newMinutes = rounded % 60;

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(
    2,
    "0"
  )}`;
}

// Calculate minutes late/early
export function calculateLateEarly(
  checkInTime: string | null,
  shiftStartTime: string,
  lateGrace: number
): number | null {
  if (!checkInTime) return null;

  const [ciH, ciM] = checkInTime.split(":").map(Number);
  const [ssH, ssM] = shiftStartTime.split(":").map(Number);

  const checkInMinutes = ciH * 60 + ciM;
  const shiftStartMinutes = ssH * 60 + ssM;

  const diff = checkInMinutes - shiftStartMinutes;
  if (diff <= lateGrace) return null; // Within grace period
  return Math.max(0, diff - lateGrace);
}

export function calculateEarlyCheckOut(
  checkOutTime: string | null,
  shiftEndTime: string,
  earlyGrace: number
): number | null {
  if (!checkOutTime) return null;

  const [coH, coM] = checkOutTime.split(":").map(Number);
  const [seH, seM] = shiftEndTime.split(":").map(Number);

  const checkOutMinutes = coH * 60 + coM;
  const shiftEndMinutes = seH * 60 + seM;

  const diff = shiftEndMinutes - checkOutMinutes;
  if (diff <= earlyGrace) return null; // Within grace period
  return Math.max(0, diff - earlyGrace);
}

// Format time as HH:MM
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return "---";
  return timeStr;
}

// Get current time as HH:MM
export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

// Extract time from timestamp (YYYY-MM-DD HH:MM:SS) -> HH:MM
// Avoids timezone conversion issues by doing string extraction
export function extractTimeFromTimestamp(timestamp: string | null): string {
  if (!timestamp) return "";

  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp;
  }

  // Extract time portion from timestamp string
  // Format: "2025-11-14 16:10:00" -> "16:10"
  const timeMatch = timestamp.match(/(\d{2}):(\d{2})(?::\d{2})?/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  return "";
}
