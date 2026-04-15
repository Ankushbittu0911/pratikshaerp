# Pratiksha Technologies ERP System

A complete production-ready ERP system built for industrial panel manufacturing workflow.

## Tech Stack

**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT · bcryptjs · Multer  
**Frontend:** React (Vite) · Tailwind CSS · Axios · React Router

---

## Quick Start

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm install
node seed.js          # Creates all 6 demo users
npm run dev           # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev           # Starts on http://localhost:5173
```

---

## Demo Login Credentials

| Role               | Email                        | Password   |
|--------------------|------------------------------|------------|
| SUPER_ADMIN        | superadmin@pratiksha.com     | Admin@123  |
| SALES_ADMIN        | sales@pratiksha.com          | Admin@123  |
| QUOTATION_ADMIN    | quotation@pratiksha.com      | Admin@123  |
| PURCHASE_ADMIN     | purchase@pratiksha.com       | Admin@123  |
| FABRICATION_ADMIN  | fabrication@pratiksha.com    | Admin@123  |
| ELECTRICAL_ADMIN   | electrical@pratiksha.com     | Admin@123  |

---

## Business Workflow

```
Enquiry Received
    ↓
Quotation Created (PDF uploaded)
    ↓
Sales reviews → APPROVED / REJECTED
    ↓ (if APPROVED)
BOM + Drawings uploaded
    ↓
Purchase Order Created → Super Admin Approval
    ↓
Material Tracking → All Received → READY_FOR_PRODUCTION
    ↓
Production Job Created
    ↓ ┌─────────────────────────────────────┐
       │  FABRICATION  →  POWDER COATING    │
       │      ↓               ↓             │
       │   (parallel)   COMPLETED →         │
       │                 Electrical READY   │
       │                      ↓             │
       │                 ELECTRICAL         │
       └─────────────────────────────────────┘
    ↓ (Fabrication COMPLETED + Electrical READY_FOR_DISPATCH)
DISPATCH
```

## Role-Based Access

| Module              | SUPER | SALES | QUOTATION | PURCHASE | FABRICATION | ELECTRICAL |
|---------------------|-------|-------|-----------|----------|-------------|------------|
| Enquiries           | ✓     | ✓     | view      | –        | –           | –          |
| Quotations          | ✓     | ✓     | ✓         | –        | –           | –          |
| Purchase Orders     | ✓     | –     | –         | ✓        | –           | –          |
| Materials           | ✓     | –     | –         | ✓        | –           | –          |
| Production          | ✓     | –     | –         | create   | ✓           | ✓          |
| Material Requests   | ✓     | –     | –         | approve  | ✓           | ✓          |
| Reports             | ✓     | –     | –         | –        | –           | –          |
| Users               | ✓     | –     | –         | –        | –           | –          |

> **Critical Rule:** Fabrication and Electrical admins **never** see price/quotation value data.

## Project Structure

```
pratiksha-erp/
├── backend/
│   ├── config/          # DB connection, Multer setup
│   ├── controllers/     # Business logic
│   ├── middleware/       # Auth, RBAC
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── utils/           # Notification helpers
│   ├── uploads/         # File storage (auto-created)
│   ├── seed.js          # Demo user seeder
│   └── server.js        # Entry point
│
├── frontend/
│   └── src/
│       ├── api/         # Axios API layer
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth context
│       ├── pages/       # All page components
│       └── utils/       # Helper functions
│
├── .env.example
└── README.md
```

## API Endpoints Summary

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/enquiries
POST   /api/enquiries
GET    /api/enquiries/:id
PUT    /api/enquiries/:id

GET    /api/quotations
POST   /api/quotations
PUT    /api/quotations/:id/admin-status
PUT    /api/quotations/:id/sales-status
POST   /api/quotations/:id/upload-files

GET    /api/purchase-orders
POST   /api/purchase-orders
PUT    /api/purchase-orders/:id/approve
PUT    /api/purchase-orders/:id/material-tracking

GET    /api/materials
POST   /api/materials
POST   /api/materials/bulk-upload
GET    /api/materials/template

GET    /api/production
POST   /api/production
PUT    /api/production/:id/fabrication-status
PUT    /api/production/:id/powder-coating-status
PUT    /api/production/:id/electrical-status
POST   /api/production/:id/work-logs

GET    /api/material-requests
POST   /api/material-requests
PUT    /api/material-requests/:id/status

GET    /api/notifications
PUT    /api/notifications/mark-all-read

GET    /api/reports/dashboard
GET    /api/reports/enquiry
GET    /api/reports/quotation
GET    /api/reports/purchase
GET    /api/reports/material
GET    /api/reports/production

GET    /api/users
POST   /api/users
PUT    /api/users/:id
```
