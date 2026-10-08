# GharSaathi (घरसाथी) — "घर के हर काम का भरोसेमंद साथी"

> **Official Business Support Hotline:** 8435423190  
> **Brand Tagline:** घर के हर काम का भरोसेमंद साथी

Full-stack on-demand home services marketplace with real-time 25-second service request dispatch, role-based ID setup, OTP verification, and live provider GPS tracking.

---

## 1. Directory Structure

```text
gharsaathi/
├── package.json          # Root workspace configuration
├── README.md             # Project documentation & execution guide
├── server/               # Real-time backend API & Socket.IO service
│   ├── package.json      # Server dependencies (Express, Socket.IO, CORS)
│   └── src.js            # Main backend server (port 3000)
└── web/                  # React & Vite frontend application
    ├── package.json      # Web dependencies (React, Vite, Tailwind)
    ├── index.html        # HTML entry point
    └── src/
        ├── main.jsx      # Complete interactive React frontend
        └── style.css     # Tailwind & custom styling
```

---

## 2. Port & Roles Overview

- **Port 3000**: Backend server & API proxy.
- **Roles**:
  - **Customer (ग्राहक)**: Service catalog (AC, Electrician, Plumber, Cleaning, Carpentry), 25s radar dispatch, 4-digit start OTP card, itemized bill, UPI payment.
  - **Partner (कारीगर)**: Online/Offline status toggle, 25-second ticking dispatch alert, route stepper, customer OTP verification, wallet & earnings dashboard.
  - **Admin (प्रबंधन)**: Real-time dispatch monitor, active jobs, 20% commission metrics, and business hotline (**8435423190**).

---

## 3. How to Run

```bash
# 1. Install dependencies
cd gharsaathi
npm run install:all

# 2. Start the Backend Server (Express + Socket.IO)
npm run start
# Server listens on port 3000

# 3. Start the Web Frontend (Vite)
npm run dev:web
```

---

## 4. Test Demo Profiles

| Role | Mobile Number | Demo OTP | Name |
|---|---|---|---|
| **Customer** | `+91 98765 43210` | `1234` | Rahul Sharma (Sector 62, Noida) |
| **Partner** | `+91 98223 45678` | `1234` | Suresh Patel (AC Specialist) |
| **Admin** | `+91 8435423190` | `1234` | GharSaathi Super Admin |
