import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";
import { COURTS_SEED } from "./courtsData";

// ---------- ADMIN ACCOUNT ----------
// Change these before you submit. The admin logs in with this username/phone
// and password.
const ADMIN_PHONE = "admin";
const ADMIN_PASSWORD = "admin123";

// ---------- TYPES ----------

export type Role = "user" | "admin";
export type BookingStatus = "confirmed" | "cancelled";

export type User = {
  id: number;
  name: string;
  phone: string;
  role: Role;
};

export type Court = {
  id: number;
  name: string;
  sport_type: string;
  location: string;
  description: string;
  price_from: number | null;
  price_unit: string;
  price_note: string | null;
  booking_url: string | null;
  court_count: number;
  open_hour: number; // opening hour, 24h (6 = 6 AM)
  close_hour: number; // closing hour, 24h (22 = 10 PM)
};

export type CourtInput = Omit<Court, "id">;

export type Booking = {
  id: number;
  court_id: number;
  court_number: number; // which court at the venue (1, 2, 3...)
  user_id: number | null; // who made the booking
  name: string;
  contact_number: string;
  activity: string; // purpose of the booking
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24h)
  duration: number; // hours
  status: string; // confirmed | cancelled
  admin_note: string | null; // reason when the admin cancels a booking
};

export type BookingWithCourt = Booking & {
  court_name: string;
  sport_type: string;
  price_from: number | null;
  price_unit: string;
};

// What the booking form sends when creating a booking
export type BookingInput = Omit<Booking, "id" | "status" | "admin_note">;

export type Maintenance = {
  id: number;
  court_id: number;
  court_number: number; // 0 = every court at the venue
  date_from: string; // YYYY-MM-DD
  date_to: string; // YYYY-MM-DD
  start_hour: number; // 0 for the whole day
  end_hour: number; // 24 for the whole day
  reason: string;
};

// ---------- DATABASE ----------

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("courtbooking_v8.db");
  return dbPromise;
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password,
  );
}

// Phone numbers keep digits only. Anything else (like "admin") is kept as typed.
function normalizePhone(input: string) {
  const t = input.trim().toLowerCase();
  return /^[0-9+\s-]+$/.test(t) ? t.replace(/\D/g, "") : t;
}

function hourLabel(h: number) {
  const hh = h % 24;
  return `${hh % 12 || 12} ${hh < 12 ? "AM" : "PM"}`;
}

export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS courts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sport_type TEXT NOT NULL,
      location TEXT,
      description TEXT,
      price_from REAL,
      price_unit TEXT NOT NULL DEFAULT 'hour',
      price_note TEXT,
      booking_url TEXT,
      court_count INTEGER NOT NULL DEFAULT 1,
      open_hour INTEGER NOT NULL DEFAULT 6,
      close_hour INTEGER NOT NULL DEFAULT 22
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      court_id INTEGER NOT NULL,
      court_number INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER,
      name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      activity TEXT NOT NULL DEFAULT 'Casual play',
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      admin_note TEXT,
      FOREIGN KEY (court_id) REFERENCES courts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      court_id INTEGER NOT NULL,
      court_number INTEGER NOT NULL DEFAULT 0,
      date_from TEXT NOT NULL,
      date_to TEXT NOT NULL,
      start_hour INTEGER NOT NULL DEFAULT 0,
      end_hour INTEGER NOT NULL DEFAULT 24,
      reason TEXT NOT NULL DEFAULT 'Maintenance',
      FOREIGN KEY (court_id) REFERENCES courts(id)
    );
  `);

  // Create the admin account the first time the app runs
  const admin = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
  );
  if (!admin) {
    const salt = Crypto.randomUUID();
    const hash = await hashPassword(ADMIN_PASSWORD, salt);
    await db.runAsync(
      "INSERT INTO users (name, phone, salt, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
      ["Administrator", normalizePhone(ADMIN_PHONE), salt, hash],
    );
  }

  // Load the venues the first time the app runs
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM courts",
  );
  if (row && row.count === 0) {
    await db.withTransactionAsync(async () => {
      for (const c of COURTS_SEED) {
        await db.runAsync(
          `INSERT INTO courts
            (name, sport_type, location, description, price_from, price_unit, price_note, booking_url, court_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.name,
            c.sport_type,
            c.location,
            c.description,
            c.price_from,
            c.price_unit,
            c.price_note,
            c.booking_url,
            c.court_count,
          ],
        );
      }
    });
  }
}

