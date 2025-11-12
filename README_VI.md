# Chấm Công - Hệ thống Quản lý Chấm Công PWA cho SME Việt Nam

Một ứng dụng web tiến tiến (PWA) hoàn chỉnh để quản lý chấm công nhân viên, được tối ưu hóa cho các nhà máy và công ty nhỏ-vừa ở Việt Nam.

**Tính năng chính:**
- 📱 Ứng dụng di động (PWA) - cài đặt trên màn hình chính
- 🌐 Làm việc offline - đồng bộ tự động khi trực tuyến
- 👥 Quản lý đa người dùng - mỗi quản lý chỉ thấy dữ liệu của họ
- 📊 Xuất báo cáo chi tiết & ma trận tháng
- 🇻🇳 Hỗ trợ tiếng Việt (vi-VN, múi giờ Asia/Ho_Chi_Minh)
- ✅ Chứng thực email/mật khẩu + cookie phiên (HttpOnly, SameSite=Lax)
- ⚡ Cơ sở dữ liệu SQLite nhanh với WAL mode
- 🔐 Bảo mật - quản lý user_agent & IP cho kiểm tra phiên

## Hướng dẫn cài đặt

### Yêu cầu

- Node.js 18+
- npm hoặc yarn

### Bước cài đặt

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi động máy chủ phát triển
npm run dev

# 3. Mở trình duyệt
http://localhost:3000

# 4. Đăng ký tài khoản mới
# Database SQLite tự động tạo tại lần chạy đầu tiên
```

### Build cho production

```bash
npm run build
npm start
```

## Cấu trúc dữ liệu

### Bảng chính

**users** - Tài khoản quản lý
- email (duy nhất)
- password_hash (bcryptjs 10 vòng)
- display_name
- created_at

**sessions** - Phiên đang hoạt động
- id (nanoid 32 ký tự)
- user_id (FK)
- user_agent (trình duyệt)
- ip (địa chỉ IP)
- expires_at (30 ngày)

**workers** - Danh sách nhân viên
- manager_id (FK) - quản lý
- code (mã NV) - duy nhất theo quản lý
- name
- phone
- team (tổ/bộ phận)
- active (0/1)

**shifts** - Ca làm việc
- manager_id (FK)
- name (tên ca)
- start_time (HH:MM)
- end_time (HH:MM)
- break_minutes (phút nghỉ)
- is_overnight (ca qua đêm)

**settings** - Cài đặt quản lý
- manager_id (PK)
- workday_minutes (giờ chuẩn, mặc định 480)
- round_step_minutes (làm tròn, mặc định 15)
- late_grace (ngưỡng trễ phút, mặc định 5)
- early_grace (ngưỡng sớm phút, mặc định 5)
- default_shift_id (ca mặc định)
- locale ('vi-VN')
- tz ('Asia/Ho_Chi_Minh')
- enable_gps (bật GPS)
- enable_selfie (bật chụp ảnh)

**holidays** - Ngày lễ
- manager_id (FK)
- date (YYYY-MM-DD)
- name (tên lễ)

**attendance** - Bản ghi chấm công
- manager_id (FK)
- worker_id (FK)
- work_date (YYYY-MM-DD)
- status (present/absent/leave_paid/leave_unpaid/sick/ot)
- check_in (HH:MM, nullable)
- check_out (HH:MM, nullable)
- late_minutes (trễ phút, nullable)
- early_minutes (sớm phút, nullable)
- ot_1_5, ot_2_0, ot_3_0 (giờ tăng ca, mặc định 0)
- note (ghi chú)
- shift_id (FK nullable)
- UNIQUE(manager_id, worker_id, work_date)

**INDEX**
- attendance(manager_id, work_date) - lọc nhanh theo ngày
- workers(manager_id) - danh sách nhân viên
- shifts(manager_id)
- holidays(manager_id)
- sessions(expires_at) - xóa phiên hết hạn

## API Routes

### Xác thực
```
POST /api/auth/register
  { email, password, displayName }
  -> { message, user: {id, email, displayName} }

POST /api/auth/login
  { email, password }
  -> { message, user, cookie: sid }

POST /api/auth/logout
  -> { message }
```

### Nhân viên
```
GET /api/workers
  -> [{ id, manager_id, code, name, phone, team, active }]

POST /api/workers
  { code, name, phone?, team? }
  -> { id, manager_id, code, name, phone, team, active }

PUT /api/workers
  { id, code, name, phone, team, active }
  -> { id, manager_id, code, name, phone, team, active }

DELETE /api/workers?id=123
  -> { message }

POST /api/workers/import
  formData: { file: File (CSV) }
  -> { imported, errors }

