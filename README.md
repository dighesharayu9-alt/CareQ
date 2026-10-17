# CareQ — Smart Hospital Patient Queue Management System

**CareQ** is a digital platform that helps hospitals and clinics manage patient queues dynamically, reduce uncertainty around waiting times, coordinate doctors and receptionists, handle emergency-related queue disruptions transparently, and provide real-time information to patients.

---

## 🏥 Product Vision & Core Innovation: Dynamic Queue Management

Hospital waiting queues are rarely static because:
- Consultations vary in clinical complexity.
- Doctors report operational delays or get called to emergency wards.
- Clinical staff prioritize urgent medical emergencies.
- Patients cancel appointments, miss slots, or arrive as walk-ins.
- Departments experience sudden surges in patient load.

### Transparent Dynamic Waiting-Time Formula
Rather than multiplying token sequence numbers by an arbitrary constant, CareQ's dynamic recalculation engine computes:
$$\text{Estimated Wait} \approx \text{Remaining Active Consultation} + (\text{Patients Ahead} \times \text{Average Duration}) + \text{Doctor Delays}$$

- **Active Consultation Tracking**: Computes remaining time based on elapsed minutes and department averages.
- **Emergency Impact Preview**: Calculates the exact waiting-time delta ($+15$ min, $+30$ min) on every waiting patient *before* authorized clinical confirmation.
- **Real-Time Push Synchronization**: Broadcasts immediate updates across patient devices, doctor stations, reception desks, and waiting room TV monitors via **Socket.IO**.
- **Clinical Priority Disclaimer**: Qualified healthcare professionals make all medical triage decisions; CareQ manages the operational consequences of those decisions.

---

## 🎨 Visual Identity & Design System

- **Primary Blue**: `#4169E1` (Royal Blue)
- **Dark Navy**: `#172554`
- **Soft Lavender**: `#F3F0FF`
- **Light Blue**: `#EFF6FF`
- **Main Background**: `#F8FAFC`
- **Main Text**: `#1E293B` | **Secondary Text**: `#64748B`
- **Status Badges**:
  - `Waiting`: Amber badge (`#F59E0B`)
  - `Called`: Blue pulsing badge (`#3B82F6`)
  - `In Consultation`: Violet badge (`#8B5CF6`)
  - `Completed`: Emerald badge (`#16A34A`)
  - `No-Show`: Slate badge (`#6B7280`)
  - `Cancelled`: Rose badge (`#DC2626`)
  - `Emergency Priority`: Red pulsing badge (`#DC2626`)
- **Typography**: Inter (Google Fonts) with accessible contrast, large touch targets, and rounded card hierarchy.

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (Tailwind v3.4), Vanilla CSS utilities
- **Icons**: Lucide React
- **Charts & Visualizations**: Recharts (Bar charts, Line flow, Doughnut charts)
- **Routing**: React Router v6
- **Real-Time**: Socket.IO Client

### Backend
- **Runtime**: Node.js (v24), Express, TypeScript (`tsx`)
- **Database ORM**: Prisma ORM
- **Database Engine**:
  - **Local Zero-Config Development**: SQLite (`file:./dev.db`) — runs out of the box with zero external daemon requirements.
  - **Production / Docker**: PostgreSQL (`schema.pg.prisma` with `docker-compose.yml`).
- **Authentication**: JWT, bcryptjs, HTTP-only secure cookie support, Role-Based Access Control (RBAC).
- **Validation**: Zod schema validation.
- **Real-Time Engine**: Socket.IO Server with department and doctor room routing.
- **Testing**: Vitest, Supertest, React Testing Library.

---

## 🔑 Demo Accounts & Pre-Seeded Test Data

The application comes pre-seeded with realistic hospital departments (**Cardiology**, **Orthopedics**, **Ear, Nose & Throat**, **General Medicine**), live queue standings, and demo staff accounts.

All demo accounts share the standard development password:
> **`CareQ@2025`**

| Role | Email | Password | Primary Workflow / Screen |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@careq.demo` | `CareQ@2025` | Ramesh Kumar (Token `CARD-015`, Position #1, Est. Wait ~18m) |
| **Doctor** | `doctor@careq.demo` | `CareQ@2025` | Dr. Rajesh Sharma, MD (Cardiology OPD 101, Call Next, Delays) |
| **Receptionist** | `reception@careq.demo` | `CareQ@2025` | Sarah Jenkins (Emergency Impact Preview, Walk-ins, Reassign) |
| **Administrator** | `admin@careq.demo` | `CareQ@2025` | Hospital KPIs, Recharts Analytics, Audit Trail, Departments |

*Quick Switcher*: The application header includes a **Demo Accounts** dropdown that logs you into any of these four roles with a single click.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)

### 2. Clone and Setup
```bash
# Clone the repository
git clone <repo-url>
cd CareQ

