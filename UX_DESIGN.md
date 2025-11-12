# 📱 Thiết Kế UX/UI - Ứng Dụng Chấm Công

> **Tài liệu này mô tả thiết kế UI/UX cho ứng dụng chấm công PWA dành cho quản đốc xưởng Việt Nam**

---

## 🎯 Nguyên Tắc Thiết Kế

### 1. **Mobile-First**
- Ưu tiên thiết kế cho điện thoại (màn hình 375px - 428px)
- Tối ưu cho thao tác một tay
- Font size tối thiểu 14px, buttons tối thiểu 44x44px

### 2. **Tốc Độ Thao Tác**
- Giảm số bước thao tác xuống tối thiểu
- Batch operations cho các tác vụ lặp đi lặp lại
- Feedback tức thời cho mọi hành động

### 3. **Offline-First**
- Hoạt động mượt mà khi mất mạng
- Đồng bộ tự động khi có kết nối
- Thông báo rõ ràng về trạng thái offline

### 4. **Phù Hợp Văn Hóa Việt Nam**
- Ngôn ngữ tiếng Việt 100%
- Emoji và icon trực quan, dễ hiểu
- Màu sắc chuyên nghiệp nhưng thân thiện

---

## 🧩 Component Tái Sử Dụng

### 1. **DateHeader**
**Vị trí:** components/DateHeader.tsx

**Mục tiêu UX:**
- Hiển thị và cho phép chọn ngày chấm công một cách nhanh chóng
- Badge "Hôm nay" giúp người dùng dễ dàng nhận biết ngày hiện tại

**Cấu trúc:**
```tsx
<DateHeader
  selectedDate={string}
  onDateChange={(date) => void}
/>
```

**Giải thích UX:**
- **Date picker lớn**: Dễ tap bằng ngón tay cái trên mobile
- **Badge "Hôm nay"**: Giúp phân biệt nhanh ngày hiện tại vs ngày khác
- **Hiển thị ngày đầy đủ**: "Thứ Hai, 12 tháng 11 năm 2025" giúp tránh nhầm lẫn
- **Border 2px khi focus**: Feedback rõ ràng khi đang chọn ngày

---

### 2. **TeamFilter**
**Vị trí:** components/TeamFilter.tsx

**Mục tiêu UX:**
- Tìm kiếm nhanh theo tổ, tên, hoặc mã nhân viên
- Mở rộng/thu gọn tất cả các tổ cùng lúc

**Cấu trúc:**
```tsx
<TeamFilter
  searchQuery={string}
  onSearchChange={(query) => void}
  onExpandAll={() => void}
  onCollapseAll={() => void}
/>
```

**Giải thích UX:**
- **Icon 🔍 trong search box**: Trực quan, người dùng biết ngay đây là ô tìm kiếm
- **Placeholder chi tiết**: "Tìm tổ, tên hoặc mã NV..." giúp người dùng hiểu được khả năng tìm kiếm
- **Buttons ▼ và ▶**: Kích thước 48x48px, dễ tap bằng ngón tay cái
- **Màu phân biệt**: Xanh cho "Mở rộng", Xám cho "Thu gọn"

---

### 3. **AttendanceStatusChip**
**Vị trí:** components/AttendanceStatusChip.tsx

**Mục tiêu UX:**
- Hiển thị trạng thái chấm công với màu sắc trực quan
- Dễ đọc ngay cả khi quét nhanh

**Cấu trúc:**
```tsx
<AttendanceStatusChip
  status={"present" | "absent" | "leave_paid" | ...}
  size={"sm" | "md" | "lg"}
/>
```

**Màu sắc:**
| Trạng thái | Màu | Nhãn | Lý do |
|------------|-----|------|-------|
| Present | Xanh lá | Có mặt | Tích cực, có mặt |
| Absent | Đỏ | Vắng | Cảnh báo, thiếu |
| Leave Paid | Xanh dương | Phép CL | Trung tính, hợp lệ |
| Leave Unpaid | Cam | Phép KL | Chú ý, không lương |
| Sick | Tím | Ốm | Đặc biệt, cần quan tâm |
| OT | Vàng | Tăng ca | Tích cực, thêm giờ |

**Giải thích UX:**
- **Màu sắc tương phản cao**: Background nhạt + text đậm = dễ đọc
- **Font bold**: Nổi bật trong giao diện
- **Rounded corners**: Thân thiện hơn góc vuông
- **Shadow nhẹ**: Tạo độ nổi, phân tách khỏi nền

