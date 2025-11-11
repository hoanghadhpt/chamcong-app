# Chấm Công - PWA Attendance Management System

A modern, offline-first Progressive Web App (PWA) for managing worker attendance in factories. Built with Next.js 15, SQLite, TypeScript, and Tailwind CSS.

## Features

✅ **User Authentication**
- Email/password registration and login
- HttpOnly session cookies for security
- Session management with 30-day expiration

✅ **Worker Management**
- Full CRUD operations (Create, Read, Update, Delete)
- CSV import/export (UTF-8 with headers)
- Team assignment and phone contact info

✅ **Attendance Tracking**
- Daily attendance marking (present/absent/leave/OT)
- Check-in/Check-out timestamps
- Attendance notes
- Date range export to Excel with ExcelJS

✅ **Offline-First PWA**
- Works completely offline after first load
- Automatic service worker caching (shell + assets)
- Offline attendance queue with automatic sync when online
- IndexedDB-based queue system
- Toast notifications for sync status

✅ **Mobile-Optimized**
- Mobile-first responsive design
- Large tap areas for factory floor use
- Sticky "Save All" button
- Quick attendance marking interface

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3 (WAL mode)
- **Offline**: Service Worker, IndexedDB (idb)
- **Authentication**: bcryptjs, nanoid (session IDs)
- **Export**: ExcelJS for Excel generation

## Installation

### Prerequisites

- Node.js 18+ (with npm)
- SQLite3 (for development)

### Setup

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Create environment file** (optional):
```bash
# .env.local
NODE_ENV=development
```

3. **Run development server**:
```bash
npm run dev
```

4. **Access the app**:
- Open http://localhost:3000 in your browser
- First load will create `data.db` with SQLite schema

## Project Structure

```
chamcong-app/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── logout/route.ts
│   │   ├── workers/
│   │   │   ├── route.ts (CRUD)
│   │   │   ├── import/route.ts
│   │   │   └── export/route.ts
│   │   ├── attendance/route.ts
│   │   └── export/excel/route.ts
│   ├── (auth)/
│   │   ├── layout.tsx (Nav + protected)
│   │   ├── page.tsx (Home - attendance marking)
│   │   ├── workers/page.tsx (Worker CRUD)
│   │   └── export/page.tsx (Excel export)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── layout.tsx (Root layout)
│   └── globals.css
├── lib/
│   ├── db.ts (SQLite initialization)
│   ├── auth.ts (Auth utilities)
│   ├── workers.ts (Worker CRUD logic)
│   ├── attendance.ts (Attendance logic)
│   ├── excel.ts (Excel generation)
│   └── offlineQueue.ts (Offline queue with IndexedDB)
├── components/
│   ├── Navigation.tsx
│   └── Toast.tsx
├── public/
│   ├── manifest.webmanifest (PWA manifest)
│   └── sw.js (Service worker)
├── middleware.ts (Auth middleware)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.ts
```

## Database Schema

SQLite tables are auto-created on first run:

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

-- Workers table
CREATE TABLE workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  team TEXT,
  active INTEGER DEFAULT 1,
  UNIQUE(manager_id, code)
);

-- Attendance table
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  worker_id INTEGER NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  work_date TEXT NOT NULL,
  status TEXT,
  check_in TEXT,
  check_out TEXT,
  note TEXT,
  UNIQUE(manager_id, worker_id, work_date)
);
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new manager
- `POST /api/auth/login` - Login (sets HttpOnly cookie)
- `POST /api/auth/logout` - Logout

### Workers

- `GET /api/workers` - List all workers
- `POST /api/workers` - Create worker
- `PUT /api/workers` - Update worker
- `DELETE /api/workers?id=123` - Delete worker
- `POST /api/workers/import` - Import workers from CSV
- `GET /api/workers/export` - Export workers as CSV

### Attendance

- `GET /api/attendance?date=2025-11-11` - Get today's attendance
- `GET /api/attendance?from=2025-11-01&to=2025-11-30` - Get date range
- `POST /api/attendance` - Upsert attendance record