# Install root, backend, and frontend dependencies
npm --prefix backend install
npm --prefix frontend install
```

### 3. Initialize Database & Seed Demo Data
```bash
# Automatically creates the database schema, generates Prisma Client, and seeds sample hospital data
npm run seed
```

### 4. Run the Development Servers
In two separate terminal tabs:

**Tab 1 — Backend Server (Port 5000):**
```bash
npm run dev:backend
# Server runs at http://localhost:5000
# Healthcheck: http://localhost:5000/health
```

**Tab 2 — Frontend App (Port 5173):**
```bash
npm run dev:frontend
# Vite dev server runs at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🗄️ Database Configuration (SQLite & PostgreSQL)

CareQ supports dual database workflows:

### Default: Zero-Config Local Development (SQLite)
No installation of PostgreSQL or Docker is required. The default `.env` uses `file:./dev.db`.
```env
DATABASE_URL="file:./dev.db"
```

### Production / Containerized Deployment (PostgreSQL)
1. Launch PostgreSQL container:
   ```bash
   docker compose up -d
   ```
2. In `backend/.env`, set:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/careq?schema=public"
   ```
3. Switch the Prisma schema to PostgreSQL and push:
   ```bash
   npm --prefix backend run db:postgres
   npx --prefix backend prisma db push
   npm run seed
   ```

---

## 🧪 Running Automated Tests

### Backend Integration & Queue Engine Tests
Tests verify authentication, duplicate email rejection, role authorization, appointment booking, token generation, Emergency Impact Preview calculations, doctor delays, and analytics:
```bash
npm --prefix backend test
# or
npm run test:backend
```

### Frontend Component Tests
```bash
npm --prefix frontend test
# or
npm run test:frontend
```

---

## 📱 Application Pages & Routes

1. **Landing Page** (`/`):
   - Hero section with live software mockup (Waiting Now: 12, In Consultation: 3, Completed: 28, Avg Wait: 28m).
   - "Five steps. Zero confusion." interactive 5-step autoplay slider with prominent Step 3 (Live Queue Tracking).
2. **Login Page** (`/login`): 1-click demo accounts + standard credentials.
3. **Patient Registration** (`/register`): Public registration strictly creates `PATIENT` accounts.
4. **Forgot Password** (`/forgot-password`): Development-safe reset instructions.
5. **Patient Booking** (`/book`): Department, doctor, and slot selection with instant token generation.
6. **Token Confirmation** (`/token/:token`): Printable digital pass with barcode mockup, real-time wait times, and room details.
7. **Public Live Queue Display** (`/live-queue` & `/live-queue/:deptId`): Large-screen waiting room TV display with "Now Serving", "Next Tokens", and live Socket.IO ticker.
8. **Senior Citizen Easy View** (`/senior-view`): Simplified high-contrast view with extra-large token badges and a 1-tap "Call Hospital Assistance" nurse alert button.
9. **Patient Dashboard** (`/patient/dashboard`): Active token card, wait estimate, patients ahead, and consultation history.
10. **Doctor Dashboard** (`/doctor/dashboard`): Today's queue, "Call Next Patient", start/complete consultation modal, and delay reporting.
11. **Receptionist Dashboard** (`/reception/dashboard`): Walk-in registration, Emergency Impact Preview modal, doctor reassignment, and queue transfers.
12. **Admin Dashboard** (`/admin/dashboard`): Hospital KPIs, Recharts visualizations (Peak hours, Delay causes, Workload), department CRUD, and system audit logs.
13. **Notifications Center** (`/notifications`): Push alert history with read tracking.
14. **Patient Profile** (`/profile`): Contact, address, blood group, and emergency contact details.

---

## 🔒 Security Architecture

- **Password Hashing**: Salted bcrypt password hashing with 10 rounds.
- **JWT Authentication**: Signed session tokens verified via middleware.
- **Role-Based Access Control**: Strict backend endpoint enforcement (`authorize(['ADMIN', 'RECEPTIONIST'])`).
- **Database Transactions**: Concurrency-safe queue actions and emergency insertions execute within atomic `prisma.$transaction()` blocks.
- **Audit Logging**: Every consequential operational event (`CALL_PATIENT`, `EMERGENCY_OVERRIDE`, `REPORT_DELAY`, `REASSIGN_DOCTOR`) is recorded with staff IDs, timestamps, and metadata.
- **Input Validation**: Strict Zod schema parsing on all request bodies.

---

## 📄 License
CareQ is licensed under the MIT License.
