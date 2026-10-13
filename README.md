# Sports Court Booking App

A React Native (Expo) mobile app for finding sports courts in Tagum City and managing court reservations. Users can browse venues, check availability, book a time slot, and reschedule or cancel their bookings.

## Team

| Name | Role |
|---|---|
| Steven Alonzo | Team Leader / Developer |
| Nick Rhean Lucida | UI/UX / Database Developer |

## Features

- Browse about 130 venues across pickleball, basketball, badminton, tennis, volleyball, football, futsal, swimming, table tennis, athletics, martial arts, sepak takraw, archery, gymnastics and dance, and chess
- Search by venue name or location, and filter by sport
- Court details with price, location, number of courts, and an availability schedule by date
- Venue links (Facebook, booking site, booking sheet, or phone call) for venues that take bookings elsewhere
- Book a court: name, contact number, court number, activity, date, hourly slot, and duration
- Conflict check before saving: the same court cannot be booked twice at an overlapping time, and the same contact number cannot hold two overlapping bookings
- Reschedule or cancel a booking
- My Bookings with Upcoming, Past, and Calendar views
- Home dashboard showing the next upcoming booking

## Screens

| Screen | Purpose |
|---|---|
| Home | Dashboard with shortcuts and the next booking |
| Courts | Search, filter, and browse venues |
| Court Details | Venue information, price, and availability by date |
| Book Court | Create a reservation |
| Edit Booking | Reschedule an existing reservation |
| My Bookings | Upcoming, past, and calendar views of reservations |

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router (file-based navigation built on React Navigation): bottom tabs plus stack screens
- SQLite via `expo-sqlite` for local storage
- Development tools: VS Code, GitHub, Expo Go on an Android device

## Getting Started

1. Install dependencies:

```bash
   npm install
```

2. Start the development server:

```bash
   npx expo start
```

   If your phone cannot connect, try `npx expo start --tunnel`, or `npx expo start -c` to clear the cache.

3. Scan the QR code with the Expo Go app on your phone (the phone and computer should be on the same Wi-Fi network).

## Project Structure

```
src
 ├─ app
 │   ├─ (tabs)
 │   │   ├─ index.tsx            Home
 │   │   ├─ courts.tsx           Courts list, search, and filters
 │   │   └─ my-bookings.tsx      Upcoming, past, and calendar views
 │   ├─ book/[courtId].tsx       Book Court
 │   ├─ court/[id].tsx           Court Details
 │   ├─ edit-booking/[id].tsx    Edit Booking
 │   └─ _layout.tsx              Root layout and database setup
 ├─ components
 │   └─ BookingForm.tsx          Shared form for booking and rescheduling
 └─ database
     ├─ courtsData.ts            Venue seed data
     └─ db.ts                    SQLite setup and CRUD functions
```

## Database

The app uses a local SQLite database with two tables:

- `courts`: venue name, sport, location, description, starting price, price unit, price note, booking link, and number of courts
- `bookings`: court, court number, name, contact number, activity, date, start time, duration, and status

Venues are loaded from `src/database/courtsData.ts` the first time the app runs. If you edit that file, change the database name in `src/database/db.ts` (for example `courtbooking_v6.db` to `courtbooking_v7.db`) so the app reseeds on the next launch. This also clears saved bookings.

## Scope and Limitations

This project follows the scope of the original proposal:

- Bookings are saved on the device only. The venue does not receive them, so users should confirm with the venue to secure a slot.
- There is no login system, online payment, push notification, or web admin panel.
- Availability only reflects bookings made in this app, not the venue's own reservations.
- Time slots assume opening hours of 6 AM to 10 PM for every venue.
- Venue details (prices, addresses, links) were collected manually and may change. Verify them with the venue.