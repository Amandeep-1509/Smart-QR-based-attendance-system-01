# Smart QR-Based Attendance & Parent Email Notification System

**College-Level Java Mini Project**  
*A fast, simple, and practical attendance portal featuring continuous "Scan & Pass" QR recognition, manual backup attendance, and automated absentee notifications dispatched to both students and parents.*

---

## 📌 1. Project Introduction

Traditional roll-call attendance methods waste valuable lecture time and are vulnerable to proxy attendance. The **Smart QR-Based Attendance & Parent Email Notification System** transforms this process into a seamless **Scan & Pass** workflow:

1. **Student shows their personalized QR Code** to the camera.
2. **System automatically records attendance as PRESENT** along with the exact date and timestamp.
3. **No submit or confirmation button required**—the scanner immediately rearms for the next student.
4. **Duplicate Attendance Protection** prevents a student from being marked twice in the same class session.
5. **Automated Absentee Notification** detects all absent students at the conclusion of the session and automatically dispatches individual email alerts to **both the student and their parent**.
6. **No paid SMS gateways** (like MSG91 or Twilio) are needed; the project uses standard **Gmail SMTP via Spring Boot Mail** with an automatic **Demo Mode** fallback to guarantee zero crashes during presentations.

---

## 🚀 2. Key Modules & Features

### A. Admin / Teacher Authentication & Dashboard
- Simple session-based login for teachers and administrators.
- Real-time statistics: Total Students, Present Today, Absent Today, Attendance Percentage.
- Prominent quick-action buttons: `[ START QR ATTENDANCE ]` and `[ MANUAL ATTENDANCE ]`.
- Live activity feeds displaying recent scans and email notification dispatches.
- 7-day attendance trend bar chart powered by Chart.js.

### B. Student Management & QR Code Generation
- Register, edit, delete, search, and view students.
- Fields: Student ID, Roll No, Student Name, Class, Division, Student Email, Parent Name, Parent Email, Mobile No.
- Auto-generation of unique QR codes encoded with the Student ID using Google's ZXing library.
- Printable Smart ID Card view with embedded QR code.
- One-click PNG QR code download for each student.

### C. Continuous "Scan & Pass" QR Attendance (Core Module)
- Camera continuously scans video frames via `Html5Qrcode`.
- When a QR code is detected:
  - Synthesizes an audible chime using Web Audio API.
  - Asynchronously sends a background request to `/attendance/api/scan`.
  - Displays instant visual feedback: **Green** for Present, **Golden** for Already Marked, **Red** for Invalid.
  - Dynamically prepends the student into the live attendance list.
  - Automatically resets the camera after a brief cooldown—**no submit button needed**.
- Includes a desktop simulation input for testing without a webcam.

### D. Duplicate Attendance Protection
- Enforces duplicate protection at both the database level (unique composite constraint on `(student_id_fk, date, class_session)`) and the service layer.
- Repeated scans on the same day display `"Attendance Already Marked ✓"` with original timestamp without creating duplicate rows.

### E. Manual Attendance Backup
- For situations where a camera or student ID card is unavailable.
- Interactive roster with radio buttons for Present / Absent, "Select All Present" shortcut, and quick save.

### F. Dual Absence Email Notification (Students & Parents)
- Clicking `[ Attendance Completed -> Notify Absentees ]` automatically finds all absent students.
- Generates and dispatches two personalized emails per absent student:
  - **Student Email:** Notifies the student of their recorded absence.
  - **Parent Email:** Formally alerts the parent with their ward's name, roll number, class, and date.
- **Demo Mode:** If Gmail credentials are not configured, simulated emails are stored safely in the database with status `DEMO MODE` and can be inspected via an in-app preview modal.
- Prevents duplicate email dispatches for the same student on the same date/session.

### G. Attendance Reports & Printable PDF Export
- **Daily Report:** Filter by date to view breakdown of present/absent counts, percentage, and detailed logs.
- **Individual Student Report:** Select any student to view their lifetime attendance percentage and complete attendance history.
- **Clean Print / PDF View:** Formatted with college headers, metadata, student table, and signature blocks ready for browser `Ctrl+P` / "Save as PDF".

---

## 🛠 3. Technologies Used

| Component | Technology | Description |
|---|---|---|
| **Core Language** | Java (JDK 17 or higher) | Robust, strongly-typed backend logic |
| **Backend Framework** | Spring Boot 3.3.4 | MVC controllers, REST APIs, dependency injection |
| **Data Persistence** | Spring Data JPA / Hibernate | Entity mapping, queries, and transactions |
| **Database** | MySQL 8.0 *(with local H2 fallback)* | Persistent relational storage |
| **QR Generation** | Google ZXing 3.5.3 | High-resolution QR code rendering |
| **Email Service** | Spring Boot Starter Mail (`JavaMailSender`) | Gmail SMTP dispatcher with Demo Mode |
| **Frontend UI** | HTML5, CSS3, Vanilla JavaScript | Responsive warm brown/beige/golden academic theme |
| **Camera Engine** | Html5Qrcode 2.3.8 | Real-time continuous video frame QR decoder |
| **Data Visualization** | Chart.js | Visual 7-day attendance trends |

