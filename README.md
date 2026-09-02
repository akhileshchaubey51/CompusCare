# CampusCare: Smart Civic Problem Reporting System

CampusCare is a centralized civic problem reporting and maintenance management platform developed for KIET Group of Institutions. It enables students to report location-verified campus issues with photo evidence, while allowing campus maintenance authorities to monitor, assign, update, and resolve issues in real time.

---

## Complete Project Setup & Installation Guide

Follow these sequential steps to clone, arrange, and configure the project on your machine.

### 1. Clone or Download the Project

Open your terminal or Command Prompt and run:

git clone https://github.com/<your-username>/CampusCare.git
cd CampusCare

(Agar ZIP file download ki hai, toh use extract karein aur folder ka naam CampusCare rakhein).

---

### 2. Verify Folder Structure

Ensure your files and directories match this hierarchy:

CampusCare/
├── backend/
│   ├── app.py                      # Flask REST API server and database controllers
│   └── uploads/
│       ├── complaints/             # Stored complaint proof photographs
│       └── profiles/               # Stored student profile images
├── frontend/
│   ├── index.html                  # Main landing page
│   ├── style.css                   # Landing page styling
│   ├── script.js                   # Landing page logic
│   ├── login.html                  # Student sign-in portal
│   ├── dashboard.html              # Student complaint status dashboard
│   ├── complaint-form.html         # Geo-tagged complaint submission form
│   ├── complaint-form.css          # Form styling
│   ├── complaint-form.js           # Live GPS & 2 KM radius check
│   ├── admin-login.html            # Admin login interface
│   ├── admin-login.css             # Admin login styles
│   ├── admin-login.js              # Admin authentication handler
│   ├── admin-dashboard.html        # Central complaint tracking console
│   ├── admin-dashboard.css         # Admin table and modal styling
│   ├── admin-dashboard.js          # Admin grievance update controllers
│   ├── admin.html                  # Student registration portal
│   ├── admin.css                   # Registration portal styles
│   └── admin.js                    # Student insertion logic
└── README.md

---

### 3. Install Required Dependencies

Ensure Python 3.8+ and ODBC Driver 17 for SQL Server are installed, then execute:

pip install flask flask-cors pyodbc werkzeug

---

### 4. Database Setup (SQL Server)

Manual SQL queries run karne ki zaroorat nahi hai. Seedhe database script file ko import karein: 

database.sql

1. SQL Server Management Studio (SSMS) open karke connect karein.
2. File menu me jayein: File -> Open -> File... (ya keyboard shortcut Ctrl + O dabayein).
3. Apne project ke backend folder se "database.sql" file select karke open karein.
4. Top toolbar me "Execute" (Green Arrow) button par click karein ya keyboard par "F5" dabayein.
5. "CampusCare" database saare tables (admins, complaints, students) aur pre-loaded records ke sath restore ho jayega.

---

### 5. Running the System (Dual-Terminal Execution)

Run backend and frontend concurrently in two separate terminal windows:

#### Terminal 1: Backend Server
cd CampusCare\backend
python app.py

API server runs on http://127.0.0.1:5000 (and http://192.168.1.8:5000).

#### Terminal 2: Frontend Server
cd CampusCare\frontend
python -m http.server 8000

Web interface serves on http://127.0.0.1:8000.

---

## Authentication & Default Demo Credentials

### 1. Admin Portal (admin-login.html)
- Portal Link: http://127.0.0.1:8000/admin-login.html
- Admin ID: admin@kiet.edu
- Password: admin123

### 2. Student Portal (login.html)
- Portal Link: http://127.0.0.1:8000/login.html
- Demo Account:
  - KIET ID: student@kiet.edu
  - Password: kiet@123

---

## Browser Location Settings (For Non-Localhost / IP Access)

If testing from a mobile phone or local network IP (http://192.168.1.8:8000):
1. Open Chrome/Edge and go to:
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
2. Set to Enabled.
3. Add:
   http://192.168.1.8:8000,http://192.168.1.8:5000
4. Click Relaunch.