GET /api/workers/export
  -> CSV (code,name,phone,team,active)
```

### Ca làm việc
```
GET /api/shifts
  -> [{ id, manager_id, name, start_time, end_time, break_minutes, is_overnight }]

POST /api/shifts
  { name, start_time, end_time, break_minutes?, is_overnight? }

PUT /api/shifts
  { id, name, start_time, end_time, break_minutes, is_overnight }

DELETE /api/shifts?id=123
```

### Cài đặt
```
GET /api/settings
  -> { manager_id, workday_minutes, round_step_minutes, late_grace, early_grace, default_shift_id, locale, tz, enable_gps, enable_selfie }

PUT /api/settings
  { workday_minutes?, round_step_minutes?, late_grace?, early_grace?, ... }
  -> settings object
```

### Lễ hạn
```
GET /api/holidays
GET /api/holidays?from=YYYY-MM-DD&to=YYYY-MM-DD
  -> [{ manager_id, date, name }]

POST /api/holidays
  { date, name }

PUT /api/holidays
  { date, name }

DELETE /api/holidays?date=YYYY-MM-DD
```

### Chấm công
```
GET /api/attendance?date=YYYY-MM-DD
GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD
  -> [{ id, manager_id, worker_id, work_date, status, check_in, check_out, late_minutes, early_minutes, ot_1_5, ot_2_0, ot_3_0, note, shift_id, workerCode, workerName, team }]

POST /api/attendance
  { workerId, workDate, status, checkIn?, checkOut?, lateMinutes?, earlyMinutes?, ot_1_5?, ot_2_0?, ot_3_0?, note?, shiftId? }
  -> attendance record
```

### Xuất báo cáo
```
POST /api/export/excel
  { fromDate: YYYY-MM-DD, toDate: YYYY-MM-DD, format: "detail"|"matrix" }
  -> Excel file

Format "detail": Bảng chi tiết (Ngày, Mã NV, Họ tên, Bộ phận, Trạng thái, Vào, Ra, Trễ, Sớm, OT 1.5x/2.0x/3.0x, Ghi chú)

Format "matrix": Lưới tháng (Hàng = Nhân viên, Cột = Ngày 1-31)
  Ô chứa: P (Có mặt), V (Vắng), LP (Phép có lương), LN (Phép không lương), S (Ốm), OT (Tăng ca)
  Chân = Tổng Có mặt, Vắng, Phép, Ốm, Tăng ca
  Cuối tuần (T7, CN) được tô xám
