# EV Charge Booking — User App (Expo)

Mobile-first client for the EV Charging Station Locator & Slot Booking backend. It ships discovery, booking lifecycle management, GPS-assisted nearby ordering, and guarded placeholders for Phase 2 features that still need backend contracts.

## Prerequisites

- Node.js 18+
- iOS Simulator / Xcode (macOS) or Android Studio / device
- Backend running locally at `http://localhost:5000` (or tunnel the URL)

## Configure environment

```bash
cp .env.example .env
```

Default value:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

> Android emulators must use `http://10.0.2.2:5000`. Physical devices cannot reach your PC's `localhost`; use the machine LAN IP or a tunnel (ngrok, Cloudflare Tunnel, etc.).

## Install & run

```bash
npm install
npm run start
```

Then choose `i`, `a`, or scan the QR code with Expo Go.

### Useful scripts

- `npm run start` — launch the dev server (`expo start`)
- `npm run android` / `npm run ios` — platform-specific shortcuts

## Architecture overview

- `src/api` — Axios client with JWT injection + 401 recovery
- `src/context` — session hydration + profile fetch
- `src/hooks` — TanStack Query data hooks for chargers and bookings
- `src/services` — AsyncStorage token helpers, Haversine math, polling helpers
- `src/navigation` — Auth stack, tabbed main experience, nested feature stacks
- `src/screens` — feature slices (auth, discovery, bookings, profile, system)
- `src/components` — reusable cards, forms, skeletons, and EV-specific UI

Polling (`realtimeService.ts`) keeps charger + booking queries warm until a WebSocket contract exists.

## Backend endpoints used (MVP)

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/users/register` | POST | Create a driver account |
| `/api/auth/users/login` | POST | Obtain JWT |
| `/api/auth/users/profile` | GET | Hydrate session after login / relaunch |
| `/api/stations` | GET | Public charger catalog |
| `/api/stations/:id` | GET | Detailed station profile |
| `/api/stations/:id/availability` | GET | Slot signals (optional query params for window) |
| `/api/bookings` | POST | Immediate or scheduled booking |
| `/api/bookings/my` | GET | List the signed-in driver’s reservations |
| `/api/bookings/:id/cancel` | PATCH | User-cancel active booking |

## Phase 2 placeholders (explicit gaps)

Each placeholder file calls out `Requires backend Phase 2 endpoint` when server support is mandatory:

- `src/api/locationApi.ts` — server-side arrival / geo webhooks
- `src/api/realtimeApi.ts` — WebSocket / SSE channel
- `src/services/notificationService.ts` — device push registration
- `src/services/realtimeService.ts` — polling bridge until sockets land
- `src/screens/bookings/BookingDetailScreen.tsx` — remote no-show reconciliation copy

### Future backend endpoints worth defining

1. `POST /api/bookings/:id/check-in` — persist arrival + unlock session timer
2. `POST /api/users/devices` — store Expo push tokens per OS
3. `GET /api/bookings/:id/stream` or `socket.io` namespace — live slot + booking updates
4. `POST /api/stations/:id/nav` — optional deep link targets for maps providers
5. Automation jobs for no-show + late cancellation penalties (paired with policy engine)

## Troubleshooting

- **401 on resume** — tokens clear automatically; you’ll land on login with a “session expired” notice
- **Network errors** — surfaced as inline banners + retry affordances
- **Metro asks for LAN** — follow Expo CLI prompts for tunnel/LAN mode on physical devices

## QA checklist

- Register → auto login path
- Token persistence after killing the app
- Station list/detail pull-to-refresh
- Booking (immediate + scheduled) → success route
- Cancel guarded bookings with confirmation
- GPS denied / unavailable graceful states
- Offline backend message

---

Built with Expo Router-free navigation, TanStack Query, React Hook Form + Zod, Expo Location, and StyleSheet-driven theming for predictable upgrades.