---

### 4. **WorkerRow**
**Vị trí:** components/WorkerRow.tsx

**Mục tiêu UX:**
- Hiển thị thông tin công nhân + các nút thao tác chấm công
- Thao tác nhanh chóng cho từng người

**Cấu trúc:**
```tsx
<WorkerRow
  worker={Worker}
  attendance={AttendanceRecord}
  onStatusChange={(id, status, isCheckIn, shiftAmount) => void}
  onCheckOut={(id) => void}
/>
```

**Giải thích UX:**
- **Grid 3 cột cho buttons trạng thái**: Tối ưu cho màn hình nhỏ, mỗi button vẫn đủ lớn để tap
- **Emoji cho mỗi trạng thái**: Trực quan hơn chỉ text, dễ nhận diện
- **Border trái màu xanh**: Giúp phân biệt từng worker row
- **Active state scale 105%**: Feedback trực quan khi chọn
- **Half-day selector**: Chỉ hiện khi cần (phép, vắng, ốm) - giảm clutter
- **Check-in/Check-out buttons**: Chỉ hiện với status "Có mặt", màu xanh (vào) và cam (ra) phân biệt rõ

---

### 5. **TeamSection**
**Vị trí:** components/TeamSection.tsx

**Mục tiêu UX:**
- Nhóm workers theo tổ
- Batch mark cho cả tổ (giảm thao tác lặp đi lặp lại)

**Cấu trúc:**
```tsx
<TeamSection
  teamName={string}
  workers={Worker[]}
  attendance={Map}
  changes={Map}
  isExpanded={boolean}
  onToggleExpand={() => void}
  onBatchMark={(teamName, status) => void}
  ...
/>
```

**Giải thích UX:**
- **Header gradient xám đậm**: Phân biệt rõ với worker rows
- **Tên tổ + số lượng có mặt**: Thông tin quan trọng nhất
- **Batch mark buttons**: 3 trạng thái phổ biến nhất (Có mặt, Vắng, Phép)
- **Grid 3 cột**: Tối ưu mobile, vẫn dễ tap
- **Expand/collapse animation**: Smooth, không giật lag
- **Worker list trong background xám nhạt**: Tạo contrast với header

---

### 6. **BottomSaveBar**
**Vị trí:** components/BottomSaveBar.tsx

**Mục tiêu UX:**
- Luôn hiện thị ở dưới cùng khi có thay đổi
- Người dùng không cần scroll lên/xuống để lưu

**Cấu trúc:**
```tsx
<BottomSaveBar
  visible={boolean}
  changeCount={number}
  onSave={() => void}
  saving={boolean}
/>
```

**Giải thích UX:**
- **Fixed bottom**: Luôn ở vị trí dễ chạm nhất (thumb zone)
- **Gradient xanh**: Nổi bật, thu hút attention
- **Icon 💾 + text**: Kết hợp để rõ nghĩa
- **Loading state với ⏳**: Feedback trực quan đang xử lý
- **Count badge**: Người dùng biết đang có bao nhiêu thay đổi chưa lưu
- **Warning text**: "X thay đổi chưa lưu" - nhắc nhở thêm

---

### 7. **OfflineIndicator**
**Vị trí:** components/OfflineIndicator.tsx

**Mục tiêu UX:**
- Thông báo rõ ràng khi mất mạng
- Đảm bảo người dùng biết dữ liệu sẽ được đồng bộ sau

**Giải thích UX:**
- **Fixed top**: Vị trí đầu tiên người dùng nhìn thấy
- **Màu cam nổi bật**: Cảnh báo nhẹ, không quá aggressive như đỏ
- **Icon 📡**: Liên quan đến kết nối mạng
- **Message rõ ràng**: "Chế độ Offline - Dữ liệu sẽ được đồng bộ khi có mạng"
- **Auto hide khi online**: Không làm phiền khi không cần

---

## 📱 Các Màn Hình Chính

### 🧩 Màn hình "/" - Chấm Công Nhanh Hôm Nay

**Mục tiêu UX:**
Quản đốc đánh dấu nhanh trạng thái làm việc của từng công nhân trong ngày.

