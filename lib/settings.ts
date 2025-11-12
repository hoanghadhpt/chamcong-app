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

export async function getSettingsByManagerId(managerId: number): Promise<Settings> {
  const db = getDB();
  const result = await db.query(
    "SELECT * FROM settings WHERE manager_id = $1",
    [managerId]
  );

  const existing = result.rows[0] as Settings | undefined;

  if (existing) {
    return existing;
  }

  // Create default settings for new manager
  const insertResult = await db.query(
    `INSERT INTO settings
     (manager_id, workday_minutes, round_step_minutes, late_grace, early_grace, locale, tz, enable_gps, enable_selfie)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      managerId,
      DEFAULT_SETTINGS.workday_minutes,
      DEFAULT_SETTINGS.round_step_minutes,
      DEFAULT_SETTINGS.late_grace,
      DEFAULT_SETTINGS.early_grace,
      DEFAULT_SETTINGS.locale,
      DEFAULT_SETTINGS.tz,
      DEFAULT_SETTINGS.enable_gps,
      DEFAULT_SETTINGS.enable_selfie
    ]
  );

  return insertResult.rows[0] as Settings;
}

export async function updateSettings(
  managerId: number,
  updates: Partial<Omit<Settings, "manager_id">>
): Promise<Settings> {
  const db = getDB();

  const keys = Object.keys(updates);
  const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  const values = Object.values(updates);

  await db.query(
    `UPDATE settings SET ${setClause} WHERE manager_id = $${keys.length + 1}`,
    [...values, managerId]
  );

  return getSettingsByManagerId(managerId);
}