// ---------- ACCOUNTS ----------

type AuthResult = { ok: boolean; message?: string; user?: User };

export async function registerUser(
  name: string,
  phone: string,
  password: string,
): Promise<AuthResult> {
  if (!name.trim()) return { ok: false, message: "Please enter your name." };
  if (!/^[0-9+\s-]{7,15}$/.test(phone.trim())) {
    return { ok: false, message: "Enter a valid phone number." };
  }
  if (password.length < 6) {
    return { ok: false, message: "Password must be at least 6 characters." };
  }

  const db = await getDb();
  const key = normalizePhone(phone);
  const exists = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE phone = ?",
    [key],
  );
  if (exists) {
    return { ok: false, message: "An account with this phone number already exists." };
  }

  const salt = Crypto.randomUUID();
  const hash = await hashPassword(password, salt);
  const res = await db.runAsync(
    "INSERT INTO users (name, phone, salt, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
    [name.trim(), key, salt, hash],
  );
  return {
    ok: true,
    user: { id: res.lastInsertRowId, name: name.trim(), phone: key, role: "user" },
  };
}

export async function loginUser(phone: string, password: string): Promise<AuthResult> {
  const db = await getDb();
  const u = await db.getFirstAsync<{
    id: number;
    name: string;
    phone: string;
    role: Role;
    salt: string;
    password_hash: string;
  }>("SELECT * FROM users WHERE phone = ?", [normalizePhone(phone)]);

  if (!u) return { ok: false, message: "Wrong phone number or password." };
  const hash = await hashPassword(password, u.salt);
  if (hash !== u.password_hash) {
    return { ok: false, message: "Wrong phone number or password." };
  }
  return { ok: true, user: { id: u.id, name: u.name, phone: u.phone, role: u.role } };
}

// Who is logged in (remembered between app launches)
export async function getSessionUser(): Promise<User | null> {
  const db = await getDb();
  return db.getFirstAsync<User>(
    `SELECT u.id, u.name, u.phone, u.role
     FROM session s JOIN users u ON u.id = s.user_id
     WHERE s.id = 1`,
  );
}

export async function setSession(userId: number | null) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session (id, user_id) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id`,
    [userId],
  );
}

// ---------- COURTS (READ) ----------

export async function getCourts(sportType?: string): Promise<Court[]> {
  const db = await getDb();
  if (sportType && sportType !== "All") {
    return db.getAllAsync<Court>(
      "SELECT * FROM courts WHERE sport_type = ? ORDER BY name",
      [sportType],
    );
  }
  return db.getAllAsync<Court>("SELECT * FROM courts ORDER BY name");
}

export async function getCourtById(id: number): Promise<Court | null> {
  const db = await getDb();
  return db.getFirstAsync<Court>("SELECT * FROM courts WHERE id = ?", [id]);
}

// ---------- COURTS (ADMIN: facilities and schedules) ----------

export async function addCourt(c: CourtInput) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO courts
      (name, sport_type, location, description, price_from, price_unit, price_note,
       booking_url, court_count, open_hour, close_hour)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      c.name,
      c.sport_type,
      c.location,
      c.description,
      c.price_from,
      c.price_unit,
      c.price_note,
      c.booking_url,
      c.court_count,
      c.open_hour,
      c.close_hour,
    ],
  );
}

export async function updateCourt(id: number, c: CourtInput) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE courts
     SET name = ?, sport_type = ?, location = ?, description = ?, price_from = ?,
         price_unit = ?, price_note = ?, booking_url = ?, court_count = ?,
         open_hour = ?, close_hour = ?
     WHERE id = ?`,
    [
      c.name,
      c.sport_type,
      c.location,
      c.description,
      c.price_from,
      c.price_unit,
      c.price_note,
      c.booking_url,
      c.court_count,
      c.open_hour,
      c.close_hour,
      id,
    ],
  );
}

// Deletes the venue together with its bookings and maintenance entries
export async function deleteCourt(id: number) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM bookings WHERE court_id = ?", [id]);
    await db.runAsync("DELETE FROM maintenance WHERE court_id = ?", [id]);
    await db.runAsync("DELETE FROM courts WHERE id = ?", [id]);
  });
}

