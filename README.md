# Smart QR-Based Attendance & Parent Email Notification System

A fast, simple, and practical attendance portal featuring continuous "Scan & Pass" QR recognition, manual backup attendance, analytics reports, printable student smart ID cards, and automated absentee notifications dispatched to both students and parents.

---

## 📌 1. Project Overview

- **Runtime**: Web (Node.js 22)
- **Framework**: React 18 SPA + Vite
- **Theme**: Warm Light Brown, Cream, and Golden Academic Palette
- **Audio**: Web Audio API synthesized dual-tone chimes for instant acoustic feedback
- **QR Generation & Scanning**: High-resolution client-side QR generation and continuous camera decoding via `html5-qrcode` with PC Viva/Demo simulation mode

---

## 🚀 2. Key Modules & Features

### A. Admin & Teacher Authentication & Dashboard
- Authentication for Admin (`admin` / `admin123`) and Teacher (`teacher` / `teacher123`) with quick demo-fill buttons.
- Real-time statistics: Total Students, Present Today, Absent Today, Attendance Percentage.
- Prominent quick-action buttons: `[ START QR ATTENDANCE ]` and `[ MANUAL ATTENDANCE ]`.
- Live activity feeds displaying recent scans and email notification dispatches.
- 7-day attendance trend bar chart.

### B. Student Management & Smart ID Cards
- Register, edit, delete, search, and view students.
- Fields: Student ID, Roll No, Student Name, Class, Division, Student Email, Parent Name, Parent Email, Mobile No.
- Auto-generation of unique QR codes encoded with the Student ID.
- Printable Smart ID Card view with embedded QR code.
- One-click PNG QR code download for each student.

### C. Continuous "Scan & Pass" QR Attendance (Core Module)
- Camera continuously scans video frames via `Html5Qrcode`.
- When a QR code is detected:
  - Synthesizes an audible chime using Web Audio API.
  - Automatically records attendance as PRESENT along with the date and timestamp.
  - Displays instant visual feedback: **Green** for Present, **Golden** for Already Marked, **Red** for Invalid.
  - Dynamically prepends the student into the live attendance list.
  - Automatically resets the camera after a brief cooldown—**no submit button needed**.
- Includes a desktop/PC Viva simulation input for testing without a webcam.

### D. Duplicate Attendance Protection
- Enforces duplicate protection on `(student_id, date, class_session)`.
- Repeated scans on the same day display `"Attendance Already Marked ✓"` with original timestamp without creating duplicate rows.

### E. Manual Attendance Backup
- Interactive roster with radio buttons for Present / Absent, "Select All Present" and "Select All Absent" shortcuts, and quick save.

### F. Dual Absence Email Notification (Students & Parents)
- Clicking `[ Attendance Completed -> Notify Absentees ]` automatically finds all absent students.
- Generates and dispatches two personalized emails per absent student:
  - **Student Email:** Notifies the student of their recorded absence.
  - **Parent Email:** Formally alerts the parent with their ward's name, roll number, class, and date.
- **Demo Mode:** If Gmail credentials are not configured, simulated emails are stored safely in the database with status `DEMO MODE` and can be inspected via an in-app preview modal.

### G. Attendance Reports & Printable PDF Export
- **Daily Report:** Filter by date to view breakdown of present/absent counts, percentage, and detailed logs.
- **Individual Student Report:** Select any student to view their lifetime attendance percentage and complete attendance history.
- **Clean Print / PDF View:** Formatted with college headers, metadata, student table, and signature blocks ready for browser `Ctrl+P` / "Save as PDF".

### H. Admin Email Settings & Template Customization
- Dynamic sender configuration with connection status indicator and connection test tool.
- 4 customizable email templates (`STUDENT_ABSENCE`, `PARENT_ABSENCE`, `TEACHER_ABSENCE`, `TEACHER_ATTENDANCE`) with dynamic placeholder insertion and live preview.
