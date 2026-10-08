# GHARSAATHI Backend Architecture & Real-Time Engine

> "घर के हर काम का भरोसेमंद साथी"  
> **Official Business Support Hotline:** 8435423190

This is the backend service for the **GharSaathi** on-demand home services marketplace. Built with **Node.js, Express, TypeScript, Socket.IO**, and **PostgreSQL with Prisma ORM**, adhering to clean architecture.

---

## 1. Directory Structure

```text
/server
├── prisma/
│   └── schema.prisma       # Full PostgreSQL database models (User, Profile, Booking, etc.)
├── src/
│   ├── config/             # Config, environment validation, business constants
│   ├── controllers/        # Express REST API controllers
│   ├── middleware/         # Auth, validation, and error middlewares
│   ├── routes/             # REST API routes (/api/*)
│   ├── services/
│   │   └── dispatch.service.ts  # Real-time ranking algorithm, 25s timer, atomic CAS lock
│   ├── socket/
│   │   └── socket.handler.ts    # Socket.IO connection and event dispatching
│   ├── types/              # Domain interfaces, payloads, and typed socket events
│   ├── app.ts              # Express application setup
│   └── server.ts           # HTTP server bootstrap and Socket.IO initialization
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 2. Real-Time Service Dispatch Engine

- **Matching Formula**:
  - Distance: 30%
  - Skill Match: 30%
  - Provider Rating: 15%
  - Availability: 15%
  - Response Rate: 10%
- **25-Second Response Timer**:
  - Targeted provider receives an instant `provider:service_offer` event.
  - Automatically times out after 25s and dispatches to the next best candidate.
  - Expands radius (5 km → 10 km → 15 km) if no local provider is available.
- **Concurrency Rule**:
  - Thread-safe atomic lock prevents double-acceptance when multiple providers claim a job simultaneously.

---

## 3. Real-Time Socket Events

| Event Name | Direction | Description |
|---|---|---|
| `customer:service_request` | Client → Server | Customer creates a service inquiry |
| `provider:service_offer` | Server → Client | 25-second ticking offer sent to provider |
| `provider:accept_request` | Client → Server | Provider accepts the request |
| `provider:reject_request` | Client → Server | Provider rejects the request |
| `request:assigned` | Server → Client | Broadcasts successful assignment |
| `provider:location_update` | Server → Client | Live GPS coordinates stream to customer |
| `booking:status_update` | Server → Client | Stepper status updates |
| `booking:otp_generated` | Server → Client | 4-digit start OTP sent to customer |
| `booking:started` | Server → Client | Work marked in progress after valid OTP |
| `booking:completed` | Server → Client | Itemized invoice generated |

---

## 4. Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Generate Prisma client & migrate
npx prisma generate
npx prisma migrate dev --name init

# 4. Start development server
npm run dev
```
