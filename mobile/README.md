# LocalEvent — Mobile (React Native / Expo)

A native mobile client for LocalEvent. It reuses the existing **Go REST API** unchanged; the phone is a thin client focused on the attendee loop plus the one organizer task that belongs on a phone: **QR check-in**.

## Stack
- **Expo (managed)** + **Expo Router** (file-based navigation)
- **TanStack Query** for data, **expo-secure-store** for the auth token
- **expo-camera** (QR scanning), **react-native-qrcode-svg** (ticket QR), **react-native-webview** (Chapa)
- Styling: plain `StyleSheet` with a small theme (`lib/theme.ts`)

## Features included
- Auth: login, signup (with role), forgot/reset password
- Discover: search + category/free filters, event list, pull-to-refresh
- Event details: bookmark, follow, **Open in Maps**, Get Tickets
- Ticketing: checkout with **Chapa in a WebView**, free events instant
- My Tickets with **QR codes** (Checked-in / Ended / pending states)
- Profile & settings: edit name/phone/city, change password, logout
- Organizer: My Events, sales/attendance, buyers + **Mark Attended**
- **Scan** (main): camera QR check-in — tap to start, one scan → result → scan again, plus manual code entry

## Deliberately excluded (kept on web)
- Admin analytics dashboard & category CRUD
- Analytics charts, CSV/PDF export, email reminders
- Full event create/edit (multi-image + map picker) — author on web
- Embedded maps (replaced by "Open in Maps"), GPS "near me", avatar image upload

## Setup

```bash
cd mobile
npm install
npx expo install --fix     # aligns native module versions with the Expo SDK
```

Create `mobile/.env` from the example and point it at your backend:

```
# Emulator can use localhost; a real device must use your machine's LAN IP.
EXPO_PUBLIC_API_URL=http://192.168.1.20:3001/api
```

Run it:

```bash
npx expo start
```

Then open in **Expo Go** (scan the QR) or an emulator. `expo-camera`, `react-native-webview`, and `react-native-qrcode-svg` all work in Expo Go, so no custom dev build is required for the MVP.

## Notes
- **API URL on a device:** `localhost` points at the phone, not your computer — use your LAN IP (and make sure the backend is reachable on it).
- **Chapa return:** the checkout WebView watches for the backend's `return_url` (`…/payment/success`), then calls `/payments/verify`. No backend change needed. Use your **Chapa test keys**.
- **Camera:** permission is requested when you first tap **Scan QR Code**.
- The **Scan** tab only appears for `organizer`/`admin` accounts.

## Structure
```
mobile/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # providers (Query, Auth, Toast) + Stack
│   ├── index.tsx             # auth redirect
│   ├── (auth)/               # login, signup, forgot/reset
│   ├── (tabs)/               # Discover, Saved, Scan, Tickets, Profile
│   ├── events/[id].tsx       # event details
│   ├── checkout/[eventId].tsx# checkout + Chapa WebView
│   └── organizer/            # my events + manage/buyers
├── components/               # Screen, Button, TextField, EventCard, Badge…
└── lib/                      # api, endpoints, auth, types, theme, format, toast
```