// ---------- MAINTENANCE ----------

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// All maintenance entries for a venue (admin screen)
export async function getMaintenanceForCourt(courtId: number): Promise<Maintenance[]> {
  const db = await getDb();
  return db.getAllAsync<Maintenance>(
    "SELECT * FROM maintenance WHERE court_id = ? ORDER BY date_from DESC",
    [courtId],
  );
}

// Maintenance that applies on one date (booking form)
export async function getMaintenanceOnDate(
  courtId: number,
  date: string,
): Promise<Maintenance[]> {
  const db = await getDb();
  return db.getAllAsync<Maintenance>(
    "SELECT * FROM maintenance WHERE court_id = ? AND date_from <= ? AND date_to >= ?",
    [courtId, date, date],
  );
}

async function findMaintenance(
  courtId: number,
  courtNumber: number,
  date: string,
  startTime: string,
  duration: number,
): Promise<Maintenance | null> {
  const rows = await getMaintenanceOnDate(courtId, date);
  const s = toMinutes(startTime);
  const e = s + duration * 60;
  return (
    rows.find(
      (m) =>
        (m.court_number === 0 || m.court_number === courtNumber) &&
        s < m.end_hour * 60 &&
        e > m.start_hour * 60,
    ) ?? null
  );
}

// Existing confirmed bookings that overlap a maintenance entry
export async function getAffectedBookings(
  m: Omit<Maintenance, "id">,
): Promise<BookingWithCourt[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingWithCourt>(
    `${BOOKING_SELECT}
     WHERE b.court_id = ? AND b.date >= ? AND b.date <= ? AND b.status = 'confirmed'
     ORDER BY b.date, b.start_time`,
    [m.court_id, m.date_from, m.date_to],
  );
  return rows.filter((b) => {
    if (m.court_number !== 0 && b.court_number !== m.court_number) return false;
    const s = toMinutes(b.start_time);
    const e = s + b.duration * 60;
    return s < m.end_hour * 60 && e > m.start_hour * 60;
  });
}

// Saves the maintenance entry and returns the bookings it overlaps,
// so the admin can cancel them
export async function addMaintenance(
  m: Omit<Maintenance, "id">,
): Promise<BookingWithCourt[]> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO maintenance (court_id, court_number, date_from, date_to, start_hour, end_hour, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [m.court_id, m.court_number, m.date_from, m.date_to, m.start_hour, m.end_hour, m.reason],
  );
  return getAffectedBookings(m);
}

export async function deleteMaintenance(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM maintenance WHERE id = ?", [id]);
}

// ---------- BOOKINGS (READ) ----------

const BOOKING_SELECT = `
  SELECT b.*, c.name AS court_name, c.sport_type, c.price_from, c.price_unit
  FROM bookings b
  JOIN courts c ON c.id = b.court_id`;

// Pass a user id to get only that person's bookings. Leave it out for all bookings (admin).
export async function getBookings(userId?: number): Promise<BookingWithCourt[]> {
  const db = await getDb();
  if (userId !== undefined) {
    return db.getAllAsync<BookingWithCourt>(
      `${BOOKING_SELECT} WHERE b.user_id = ? ORDER BY b.date DESC, b.start_time DESC`,
      [userId],
    );
  }
  return db.getAllAsync<BookingWithCourt>(
    `${BOOKING_SELECT} ORDER BY b.date DESC, b.start_time DESC`,
  );
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const db = await getDb();
  return db.getFirstAsync<Booking>("SELECT * FROM bookings WHERE id = ?", [id]);
}

// Cancelled bookings are left out, so their time slots become free again
export async function getBookingsForCourtOnDate(
  courtId: number,
  date: string,
): Promise<Booking[]> {
  const db = await getDb();
  return db.getAllAsync<Booking>(
    `SELECT * FROM bookings
     WHERE court_id = ? AND date = ? AND status != 'cancelled'
     ORDER BY start_time`,
    [courtId, date],
  );
}

// ---------- CONFLICT CHECKS ----------