```

## Nhập CSV (Workers)

### Định dạng CSV

Hỗ trợ header Tiếng Việt hoặc Tiếng Anh, tự động ánh xạ:

```
STT,Mã NV,Họ tên,Bộ phận,Chức danh,SĐT
1,W001,Nguyễn Văn A,Sản xuất,Công nhân,0912345678
2,W002,Trần Thị B,Kỹ thuật,Kỹ sư,,Sản xuất
```

hoặc

```
code,name,phone,team,active
W001,Nguyen Van A,0912345678,Production,1
W002,Tran Thi B,,Technical,0
```

Các cột tối thiểu: **code** (Mã NV), **name** (Họ tên)
Cột tùy chọn: phone, team, active
Cột bỏ qua: chức danh, STT, v.v.

**Nhập sẽ:**
- INSERT nếu mã NV chưa tồn tại
- UPDATE nếu mã NV đã tồn tại (UPSERT)

## Trạng thái chấm công

| Trạng thái | Mã | Ý nghĩa |
|-----------|-----|---------|
| present | P | Có mặt |
| absent | V | Vắng mặt |
| leave_paid | LP | Phép có lương |
| leave_unpaid | LN | Phép không lương |
| sick | S | Ốm (bệnh) |
| ot | OT | Tăng ca |

## Cài đặt rounding & grace

**Round step** (làm tròn): Làm tròn giờ vào/ra đến bội số phút gần nhất
VD: 5 phút → 08:12 thành 08:10

**Late grace** (ngưỡng trễ): Trễ bao nhiêu phút mới tính là trễ
VD: 5 phút → Vào lúc 08:05 không tính trễ

**Early grace** (ngưỡng sớm): Ra sớm bao nhiêu phút mới tính là sớm
VD: 5 phút → Ra lúc 17:55 (quá 17:00) không tính sớm

## Offline & Sync

Ứng dụng hoạt động hoàn toàn offline:

1. **Làm việc offline**: Tất cả dữ liệu được cache, chấm công được lưu tại máy
2. **Hàng đợi offline** (IndexedDB): Khi offline, POST đến `/api/attendance` được lưu vào `attendanceQueue`
3. **Tự động đồng bộ**: Khi trực tuyến (online event), hàng đợi tự động gửi lên server
4. **Service Worker** (sw.js):
   - Cache-first cho tài sản tĩnh (JS, CSS)
   - Stale-while-revalidate cho GET /api (trả về cache, cập nhật ẩn)
   - POST được queued (Background Sync tag: `attendance-sync`)

## Locale & Múi giờ

- **Locale mặc định**: vi-VN (Tiếng Việt)
- **Format ngày**: dd/MM/yyyy (vd: 12/11/2025)
- **Múi giờ**: Asia/Ho_Chi_Minh (UTC+7)
- **Có thể đổi** trong Settings

## Bảo mật

✅ **Mã hóa mật khẩu**: bcryptjs 10 vòng
✅ **Phiên HttpOnly**: Cookie `sid` không đọc được từ JavaScript
✅ **SameSite=Lax**: Chặn CSRF trong đó vẫn cho phép điều hướng từ bên ngoài
✅ **Secure in production**: Cookie chỉ gửi qua HTTPS
✅ **Kiểm tra user_agent & IP**: Ghi lại thông tin phiên để kiểm tra trái phép
✅ **Middleware xác thực**: Tất cả /api/* (ngoài /api/auth/*) cần phiên hợp lệ
✅ **Multi-tenant**: manager_id bắt buộc trên tất cả các query

## Dependencies

```json
{
  "better-sqlite3": "^9.2.0",    // Database
  "bcryptjs": "^2.4.3",           // Password hashing
  "nanoid": "^5.0.0",             // Session IDs
  "exceljs": "^4.4.0",            // Excel generation
  "idb": "^8.0.0",                // IndexedDB wrapper (offline queue)
  "next": "^15.0.0",              // Framework
  "react": "^19.0.0",             // UI
  "typescript": "^5.0.0",         // Type safety
  "tailwindcss": "^3.4.0"         // Styling
}
```

## Scripts

```bash
npm run dev       # Phát triển (localhost:3000)
npm run build     # Build production
npm start         # Chạy production
npm run lint      # Kiểm tra code
```

## Lần chạy đầu tiên

1. `npm install` - cài dependencies
2. `npm run dev` - khởi động server (tạo data.db tự động)
3. Truy cập http://localhost:3000 → Đăng ký
4. Thêm nhân viên → Chấm công → Xuất báo cáo

## Deployment

### Vercel (khuyến nghị)
```bash
vercel deploy
```
**Lưu ý**: SQLite database sẽ lưu tại /tmp (tạm thời). Cho production thực, dùng PostgreSQL hoặc database dùng chung.

### Self-hosted (Node.js)
```bash
npm run build
npm start
```

Đảm bảo `/home/user/chamcong-app/` có quyền ghi (cho data.db + WAL files).

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Cấu hình môi trường

Tùy chọn (.env.local):
```
NODE_ENV=production
```

Sẽ tự động:
- Bật HTTPS cookies (secure flag)
- Tắt source maps

## PWA Installation

### Android (Chrome)
1. Mở ứng dụng
2. Menu → "Cài đặt ứng dụng"
3. Chọn "Cài đặt"

### iOS (Safari)
1. Mở ứng dụng
2. Chia sẻ → "Thêm vào màn hình chính"

### Desktop (Chrome/Edge)
1. Nhấn nút "Cài đặt" trên thanh địa chỉ
2. Hoặc: Menu → "Cài đặt ứng dụng"

Ứng dụng sẽ chạy như một chương trình độc lập (standalone mode).

## Troubleshooting

**Q: Database không tìm thấy**
A: Kiểm tra quyền ghi thư mục, chạy `npm run dev` lần đầu để tạo schema

**Q: Service Worker không đăng ký**
A: Kiểm tra console > Application > Service Workers, refresh trang

**Q: Không đồng bộ offline**
A: Kiểm tra Application > IndexedDB > chamcong-app > attendanceQueue, kết nối internet, xem console errors

**Q: Quên mật khẩu**
A: Hiện tại không có feature reset. Xóa database (data.db) và đăng ký lại

## Hướng phát triển

Có thể mở rộng:
- Thêm vai trò (admin, supervisor, worker)
- Tích hợp API công ty (payroll, HR)
- Thêm analytics & dashboard
- Shift scheduling & planner
- GPS check-in & face recognition
- Mobile app native (React Native)

## Giấy phép

MIT

## Liên hệ & Hỗ trợ

Tham khảo code comments hoặc tài liệu Next.js/SQLite.

---

**Xây dựng với ❤️ cho các nhà máy Việt Nam**
