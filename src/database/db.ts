import * as SQLite from "expo-sqlite";
import { COURTS_SEED } from "./courtsData";

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
};

export type Booking = {
  id: number;
  court_id: number;
  court_number: number; // which court at the venue (1, 2, 3...)
  name: string;
  contact_number: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (24h)
  duration: number; // hours
  status: string;
};

export type BookingWithCourt = Booking & {
  court_name: string;
  sport_type: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync("courtbooking_v5.db");
  return dbPromise;
}

export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

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
      court_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      court_id INTEGER NOT NULL,
      court_number INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (court_id) REFERENCES courts(id)
    );
  `);

  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM courts"
  );
  if (row && row.count === 0) {
    for (const c of COURTS_SEED) {
      await db.runAsync(
        `INSERT INTO courts
          (name, sport_type, location, description, price_from, price_unit, price_note, booking_url, court_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.name, c.sport_type, c.location, c.description,
         c.price_from, c.price_unit, c.price_note, c.booking_url, c.court_count]
      );
    }
  }
}

// ---------- READ ----------

export async function getCourts(sportType?: string): Promise<Court[]> {
  const db = await getDb();
  if (sportType && sportType !== "All") {
    return db.getAllAsync<Court>(
      "SELECT * FROM courts WHERE sport_type = ? ORDER BY name",
      [sportType]
    );
  }
  return db.getAllAsync<Court>("SELECT * FROM courts ORDER BY name");
}

export async function getCourtById(id: number): Promise<Court | null> {
  const db = await getDb();
  return db.getFirstAsync<Court>("SELECT * FROM courts WHERE id = ?", [id]);
}

export async function getBookings(): Promise<BookingWithCourt[]> {
  const db = await getDb();
  return db.getAllAsync<BookingWithCourt>(`
    SELECT b.*, c.name AS court_name, c.sport_type
    FROM bookings b
    JOIN courts c ON c.id = b.court_id
    ORDER BY b.date DESC, b.start_time DESC
  `);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const db = await getDb();
  return db.getFirstAsync<Booking>("SELECT * FROM bookings WHERE id = ?", [id]);
}

export async function getBookingsForCourtOnDate(
  courtId: number,
  date: string
): Promise<Booking[]> {
  const db = await getDb();
  return db.getAllAsync<Booking>(
    "SELECT * FROM bookings WHERE court_id = ? AND date = ? ORDER BY start_time",
    [courtId, date]
  );
}

// ---------- CONFLICT CHECK ----------

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export async function hasConflict(
  courtId: number,
  courtNumber: number,
  date: string,
  startTime: string,
  duration: number,
  excludeBookingId?: number
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

// ---------- CREATE ----------

export async function addBooking(
  b: Omit<Booking, "id" | "status">
): Promise<{ ok: boolean; message?: string }> {
  if (await hasConflict(b.court_id, b.court_number, b.date, b.start_time, b.duration)) {
    return { ok: false, message: "That court is already booked at that time." };
  }
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO bookings (court_id, court_number, name, contact_number, date, start_time, duration)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [b.court_id, b.court_number, b.name, b.contact_number, b.date, b.start_time, b.duration]
  );
  return { ok: true };
}

// ---------- UPDATE ----------

export async function updateBooking(
  id: number,
  b: Omit<Booking, "id" | "status">
): Promise<{ ok: boolean; message?: string }> {
  if (await hasConflict(b.court_id, b.court_number, b.date, b.start_time, b.duration, id)) {
    return { ok: false, message: "That court is already booked at that time." };
  }
  const db = await getDb();
  await db.runAsync(
    `UPDATE bookings
     SET court_id = ?, court_number = ?, name = ?, contact_number = ?, date = ?, start_time = ?, duration = ?
     WHERE id = ?`,
    [b.court_id, b.court_number, b.name, b.contact_number, b.date, b.start_time, b.duration, id]
  );
  return { ok: true };
}

// ---------- DELETE ----------

export async function deleteBooking(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM bookings WHERE id = ?", [id]);
}