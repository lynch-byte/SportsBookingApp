# Sports Court Booking App

A React Native (Expo) mobile app for finding sports courts in Tagum City and booking them. Users create an account, browse venues, check availability, and book a time slot. Bookings are confirmed immediately, with no admin approval needed. An administrator manages the venues, their schedules and maintenance, and any booking issues.

## Team

| Name | Role |
|---|---|
| Steven Alonzo | Team Leader / Developer |
| Nick Rhean Lucida | UI/UX / Database Developer |

## Features

### For users

- Create an account and log in with a phone number and password. The login is remembered between app launches.
- Browse about 130 venues across pickleball, basketball, badminton, tennis, volleyball, football, futsal, swimming, table tennis, athletics, martial arts, sepak takraw, archery, gymnastics and dance, and chess.
- Search by venue name or location, and filter by sport.
- Court details with price, location, opening hours, number of courts, and an availability schedule by date.
- Venue links (Facebook, booking site, booking sheet, or phone call) for venues that also take bookings elsewhere.
- Book a court: choose the court number, activity, date, hourly slot, and duration. Your name and phone number are filled in from your account.
- Price summary before booking: the venue's starting rate, hours, and an estimated total.
- Instant confirmation: if the slot is free, the booking is confirmed right away.
- Conflict checks: the same court cannot be booked twice at an overlapping time, and the same contact number cannot hold two overlapping bookings.
- Time slots follow each venue's opening hours, and times closed for maintenance are blocked with the reason shown.
- Reschedule or cancel your own bookings.
- My Bookings with Upcoming, Past, and Calendar views. If the administrator cancels a booking, the reason is shown.

### For the administrator

- **Bookings:** see every user's bookings with the booker's name and phone number, search and filter them (upcoming, past, cancelled), and cancel a booking with a reason the user can see.
- **Facilities:** add, edit, and delete venues, including price, number of courts, and booking link.
- **Schedules:** set opening and closing hours for each venue.
- **Maintenance:** close all courts or a single court for a date range, for the whole day or certain hours. If the closure overlaps existing bookings, the admin can cancel them and notify the users.

## Screens

| Screen | Purpose |
|---|---|
| Log in / Create account | Sign in or register |
| Home | Greeting, shortcuts, and the next booking |
| Courts | Search, filter, and browse venues |
| Court Details | Venue information, price, and availability by date |
| Book Court | Create a reservation with a price summary |
| Edit Booking | Reschedule an existing reservation |
| My Bookings | Upcoming, past, and calendar views of your reservations |
| Admin | Manage bookings, venues, schedules, and maintenance (admin only) |

## Tech Stack

- React Native with Expo
- TypeScript
- Expo Router (file-based navigation built on React Navigation): bottom tabs plus stack screens
- SQLite via `expo-sqlite` for local storage
- `expo-crypto` for hashing passwords
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

   If your phone cannot connect, try `npx expo start --tunnel`. Use `npx expo start -c` to clear the cache.

3. Scan the QR code with the Expo Go app on your phone (the phone and computer should be on the same Wi-Fi network).

## Accounts

- **Users** register in the app with a name, phone number, and password.
- **The administrator** account is created automatically the first time the app runs. Its username and password are set by `ADMIN_PHONE` and `ADMIN_PASSWORD` at the top of `src/database/db.ts`. Change them before using the app, and change the database name (for example `courtbooking_v8.db` to `courtbooking_v9.db`) so the new admin account is created.

## Project Structure

```
src
 ├─ app
 │   ├─ (tabs)
 │   │   ├─ index.tsx            Home
 │   │   ├─ courts.tsx           Courts list, search, and filters
 │   │   ├─ my-bookings.tsx      Upcoming, past, and calendar views
 │   │   ├─ admin.tsx            Admin tab (bookings and venues)
 │   │   └─ _layout.tsx          Tabs, log out button, admin-only tab
 │   ├─ book/[courtId].tsx       Book Court
 │   ├─ court/[id].tsx           Court Details
 │   ├─ edit-booking/[id].tsx    Edit Booking
 │   ├─ login.tsx                Log in
 │   ├─ register.tsx             Create account
 │   └─ _layout.tsx              Root layout, login guard
 ├─ components
 │   ├─ BookingForm.tsx          Shared form for booking and rescheduling
 │   ├─ PriceSummary.tsx         Price card shown while booking
 │   ├─ AdminBookings.tsx        Admin: all bookings and cancellations
 │   └─ AdminVenues.tsx          Admin: venues, schedules, maintenance
 ├─ context
 │   └─ AuthContext.tsx          Login session
 └─ database
     ├─ courtsData.ts            Venue seed data
     └─ db.ts                    SQLite setup and data functions
```

## Database

The app uses a local SQLite database with these tables:

- `users`: name, phone number, salted password hash, and role (user or admin)
- `session`: the logged-in user, so the login is remembered
- `courts`: venue name, sport, location, description, starting price, price unit, price note, booking link, number of courts, and opening and closing hours
- `bookings`: venue, court number, user, name, contact number, activity, date, start time, duration, status (confirmed or cancelled), and the administrator's cancellation note
- `maintenance`: venue, court (or all courts), date range, hours, and reason

Venues are loaded from `src/database/courtsData.ts` the first time the app runs. If you edit that file, change the database name in `src/database/db.ts` so the app reseeds on the next launch. This also clears saved accounts and bookings.

## Scope and Limitations

The original proposal listed user login and a web administration system as not included. This version goes beyond that scope by adding accounts and an in-app admin panel.

- All data is stored on the device only. There is no server, so accounts and bookings are not shared between phones, and the venue does not receive in-app bookings. Users should confirm with the venue.
- Passwords are stored as salted hashes, but without a server this is not real security. Anyone with access to the phone's files could tamper with the data.
- There is no online payment. Prices are estimates based on each venue's starting rate, and payment is made at the venue.
- Availability only reflects bookings made in this app, not the venue's own reservations.
- Venue details (prices, addresses, links) were collected manually and may change. Verify them with the venue.