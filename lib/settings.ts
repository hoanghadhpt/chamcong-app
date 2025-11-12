import { getDB } from "./db";

export interface Settings {
  manager_id: number;
  workday_minutes: number;
  round_step_minutes: number;
  late_grace: number;
  early_grace: number;
  default_shift_id: number | null;
  locale: string;
  tz: string;
  enable_gps: number;
  enable_selfie: number;
}

const DEFAULT_SETTINGS: Omit<Settings, "manager_id"> = {
  workday_minutes: 480,
  round_step_minutes: 15,
  late_grace: 5,
  early_grace: 5,
  default_shift_id: null,
  locale: "vi-VN",
  tz: "Asia/Ho_Chi_Minh",
  enable_gps: 0,
  enable_selfie: 0,
};

export function getSettingsByManagerId(managerId: number): Settings {
  const db = getDB();
  const existing = db
    .prepare("SELECT * FROM settings WHERE manager_id = ?")
    .get(managerId) as Settings | undefined;

  if (existing) {
    return existing;
  }

  // Create default settings for new manager
  const stmt = db.prepare(
    `INSERT INTO settings
     (manager_id, workday_minutes, round_step_minutes, late_grace, early_grace, locale, tz, enable_gps, enable_selfie)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  stmt.run(
    managerId,
    DEFAULT_SETTINGS.workday_minutes,
    DEFAULT_SETTINGS.round_step_minutes,
    DEFAULT_SETTINGS.late_grace,
    DEFAULT_SETTINGS.early_grace,
    DEFAULT_SETTINGS.locale,
    DEFAULT_SETTINGS.tz,
    DEFAULT_SETTINGS.enable_gps,
    DEFAULT_SETTINGS.enable_selfie
  );

  return getSettingsByManagerId(managerId);
}

export function updateSettings(
  managerId: number,
  updates: Partial<Omit<Settings, "manager_id">>
): Settings {
  const db = getDB();

  const setClause = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");

  const values = Object.values(updates);

  db.prepare(
    `UPDATE settings SET ${setClause} WHERE manager_id = ?`
  ).run(...values, managerId);

  return getSettingsByManagerId(managerId);
}
