# 🚗 ParkIt — Smart Parking Management System

**ParkIt** is a full-stack automated parking management platform built to solve urban parking challenges. It allows drivers to reserve premium parking spots in real-time, provides automated QR-code access passes, and offers property owners a comprehensive dashboard to track revenue and slot occupancy.

This project was built as a 6th-semester college project, featuring a complete role-based architecture, real-time WebSocket synchronization, and secure payment processing.

---

## 🌟 Key Features

*   **👨‍✈️ Driver Portal:**
    *   Search for parking lots by city/location.
    *   Interactive, real-time slot selection grid.
    *   Secure Razorpay checkout integration.
    *   Automated QR-Code access pass generation.
*   **🏢 Property Owner Portal:**
    *   Interactive Recharts dashboard tracking 7-day revenue and occupancy rates.
    *   1-click onboarding to submit new parking properties to the network.
    *   Automated scaffold of 20 standardized parking slots upon property creation.
*   **👑 Admin Superuser Panel:**
    *   Global platform metrics (Total Revenue, Total Users, Total Properties).
    *   Property submission verification (Approve/Reject workflows).
    *   Complete member directory auditing.
*   **⚡ Real-Time Engine:**
    *   Socket.io integration ensures that when a slot is booked or canceled, the grid updates instantly for all connected users without refreshing.

---

## 💻 Tech Stack

### Frontend
*   **Framework:** React 19 + Vite
*   **Styling:** Tailwind CSS v4 (Glassmorphism & Dark Mode)
*   **Icons:** Lucide React
*   **Charting:** Recharts
*   **Routing:** React Router v7

### Backend
*   **Runtime:** Node.js + Express
*   **Language:** TypeScript
*   **Database:** TiDB Serverless (MySQL compatible)
*   **ORM:** Sequelize
*   **Authentication:** JWT (JSON Web Tokens) & bcryptjs
*   **Real-time:** Socket.io
*   **Payments:** Razorpay

---

## 🚀 Running the Project Locally

### Prerequisites
*   Node.js installed on your machine.
*   A TiDB Serverless cluster (or any MySQL database).
*   Razorpay test API keys.

### 1. Database Setup
Ensure you have your TiDB connection string ready.

### 2. Backend Setup
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` folder with the following variables:
   ```env
   PORT=5001
   DATABASE_URL="mysql://<user>:<password>@<host>:4000/<database>?ssl={"rejectUnauthorized":true}"
   JWT_SECRET="your_super_secret_key"
   RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   ```
4. Start the backend development server (this will automatically sync models and seed demo data):
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a second terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` folder with the following variables:
   ```env
   VITE_API_URL="http://localhost:5001/api"
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 4. Demo Accounts
You can immediately test the platform using the auto-seeded demo accounts:
*   **Driver:** `driver@demo.com` / `demo123`
*   **Owner:** `owner@demo.com` / `demo123`
*   **Admin:** `admin@demo.com` / `demo123`

---

## 🌐 Deployment
This application is configured for easy deployment on free-tier cloud services:
*   **Backend:** Configured for Render via `render.yaml`.
*   **Frontend:** Configured for Vercel via `vercel.json`.
*   **Database:** Hosted on AWS TiDB Serverless.