---

## 🎨 4. Website Theme & Color Palette

Designed specifically for academic environments with a warm, clean, and professional appearance:
- **Primary Colors:** Warm Brown (`#4A2E1B`), Beige (`#F5EFEB`), Golden (`#C59B27`)
- **Supporting Accents:** Cream (`#FAF6F0`), Dark Brown (`#2D1B0F`), Soft Green (`#2E7D32`), Soft Red (`#C62828`)
- **Navigation:** Persistent sidebar with college branding and user role indicator.

---

## 📁 5. Project Directory Structure

```
smart-qr-attendance/
├── pom.xml                                      # Maven build dependencies & plugins
├── database.sql                                 # Complete MySQL database creation script
├── README.md                                    # Documentation and setup guide
├── .gitignore                                   # Git ignore rules for build & temp files
├── .env.example                                 # Template for optional environment variables
├── run.bat                                      # One-click Windows startup script
├── mvnw / mvnw.cmd                              # Cross-platform Maven Wrapper scripts
├── .mvn/wrapper/                                # Maven wrapper configuration
├── .vscode/                                     # Visual Studio Code configuration
│   ├── launch.json                              # F5 Run/Debug configuration
│   ├── settings.json                            # Java workspace settings
│   └── extensions.json                          # Recommended VS Code extensions
├── src/main/java/com/college/smartattendance/
│   ├── SmartAttendanceApplication.java          # Spring Boot main application class
│   ├── config/
│   │   ├── AuthInterceptor.java                 # Login session protection interceptor
│   │   ├── DataSourceConfig.java                # Resilient MySQL connection + auto-fallback
│   │   ├── DataInitializer.java                 # Startup database seeder (admin + students)
│   │   └── WebConfig.java                       # Interceptor registration
│   ├── controller/
│   │   ├── LoginController.java                 # Teacher login/logout handling
│   │   ├── DashboardController.java             # Dashboard metrics, recent logs & charts
│   │   ├── StudentController.java               # CRUD, printable ID cards & QR downloads
│   │   ├── AttendanceController.java            # Scan & Pass REST API & manual backup
│   │   ├── NotificationController.java          # Absence email logs & simulated previews
│   │   └── ReportController.java                # Daily reports, student stats & PDF print
│   ├── model/
│   │   ├── User.java                            # Teacher/Admin credentials entity
│   │   ├── Student.java                         # Student & parent contact entity
│   │   ├── Attendance.java                      # Attendance entity with unique constraint
│   │   └── Notification.java                    # Email notification log entity
│   ├── repository/
│   │   ├── UserRepository.java                  # JPA repository for user lookup
│   │   ├── StudentRepository.java               # JPA repository with search & filters
│   │   ├── AttendanceRepository.java            # JPA repository for duplicate checks & counts
│   │   └── NotificationRepository.java          # JPA repository for notification logs
│   └── service/
│       ├── QRCodeService.java                   # Google ZXing QR generator (PNG & Base64)
│       ├── StudentService.java                  # Student management & ID generation
│       ├── AttendanceService.java               # Core Scan & Pass logic & duplicate check
│       ├── EmailService.java                    # JavaMailSender + DEMO MODE simulation
│       └── ReportService.java                   # Analytics, daily summaries & trend charting
└── src/main/resources/
    ├── application.properties                   # MySQL, Gmail SMTP & server configurations
    ├── static/
    │   ├── css/style.css                        # Warm Brown, Beige, Golden CSS theme
    │   └── js/qr-scanner.js                     # Continuous camera scanner & audio chime
    └── templates/
        ├── fragments.html                       # Reusable sidebar & top navigation bar
        ├── login.html                           # Modern login page with demo credentials
        ├── dashboard.html                       # Metrics cards, actions, recent tables, Chart.js
        ├── students.html                        # Student directory, search & QR actions
        ├── student-form.html                    # Add / Edit student registration form
        ├── student-card.html                    # Printable student identity card with QR code
        ├── qr-scanner.html                      # Scan & Pass continuous camera UI
        ├── manual-attendance.html               # Manual attendance backup roster
        ├── notifications.html                   # Email notification log & preview modal
        ├── reports.html                         # Daily & individual attendance analytics
        └── report-print.html                    # Clean printable / PDF attendance sheet
```

---

## 💻 6. Software Requirements

Before running the project on your machine, ensure you have:
1. **Java Development Kit (JDK):** Version 17 or higher (Java 17, 21, or 22). Verify with:
   ```bash
   java -version
   ```