export async function hasConflict(
  courtId: number,
  courtNumber: number,
  date: string,
  startTime: string,
  duration: number,
  excludeBookingId?: number,
): Promise<boolean> {
  const existing = await getBookingsForCourtOnDate(courtId, date);
  const newStart = toMinutes(startTime);
  const newEnd = newStart + duration * 60;

  return existing.some((b) => {
    if (b.id === excludeBookingId) return false;
    if (b.court_number !== courtNumber) return false; // different court, no clash
    const start = toMinutes(b.start_time);
    const end = start + b.duration * 60;
    return newStart < end && newEnd > start;
  });
}

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

// Finds a booking by the same person (same contact number) that overlaps in time,
// at ANY venue. Returns a message if found, otherwise null.
export async function findPersonConflict(
  contact: string,
  date: string,
  startTime: string,
  duration: number,
  excludeBookingId?: number,
): Promise<string | null> {
  const db = await getDb();
  const rows = await db.getAllAsync<BookingWithCourt>(
    `${BOOKING_SELECT} WHERE b.date = ? AND b.status != 'cancelled'`,
    [date],
  );
  const newStart = toMinutes(startTime);
  const newEnd = newStart + duration * 60;

  const clash = rows.find((b) => {
    if (b.id === excludeBookingId) return false;
    if (digitsOnly(b.contact_number) !== digitsOnly(contact)) return false;
    const s = toMinutes(b.start_time);
    const e = s + b.duration * 60;
    return newStart < e && newEnd > s;
  });

  return clash
    ? `This conflicts with your booking at ${clash.court_name} (Court ${clash.court_number}) at that time.`
    : null;
}

// Runs every rule a booking must pass. Returns an error message, or null if it is fine.
async function checkBooking(
  b: Omit<BookingInput, "user_id">,
  excludeBookingId?: number,
): Promise<string | null> {
  const court = await getCourtById(b.court_id);
  if (!court) return "This venue no longer exists.";

  const start = toMinutes(b.start_time);
  const end = start + b.duration * 60;
  if (start < court.open_hour * 60 || end > court.close_hour * 60) {
    return `This venue is open ${hourLabel(court.open_hour)} to ${hourLabel(court.close_hour)}.`;
  }

  const maint = await findMaintenance(
    b.court_id,
    b.court_number,
    b.date,
    b.start_time,
    b.duration,
  );
  if (maint) return `Closed for maintenance at that time: ${maint.reason}.`;

  if (
    await hasConflict(
      b.court_id,
      b.court_number,
      b.date,
      b.start_time,
      b.duration,
      excludeBookingId,
    )
  ) {
    return "This time conflicts with an existing booking on that court.";
  }

  return findPersonConflict(
    b.contact_number,
    b.date,
    b.start_time,
    b.duration,
    excludeBookingId,
  );
}

// ---------- BOOKINGS (CREATE) ----------

// Bookings are confirmed right away. No admin approval is needed.
export async function addBooking(
  b: BookingInput,
): Promise<{ ok: boolean; message?: string }> {
  const problem = await checkBooking(b);
  if (problem) return { ok: false, message: problem };

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO bookings
      (court_id, court_number, user_id, name, contact_number, activity, date, start_time, duration, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [
      b.court_id,
      b.court_number,
      b.user_id,
      b.name,
      b.contact_number,
      b.activity,
      b.date,
      b.start_time,
      b.duration,
    ],
  );
  return { ok: true };
}

// ---------- BOOKINGS (UPDATE) ----------

export async function updateBooking(
  id: number,
  b: Omit<BookingInput, "user_id">,
): Promise<{ ok: boolean; message?: string }> {
  const problem = await checkBooking(b, id);
  if (problem) return { ok: false, message: problem };

  const db = await getDb();
  await db.runAsync(
    `UPDATE bookings
     SET court_id = ?, court_number = ?, name = ?, contact_number = ?, activity = ?,
         date = ?, start_time = ?, duration = ?
     WHERE id = ?`,
    [
      b.court_id,
      b.court_number,
      b.name,
      b.contact_number,
      b.activity,
      b.date,
      b.start_time,
      b.duration,
      id,
    ],
  );
  return { ok: true };
}

// Admin: cancel a booking and leave a reason the user can see
export async function cancelBookingByAdmin(id: number, note: string) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE bookings SET status = 'cancelled', admin_note = ? WHERE id = ?",
    [note.trim() || "Cancelled by the administrator.", id],
  );
}

// ---------- BOOKINGS (DELETE) ----------

export async function deleteBooking(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM bookings WHERE id = ?", [id]);
}