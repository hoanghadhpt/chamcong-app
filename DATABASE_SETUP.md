# Database Setup Guide

This application now uses PostgreSQL instead of SQLite. Follow these instructions to set up your database.

## Prerequisites

- PostgreSQL 12 or higher installed on your system
- Node.js and npm installed

## Installation Steps

### 1. Install PostgreSQL

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database

Connect to PostgreSQL as the postgres user:

```bash
# On Linux/macOS
sudo -u postgres psql

# On Windows (use psql from Command Prompt)
psql -U postgres
```

Create a new database and user:

```sql
-- Create database
CREATE DATABASE chamcong;

-- Create user with password
CREATE USER chamcong_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chamcong TO chamcong_user;

-- Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL`:

```
DATABASE_URL=postgresql://chamcong_user:your_secure_password@localhost:5432/chamcong
```

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Examples:**

Local development:
```
DATABASE_URL=postgresql://chamcong_user:password123@localhost:5432/chamcong
```

Production (with SSL):
```
DATABASE_URL=postgresql://user:pass@your-db-host.com:5432/chamcong?sslmode=require
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Initialize Database Schema

The application will automatically create all necessary tables and indexes when it starts for the first time. The schema includes:

- **users** - User accounts and authentication
- **sessions** - User sessions
- **workers** - Employee records
- **shifts** - Work shift definitions
- **settings** - Manager-specific settings
- **holidays** - Holiday calendar
- **attendance** - Attendance tracking records

### 6. Start the Application

```bash
npm run dev
```

The application will connect to PostgreSQL and automatically initialize the schema on first run.

## Production Deployment

### Environment Variables

For production, ensure your `DATABASE_URL` environment variable is set properly:

```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

### Database Connection Pooling

The application uses connection pooling with these default settings:
- Maximum connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

These can be adjusted in `lib/db.ts` if needed.

### SSL Configuration

For production databases that require SSL, add the `sslmode` parameter:

```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## Troubleshooting

### Connection Errors

**Error: "DATABASE_URL environment variable is not set"**
- Make sure you have created a `.env` file with the `DATABASE_URL` variable

**Error: "password authentication failed"**
- Check your database username and password in the connection string
- Ensure the PostgreSQL user has the correct password

**Error: "database does not exist"**
- Make sure you created the database using `CREATE DATABASE chamcong;`
- Verify the database name in your connection string matches the created database

**Error: "FATAL: Peer authentication failed"**
- Edit PostgreSQL's `pg_hba.conf` file to allow password authentication
- Change `peer` to `md5` for local connections
- Restart PostgreSQL: `sudo systemctl restart postgresql`

### Checking Database Connection

To verify your PostgreSQL connection:

```bash
psql "postgresql://chamcong_user:your_password@localhost:5432/chamcong"
```

### Viewing Tables

Once connected to the database:

```sql
-- List all tables
\dt

-- Describe a specific table
\d users

-- View table data
SELECT * FROM users;
```

## Migration from SQLite

If you're migrating from the old SQLite database:

1. Export data from SQLite (if needed):
   - Users, workers, shifts, settings, holidays, attendance

2. Import into PostgreSQL:
   - Use the application's import features for workers
   - Manually recreate users and other settings

3. Remove old database file:
   ```bash
   rm data.db data.db-wal data.db-shm
   ```

## Database Backup

### Backup Command

```bash
pg_dump -U chamcong_user -d chamcong > backup.sql
```

### Restore Command

```bash
psql -U chamcong_user -d chamcong < backup.sql
```

## Security Best Practices

1. **Use Strong Passwords**: Generate secure passwords for database users
2. **Limit Database Access**: Only allow connections from trusted IP addresses
3. **Use SSL**: Enable SSL for production database connections
4. **Regular Backups**: Schedule automatic database backups
5. **Environment Variables**: Never commit `.env` file with real credentials
6. **Rotate Credentials**: Periodically update database passwords

## Support

For issues with PostgreSQL setup, consult:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg library documentation](https://node-postgres.com/)