### Export

- `POST /api/export/excel` - Generate Excel report (date range)

## CSV Format

### Workers CSV (for import)

```csv
code,name,phone,team,active
W001,John Doe,0912345678,Team A,1
W002,Jane Smith,0987654321,Team B,1
W003,Bob Johnson,0912345679,Team A,0
```

Headers are case-insensitive. The `active` field accepts `0` or `1` (or empty defaults to `1`).

## Features in Detail

### Home Page (Attendance Marking)

1. Load all active workers for today
2. Quick status buttons: Present / Absent / Leave / OT
3. For "Present" status:
   - Check In button with current time
   - Check Out button with current time
4. Sticky "Save All" bar shows changes count
5. Toast notifications for save status
6. Offline indicator: "Saved (Offline – will sync)"

### Workers Page

1. **Add/Edit Worker**:
   - Code, Name, Phone, Team
   - Edit existing or create new
   - Unique code per manager

2. **Import CSV**:
   - Select file, auto-parses headers
   - Insert or replace workers
   - Shows import count and errors

3. **Export CSV**:
   - Downloads all workers as UTF-8 CSV
   - Includes all fields

### Export Page

1. Select date range (default: last 30 days)
2. Click "Download Excel Report"
3. ExcelJS generates file with:
   - Title with date range
   - Columns: Code, Name, Team, Date, Status, Check In/Out, Note
   - Styled header row
   - Borders and formatting

### Offline Mode

1. **While offline**:
   - All UI works normally
   - Attendance changes stored locally
   - Service worker caches API responses
   - Toast shows: "Saved (Offline – will sync)"

2. **When back online**:
   - Offline queue automatically syncs via IndexedDB
   - Success notifications on completion
   - Failed items remain in queue for retry

## PWA Installation

### Android
1. Open in Chrome
2. Menu → "Add to Home Screen"
3. App works standalone

### iOS
1. Open in Safari
2. Share → "Add to Home Screen"
3. App works in standalone mode

### Desktop (PWA)
1. Click "Install" in browser address bar
2. App launches as standalone window

## Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Security Notes

- ✅ Passwords hashed with bcryptjs (10 rounds)
- ✅ Session IDs generated with nanoid (32 chars)
- ✅ HttpOnly cookies (session `sid`)
- ✅ Middleware validates all protected routes
- ✅ CORS same-origin only
- ✅ Database foreign key constraints enabled

## Deployment

### Vercel (Recommended)

```bash
vercel deploy
```

Note: SQLite database will persist in `/tmp` or use serverless-compatible SQLite adapter for production.

### Self-Hosted (Node.js)

```bash
npm run build
npm start
```

Then deploy as Node.js application with persistent storage for `data.db`.

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

## Performance Tips

1. **Caching**: Service worker caches shell files + static assets
2. **Database**: SQLite with WAL (Write-Ahead Logging) for concurrent access
3. **Compression**: Next.js handles gzip compression
4. **Tailwind**: Purges unused styles in production build

## Troubleshooting

### "data.db not found"
- DB auto-creates on first API call
- Check file permissions in project directory

### Service worker not registering
- Browser console should show "SW registered"
- Check that `/public/sw.js` exists
- Refresh page after first deployment

### Offline queue not syncing
- Check browser's Application tab → IndexedDB → chamcong-app
- Verify network connectivity
- Check browser console for sync errors

### Excel export empty
- Ensure attendance records exist for date range
- Check that manager_id in attendance matches user session

## Contributing

This is a complete reference implementation. Feel free to:
- Add roles (admin, supervisor, worker)
- Integrate with external APIs
- Add shift scheduling
- Implement analytics dashboards

## License

MIT - Use freely in your projects

## Support

For issues or questions, review the code comments or check:
- Next.js docs: https://nextjs.org
- SQLite docs: https://www.sqlite.org
- PWA docs: https://web.dev/progressive-web-apps

---

**Built with ❤️ for factory managers** - Made to work offline, fast, and reliably on mobile devices.