**Luồng thao tác:**
1. Chọn ngày (hoặc giữ nguyên hôm nay)
2. Tìm kiếm/Lọc tổ (nếu cần)
3. Mở rộng tổ cần chấm công
4. Đánh dấu hàng loạt cho cả tổ HOẶC chấm từng người
5. Sửa từng người nếu có ngoại lệ
6. Tap "Lưu tất cả" ở dưới cùng

**Cấu trúc component:**
```tsx
<OfflineIndicator />
<div className="space-y-4 pb-28 bg-gray-100 min-h-screen p-4">
  <DateHeader />
  <TeamFilter />
  <TeamSection[] />
  <BottomSaveBar />
  <Toast />
</div>
```

**Giải thích UX:**
- **Background xám nhạt**: Giảm độ chói, dễ nhìn lâu
- **Padding bottom 28**: Tránh content bị che bởi BottomSaveBar
- **Space-y-4**: Khoảng cách đều giữa các section
- **p-4**: Padding thoải mái, không sát mép màn hình

**Ưu điểm thiết kế:**
- ✅ Thao tác một tay: Tất cả buttons trong thumb zone
- ✅ Batch operation: Đánh dấu cả tổ chỉ với 1 tap
- ✅ Search nhanh: Tìm người cụ thể không cần scroll
- ✅ Visual feedback: Màu sắc rõ ràng cho từng trạng thái
- ✅ Offline support: Làm việc mượt mà khi mất mạng

---

### 🧩 Màn hình "/workers" - Quản Lý Công Nhân

**Mục tiêu UX:**
CRUD công nhân, import từ Excel, export danh sách.

**Luồng thao tác:**
1. Xem danh sách công nhân hiện có
2. Thêm mới / Sửa / Xóa từng người
3. Hoặc import hàng loạt từ file Excel
4. Export toàn bộ danh sách khi cần

**Cấu trúc hiện tại:**
- Action buttons grid 2 cột trên mobile
- Form inline khi thêm/sửa
- Worker cards với thông tin rõ ràng
- Import preview dialog với column mapping

**Cải tiến UX đề xuất:**
- ✨ **Thêm icon cho buttons**: Dễ nhận diện hơn
- ✨ **Card design cho worker list**: Thay vì list thuần túy
- ✨ **Confirmation dialog khi xóa**: Tránh xóa nhầm
- ✨ **Toast notification**: Feedback rõ ràng sau mỗi action

---

### 🧩 Màn hình "/export" - Xuất Báo Cáo

**Mục tiêu UX:**
Xuất báo cáo chấm công theo khoảng thời gian và định dạng mong muốn.

**Luồng thao tác:**
1. Chọn khoảng thời gian (Từ ngày - Đến ngày)
2. Chọn định dạng (Chi tiết hoặc Ma trận)
3. Chọn cột cần xuất (nếu format chi tiết)
4. Tap "Tải xuống Excel"

**Cải tiến UX đề xuất:**
- ✨ **Visual preview**: Hiển thị preview nhỏ của format sẽ xuất
- ✨ **Quick date ranges**: Buttons "7 ngày qua", "Tháng này", "Tháng trước"
- ✨ **Download progress**: Progress bar khi đang tạo file
- ✨ **File size estimate**: Ước lượng dung lượng file trước khi xuất

---

### 🧩 Màn hình "/login" & "/register"

**Mục tiêu UX:**
Đăng nhập/Đăng ký đơn giản, nhanh chóng.

**Cải tiến UX đề xuất:**
- ✨ **Brand gradient background**: Tạo ấn tượng chuyên nghiệp
- ✨ **Icon 📱 Chấm Công**: Branding rõ ràng
- ✨ **Large input fields**: Dễ nhập trên mobile
- ✨ **Show/hide password toggle**: Tiện lợi hơn
- ✨ **Remember me checkbox**: Tránh đăng nhập lại liên tục

---

## 🎨 Hệ Thống Màu Sắc

### Primary Colors
```css
primary: #1f2937     /* Xám đậm - Header, Text quan trọng */
accent: #3b82f6      /* Xanh dương - CTA, Active state */
```

### Status Colors
```css
green:  #10b981      /* Success, Present */
red:    #ef4444      /* Error, Absent */
blue:   #3b82f6      /* Info, Leave Paid */
orange: #f97316      /* Warning, Leave Unpaid */
purple: #a855f7      /* Sick */
yellow: #eab308      /* OT */
gray:   #6b7280      /* Neutral, Disabled */
```

