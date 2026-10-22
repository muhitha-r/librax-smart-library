# 📚 Librax – Smart Library Management System

An automated, full-stack institutional library management platform engineered to streamline book cataloging, circulation operations, patron access, and inventory lifecycle workflows.

Built on the **MERN Stack** (MongoDB Atlas, Express.js, React with Vite, Node.js) styled with Tailwind CSS using an **Academic Forest & Warm Sand** theme.

---

## 🌟 Key Modules & Capabilities

- **🔐 Role-Based Access Control (RBAC):**
  - **Admin:** Comprehensive system analytics, user management, and librarian/staff onboarding.
  - **Librarian:** Circulation desk management, physical stock auditing, return processing, and catalog curation.
  - **Staff:** Catalog exploration, advanced hold reservations, personal borrowing history, and **full overdue fine exemption (₹0 penalty)**.
  - **Student:** Live catalog search, self-service loan tracking, FIFO reservations, and automated overdue penalty assessment (₹5 per day).

- **📖 Dynamic Catalog & Branch Curation:**
  - Fast search by title, author, subject category, and ISBN.
  - Specialized curation across engineering departments (CSE, ECE, EEE, Civil, Mechanical) and foundational disciplines (Mathematics, Physics, Chemistry, Aptitude, Literature).
  - Real-time stock decrement and atomic validation to eliminate negative inventory counters.

- **⏳ First-In-First-Out (FIFO) Reservation Engine:**
  - Automated waitlisting when zero copies remain in circulation.
  - Immediate hold allocation to the earliest applicant upon book check-in.

- **🔔 Automated Alerts & Scheduled Jobs:**
  - In-app activity stream for instant checkout and return notifications.
  - Scheduled background routines (`node-cron`) running daily to remind users 24 hours prior to loan expiration.

---

## 🛠️ Technology Stack

| Layer | Tools & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router DOM |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt.js, Node-Cron |
| **Database** | MongoDB Atlas (Cloud NoSQL), Mongoose ODM |
| **Version Control** | Git, GitHub |