2. **Visual Studio Code:** Download from [code.visualstudio.com](https://code.visualstudio.com/).
3. **VS Code Extensions:**
   - **Extension Pack for Java** (by Microsoft)
   - **Spring Boot Extension Pack** (by VMware)
4. **MySQL Server (Optional):** Via XAMPP, WAMP, Docker, or standalone MySQL 8.0.
   *(Note: If MySQL is not installed or offline, the app automatically runs using an embedded local database so you can test immediately without any setup).*

---

## 🗄 7. Database Setup Instructions (MySQL)

### Option A: Using XAMPP / phpMyAdmin
1. Start Apache and MySQL from the XAMPP Control Panel.
2. Open phpMyAdmin (`http://localhost/phpmyadmin`).
3. Click the **Import** tab.
4. Select the `database.sql` file located in the project root folder.
5. Click **Go** / **Import**.

### Option B: Using MySQL Command Line / MySQL Workbench
```bash
mysql -u root -p < database.sql
```

### Option C: Automatic Hibernate DDL Generation
If you don't run the SQL script, Spring Boot's Hibernate will automatically create the tables and seed default admin credentials and sample students upon first boot!

---

## 📧 8. Email SMTP Configuration

The application includes an intelligent **Demo Mode** fallback:
- **When SMTP credentials are missing:** The project logs simulated email previews to the console and database with status `DEMO MODE`—it will **never crash** during presentations or vivas.
- **To send real emails via Gmail SMTP:**
  1. Go to your **Google Account -> Security**.
  2. Enable **2-Step Verification**.
  3. Search for **App Passwords** and generate a 16-character password for "Attendance App".
  4. Set environment variables (recommended; do not put the password in source code):
     - `MAIL_USERNAME=amandeep.cse.armiet@gmail.com`
     - `MAIL_PASSWORD=<your new 16-character Google App Password>`
     - `MAIL_SENDER_NAME=Smart QR Based Attendance System`
  5. On Render, open your web service → **Environment** → **Add Environment Variable** and add the same three variables, then save and redeploy.
  6. In the app, open **Admin → Email Settings** and click **Test Email**. If a database email setting already exists, clear its old password or update it in the admin page; environment credentials are used when the stored password is blank.

**Security:** never commit your app password or include it in a ZIP. The app reads `MAIL_PASSWORD` from the environment and does not copy that fallback secret into the database. If you have already shared a real app password in chat, revoke it in Google Account and generate a new one before deployment.

---

## 🚀 9. Steps to Run the Application

### Method 1: Running Directly in Visual Studio Code (Recommended)
1. Extract `Smart_QR_Attendance_Project.zip`.
2. Open VS Code.
3. Click **File -> Open Folder...** and select the extracted `smart-qr-attendance` folder.
4. When prompted to install recommended extensions, click **Install All** (Extension Pack for Java).
5. Open `src/main/java/com/college/smartattendance/SmartAttendanceApplication.java`.
6. Click the **Run** button above the `main` method (or press `F5` / select **Run Smart Attendance** from the Run & Debug tab).
7. Wait 5-10 seconds for Spring Boot to start.
8. Open your browser at:
   ```
   http://localhost:8080
   ```

### Method 2: Running via Terminal / Command Prompt
Open a terminal inside the project root folder:

- **Windows:**
  ```cmd
  run.bat
  ```
  *(or using the included Maven Wrapper:)*
  ```cmd
  mvnw.cmd spring-boot:run
  ```

- **Linux / macOS:**
  ```bash
  chmod +x mvnw
  ./mvnw spring-boot:run
  ```

---

## 🔑 10. Default Login Credentials

A default teacher account is automatically pre-seeded in the database:
- **Login URL:** `http://localhost:8080/login`
- **Username:** `admin`
- **Password:** `admin123`
- **Teacher Name:** Prof. Rajesh Sharma
- **Role:** TEACHER

---

## ❓ 11. Common Errors & Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **Port 8080 is already in use** | Another application (or previous run) is occupying port 8080. | Stop the conflicting process or change `server.port=8081` in `application.properties`. |
| **MySQL connection refused** | MySQL server is stopped or port 3306 is blocked. | The app automatically falls back to local storage without crashing. To use MySQL, start MySQL from XAMPP or verify your `DB_PASSWORD`. |
| **Camera not opening in QR Scanner** | Browser permission denied or HTTP restriction. | Allow camera access in your browser address bar. If accessing over a local network IP, test on `http://localhost:8080` (browsers require HTTPS or localhost for camera access). You can also use the built-in PC demo simulator input. |
| **Email fails to send (Authentication failed)** | Using normal Gmail account password instead of App Password. | Google requires a 16-character **App Password** created under 2-Step Verification, not your standard Gmail login password. Leave blank to stay in Demo Mode. |
| **Java compilation error in VS Code** | JDK 17+ is not configured in VS Code. | Install the *Extension Pack for Java* and point VS Code to a JDK 17 or higher installation via `Java: Configure Java Runtime`. |

---

## 📄 12. License & Academic Attribution
This project was developed for academic mini-project demonstration and college submission purposes. You are welcome to modify and extend it for learning and portfolio presentations.