### Background Colors
```css
bg-gray-50:  #f9fafb     /* Cards, Sections */
bg-gray-100: #f3f4f6     /* Page background */
bg-gray-200: #e5e7eb     /* Hover states */
```

---

## 📏 Typography

### Font Family
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", ...
```

### Font Sizes
- **text-xs**: 12px - Labels, secondary info
- **text-sm**: 14px - Body text nhỏ
- **text-base**: 16px - Body text chính
- **text-lg**: 18px - Buttons quan trọng
- **text-xl**: 20px - Section headers
- **text-2xl**: 24px - Page titles

### Font Weights
- **font-normal**: 400 - Text thông thường
- **font-medium**: 500 - Labels
- **font-semibold**: 600 - Subheadings
- **font-bold**: 700 - Headings, Buttons

---

## 📐 Spacing & Sizing

### Component Spacing
```css
gap-2:  0.5rem  (8px)   /* Buttons trong cùng nhóm */
gap-3:  0.75rem (12px)  /* Cards trong list */
gap-4:  1rem    (16px)  /* Sections */
```

### Padding
```css
p-2:  0.5rem  (8px)   /* Tight padding */
p-3:  0.75rem (12px)  /* Default padding */
p-4:  1rem    (16px)  /* Comfortable padding */
```

### Button Sizes
- **Minimum touch target**: 44x44px
- **Default button**: 48px height, px-4 py-3
- **Small button**: 40px height, px-3 py-2
- **Large button**: 56px height, px-5 py-4

---

## 🚀 Hiệu Năng & Tối Ưu

### 1. **Lazy Loading**
- Component chỉ render khi team được expand
- Giảm số DOM nodes ban đầu

### 2. **Optimistic UI**
- Update UI ngay lập tức, sync sau
- Rollback nếu API call failed

### 3. **Debounced Search**
- Search input debounce 300ms
- Tránh re-render không cần thiết

### 4. **Service Worker**
- Cache static assets
- Offline mode hoàn toàn functional

---

## ✅ Accessibility (A11y)

### 1. **Keyboard Navigation**
- Tab order hợp lý
- Focus indicators rõ ràng (ring-2 ring-accent)

### 2. **Touch Targets**
- Minimum 44x44px
- Spacing giữa buttons >= 8px

### 3. **Color Contrast**
- Tuân thủ WCAG AA (tỷ lệ 4.5:1)
- Text trên background có contrast đủ cao

### 4. **Aria Labels**
- Buttons có aria-label khi chỉ có icon
- Form inputs có label rõ ràng

---

## 📱 Responsive Design

### Breakpoints
```css
sm:  640px   /* Tablets nhỏ */
md:  768px   /* Tablets */
lg:  1024px  /* Desktop nhỏ */
xl:  1280px  /* Desktop lớn */
```

### Mobile-First Approach
```tsx
// Default: Mobile
<button className="px-3 py-2 text-sm">

// Tablet and up
<button className="px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base">
```

---

## 🔄 Animations & Transitions

### Transition Classes
```css
transition-all        /* Smooth transitions */
hover:scale-105       /* Subtle scale on hover */
active:scale-95       /* Pressed feedback */
```

### Keyframe Animations
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

animate-slideUp: 300ms ease-out
```

---

## 📝 Best Practices

### ✅ DO
- Sử dụng component tái sử dụng
- Giữ file component dưới 300 dòng
- Đặt tên biến rõ ràng (isLoading, handleSubmit)
- Comment cho logic phức tạp
- Responsive mobile-first

### ❌ DON'T
- Hardcode strings tiếng Việt (dùng vi.*)
- Tạo component quá nhỏ (1-2 dòng JSX)
- Nest quá sâu (> 3 levels)
- Dùng inline styles
- Bỏ qua accessibility

---

## 🎓 Kết Luận

Thiết kế UI/UX này tập trung vào:

1. **Tốc độ thao tác** - Giảm số bước, batch operations
2. **Mobile-first** - Thumb-friendly, one-hand operation
3. **Offline-ready** - PWA với service worker
4. **Visual clarity** - Icons, colors, spacing rõ ràng
5. **Accessibility** - Touch targets, contrast, keyboard nav

**Kết quả:** Quản đốc xưởng có thể chấm công cho 50 người trong vòng 2-3 phút, ngay cả khi offline.

---

Made with ❤️ for factory managers in Vietnam
