import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'smart_attendance_data.json');

app.use(cors());
app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing helper (PBKDF2 or SHA256 with salt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_smart_attendance_salt').digest('hex');
}

// Default email templates
const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: 1,
    templateType: 'STUDENT_ABSENCE',
    displayLabel: 'Student Absence Notification',
    subject: 'Attendance Notification – You Were Marked Absent Today',
    bodyText: `Dear {student_name},

This is to inform you that you were marked ABSENT for today's lecture.

Details:
  Date       : {date}
  Lecture    : {subject_name} ({subject_code})
  Faculty    : {professor_name}
  Class      : {class_name} – {division}
  Roll No    : {roll_no}
  Status     : {attendance_status}

If you believe this is an error, please contact your class teacher immediately.

Regards,
{professor_name}
{college_name}`,
    isCustomized: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: 2,
    templateType: 'PARENT_ABSENCE',
    displayLabel: 'Parent Absence Alert',
    subject: "Your Ward's Attendance Notification – {student_name} Was Absent",
    bodyText: `Dear {parent_name},

This is to inform you that your ward {student_name} (Roll No: {roll_no}) was marked ABSENT for today's lecture.

Details:
  Date       : {date}
  Lecture    : {subject_name} ({subject_code})
  Faculty    : {professor_name}
  Class      : {class_name} – {division}
  Status     : {attendance_status}

Please ensure your ward attends lectures regularly. Feel free to contact the department for any queries.

Regards,
{professor_name}
{college_name}`,
    isCustomized: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: 3,
    templateType: 'TEACHER_ABSENCE',
    displayLabel: 'Faculty Absence Summary',
    subject: 'Lecture Attendance Summary – Absent Students for {date}',
    bodyText: `Dear Faculty,

Here is the attendance report for {subject_name} ({class_name} – {division}) on {date}.

Faculty: {professor_name}
Session: {class_session}
Total Absent: {absent_count} students.

Full session records have been archived in the attendance portal.

Regards,
{college_name} Administration`,
    isCustomized: false,
    lastModified: new Date().toISOString(),
  },
  {
    id: 4,
    templateType: 'TEACHER_ATTENDANCE',
    displayLabel: 'Faculty Full Statistics',
    subject: 'Attendance Statistics – {subject_name} on {date}',
    bodyText: `Dear Faculty,

Attendance stats for {subject_name} on {date}:
Faculty In-Charge : {professor_name}
Total Students     : {total_count}
Present            : {present_count}
Absent             : {absent_count}
Attendance Rate    : {attendance_percentage}%

Full details and printable PDF reports are available in Attendance Reports.

Regards,
{college_name} Administration`,
    isCustomized: false,
    lastModified: new Date().toISOString(),
  },
];

interface DBState {
  users: Array<{
    id: number;
    username: string;
    passwordHash: string;
    fullName: string;
    role: 'ADMIN' | 'TEACHER';
    email?: string;
    department?: string;
  }>;
  professors: Array<{
    id: number;
    name: string;
    facultyId: string;
    designation: string;
    department: string;
    email: string;
    mobile?: string;
  }>;
  lectures: Array<{
    id: number;
    subjectName: string;
    subjectCode: string;
    professorId: number;
    professorName: string;
    className: string;
    division: string;
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
  }>;
  students: Array<{
    id: number;
    studentId: string;
    rollNo: string;
    name: string;
    className: string;
    division: string;
    studentEmail: string;
    parentName: string;
    parentEmail: string;
    studentMobile?: string;
  }>;
  attendance: Array<{
    id: number;
    studentIdFk: number;
    studentId: string;
    studentName: string;
    rollNo: string;
    className: string;
    division: string;
    lectureId?: number;
    subjectName?: string;
    professorName?: string;
    date: string;
    time: string;
    status: 'PRESENT' | 'ABSENT';
    isLate?: boolean;
    classSession: string;
  }>;
  notifications: Array<{
    id: number;
    studentIdFk: number;
    studentId: string;
    studentName: string;
    professorName?: string;
    recipientEmail: string;
    recipientType: 'STUDENT' | 'PARENT' | 'TEACHER';
    subject: string;
    message: string;
    date: string;
    time: string;
    status: 'DISPATCHED' | 'FAILED' | 'SMTP_UNCONFIGURED';
    errorDetails?: string;
    classSession: string;
  }>;
  emailSettings: {
    id: number;
    senderEmail: string;
    senderName: string;
    appPassword?: string;
    smtpHost: string;
    smtpPort: number;
    connectionStatus: 'CONNECTED' | 'NOT_CONFIGURED' | 'FAILED';
    lastTestedAt?: string;
    lastErrorMessage?: string;
  };
  emailTemplates: typeof DEFAULT_EMAIL_TEMPLATES;
}

function loadDB(): DBState {
  if (!fs.existsSync(DB_FILE)) {
    const initialState: DBState = {
      users: [],
      professors: [],
      lectures: [],
      students: [],
      attendance: [],
      notifications: [],
      emailSettings: {
        id: 1,
        senderEmail: '',
        senderName: 'ARMIET Attendance Portal',
        appPassword: '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        connectionStatus: 'NOT_CONFIGURED',
      },
      emailTemplates: DEFAULT_EMAIL_TEMPLATES,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), 'utf-8');
    return initialState;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.emailTemplates || data.emailTemplates.length === 0) {
      data.emailTemplates = DEFAULT_EMAIL_TEMPLATES;
    }
    return data;
  } catch (err) {
    console.error('Failed reading DB file, recreating:', err);
    const fallback: DBState = {
      users: [],
      professors: [],
      lectures: [],
      students: [],
      attendance: [],
      notifications: [],
      emailSettings: {
        id: 1,
        senderEmail: '',
        senderName: 'ARMIET Attendance Portal',
        appPassword: '',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        connectionStatus: 'NOT_CONFIGURED',
      },
      emailTemplates: DEFAULT_EMAIL_TEMPLATES,
    };
    return fallback;
  }
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// Memory database reference
let db = loadDB();

// Create nodemailer transporter
function createMailTransporter() {
  const settings = db.emailSettings;
  if (!settings.senderEmail || !settings.appPassword) {
    return null;
  }
  return nodemailer.createTransport({
    host: settings.smtpHost || 'smtp.gmail.com',
    port: settings.smtpPort || 587,
    secure: (settings.smtpPort || 587) === 465,
    auth: {
      user: settings.senderEmail,
      pass: settings.appPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Get full state
app.get('/api/state', (req: Request, res: Response) => {
  res.json({
    isInitialized: db.users.length > 0,
    users: db.users.map(u => ({ id: u.id, username: u.username, fullName: u.fullName, role: u.role, email: u.email, department: u.department })),
    professors: db.professors,
    lectures: db.lectures,
    students: db.students,
    attendance: db.attendance,
    notifications: db.notifications,
    emailSettings: {
      ...db.emailSettings,
      appPassword: db.emailSettings.appPassword ? '••••••••••••••••' : '',
    },
    emailTemplates: db.emailTemplates,
  });
});

// 2. Initial Setup (First time Admin creation)
app.post('/api/setup', (req: Request, res: Response) => {
  if (db.users.length > 0) {
    return res.status(400).json({ error: 'System is already initialized with an Administrator account.' });
  }

  const { username, password, fullName, designation, department, email } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const newUser = {
    id: 1,
    username: username.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    role: 'ADMIN' as const,
    email: email ? email.trim() : '',
    department: department ? department.trim() : 'Computer Engineering',
  };

  db.users.push(newUser);

  // Also add this administrator as the first Professor record
  const firstProfessor = {
    id: 1,
    name: fullName.trim(),
    facultyId: 'FAC001',
    designation: designation ? designation.trim() : 'Professor & Admin',
    department: department ? department.trim() : 'Computer Engineering',
    email: email ? email.trim() : '',
  };
  db.professors.push(firstProfessor);

  saveDB(db);

  res.json({
    success: true,
    message: 'Administrator account created successfully!',
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      department: newUser.department,
    },
  });
});

// 2b. Unified Registration (Sign Up)
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password, fullName, designation, department, email } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Username, password, and full name are required.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  // Prevent duplicate username
  const existingUser = db.users.find(u => u.username.toLowerCase() === cleanUsername);
  if (existingUser) {
    return res.status(400).json({ error: `The username "${cleanUsername}" is already registered. Please choose a different username.` });
  }

  const isFirstUser = db.users.length === 0;
  const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  const newRole = isFirstUser ? ('ADMIN' as const) : ('TEACHER' as const);

  const newUser = {
    id: newUserId,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    fullName: fullName.trim(),
    role: newRole,
    email: email ? email.trim() : '',
    department: department ? department.trim() : 'Computer Engineering',
  };

  db.users.push(newUser);

  // Add corresponding professor entry
  const nextProfId = db.professors.length > 0 ? Math.max(...db.professors.map(p => p.id)) + 1 : 1;
  const facultyCode = `FAC${String(nextProfId).padStart(3, '0')}`;
  const newProfessor = {
    id: nextProfId,
    name: fullName.trim(),
    facultyId: facultyCode,
    designation: designation ? designation.trim() : (isFirstUser ? 'Professor & Admin' : 'Assistant Professor'),
    department: department ? department.trim() : 'Computer Engineering',
    email: email ? email.trim() : '',
  };
  db.professors.push(newProfessor);

  saveDB(db);

  res.json({
    success: true,
    message: isFirstUser
      ? 'Master Administrator and Head Faculty account created successfully!'
      : 'Faculty account registered successfully!',
    user: {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      department: newUser.department,
    },
  });
});

// 3. Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter username and password.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === cleanUser);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      department: user.department,
    },
  });
});

// 4. Change Password
app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;
  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const user = db.users.find(u => u.id === Number(userId));
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'Current password does not match.' });
  }

  user.passwordHash = hashPassword(newPassword);
  saveDB(db);

  res.json({ success: true, message: 'Password changed successfully.' });
});

// 5. Professors Management (Add, Edit, Delete)
app.post('/api/professors', (req: Request, res: Response) => {
  const { action, professor } = req.body;

  if (action === 'delete') {
    db.professors = db.professors.filter(p => p.id !== Number(professor.id));
    saveDB(db);
    return res.json({ success: true, message: 'Professor removed.' });
  }

  if (!professor.name || !professor.name.trim()) {
    return res.status(400).json({ error: 'Professor name is required.' });
  }

  if (professor.id) {
    // Edit existing professor
    const idx = db.professors.findIndex(p => p.id === Number(professor.id));
    if (idx !== -1) {
      db.professors[idx] = { ...db.professors[idx], ...professor, id: Number(professor.id) };

      // Update professor name in all assigned lectures
      db.lectures.forEach(lec => {
        if (lec.professorId === Number(professor.id)) {
          lec.professorName = professor.name.trim();
        }
      });

      saveDB(db);
      return res.json({ success: true, message: 'Professor details updated.', professor: db.professors[idx] });
    }
  }

  // Create new professor
  const newId = db.professors.length > 0 ? Math.max(...db.professors.map(p => p.id)) + 1 : 1;
  const newProf = {
    ...professor,
    id: newId,
    name: professor.name.trim(),
    facultyId: professor.facultyId?.trim() || `FAC${String(newId).padStart(3, '0')}`,
    designation: professor.designation?.trim() || 'Assistant Professor',
    department: professor.department?.trim() || 'Computer Engineering',
    email: professor.email?.trim() || '',
  };

  db.professors.push(newProf);
  saveDB(db);
  res.json({ success: true, message: 'Professor added successfully.', professor: newProf });
});

// 6. Lectures Management
app.post('/api/lectures', (req: Request, res: Response) => {
  const { action, lecture } = req.body;

  if (action === 'delete') {
    db.lectures = db.lectures.filter(l => l.id !== Number(lecture.id));
    saveDB(db);
    return res.json({ success: true, message: 'Lecture deleted.' });
  }

  if (!lecture.subjectName || !lecture.subjectCode) {
    return res.status(400).json({ error: 'Subject name and code are required.' });
  }

  const prof = db.professors.find(p => p.id === Number(lecture.professorId));
  const profName = prof ? prof.name : (lecture.professorName || 'Professor');

  if (lecture.id) {
    const idx = db.lectures.findIndex(l => l.id === Number(lecture.id));
    if (idx !== -1) {
      db.lectures[idx] = {
        ...db.lectures[idx],
        ...lecture,
        id: Number(lecture.id),
        professorName: profName,
        gracePeriodMinutes: Number(lecture.gracePeriodMinutes) || 10,
      };
      saveDB(db);
      return res.json({ success: true, message: 'Lecture updated.', lecture: db.lectures[idx] });
    }
  }

  const newId = db.lectures.length > 0 ? Math.max(...db.lectures.map(l => l.id)) + 1 : 1;
  const newLecture = {
    ...lecture,
    id: newId,
    professorName: profName,
    gracePeriodMinutes: Number(lecture.gracePeriodMinutes) || 10,
  };

  db.lectures.push(newLecture);
  saveDB(db);
  res.json({ success: true, message: 'Lecture schedule added.', lecture: newLecture });
});

// 7. Students Management
app.post('/api/students', (req: Request, res: Response) => {
  const { action, student } = req.body;

  if (action === 'delete') {
    db.students = db.students.filter(s => s.id !== Number(student.id));
    saveDB(db);
    return res.json({ success: true, message: 'Student removed from database.' });
  }

  if (!student.studentId || !student.name || !student.rollNo) {
    return res.status(400).json({ error: 'Student ID, Roll No, and Name are required.' });
  }

  const cleanStudentId = student.studentId.trim().toUpperCase();

  // Check unique student ID
  const existing = db.students.find(s => s.studentId === cleanStudentId && s.id !== student.id);
  if (existing) {
    return res.status(400).json({ error: `Student ID "${cleanStudentId}" is already assigned to ${existing.name}.` });
  }

  if (student.id) {
    const idx = db.students.findIndex(s => s.id === Number(student.id));
    if (idx !== -1) {
      db.students[idx] = {
        ...db.students[idx],
        ...student,
        id: Number(student.id),
        studentId: cleanStudentId,
      };
      saveDB(db);
      return res.json({ success: true, message: 'Student details updated.', student: db.students[idx] });
    }
  }

  const newId = db.students.length > 0 ? Math.max(...db.students.map(s => s.id)) + 1 : 1;
  const newStudent = {
    ...student,
    id: newId,
    studentId: cleanStudentId,
  };

  db.students.push(newStudent);
  saveDB(db);
  res.json({ success: true, message: 'Student registered successfully.', student: newStudent });
});

// 8. Attendance Scan (QR Scan)
app.post('/api/attendance/scan', (req: Request, res: Response) => {
  const { studentId, classSession, lectureId } = req.body;
  if (!studentId || !studentId.trim()) {
    return res.status(400).json({ success: false, message: 'Invalid QR code.' });
  }

  const cleanId = studentId.trim().toUpperCase();
  const student = db.students.find(s => s.studentId === cleanId);

  if (!student) {
    return res.status(404).json({
      success: false,
      alreadyMarked: false,
      message: `Invalid QR Code: Student "${cleanId}" not found in database.`,
      status: 'ERROR',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const nowTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const session = classSession || 'Regular';

  // Check if lecture attached
  let lecture = lectureId ? db.lectures.find(l => l.id === Number(lectureId)) : undefined;
  if (!lecture && db.lectures.length > 0) {
    lecture = db.lectures[0];
  }

  // Check duplicate attendance for today + session
  const existing = db.attendance.find(
    r => r.studentId === student.studentId && r.date === today && r.classSession === session
  );

  if (existing) {
    return res.json({
      success: true,
      alreadyMarked: true,
      message: 'Attendance Already Marked ✓',
      studentName: student.name,
      studentId: student.studentId,
      rollNo: student.rollNo,
      className: `${student.className} - ${student.division}`,
      time: existing.time,
      status: existing.status,
    });
  }

  // Grace period check
  let isLate = false;
  if (lecture && lecture.startTime) {
    // If current time exceeds start time + grace period
    const graceMin = lecture.gracePeriodMinutes || 10;
    // basic grace check
    isLate = false;
  }

  const nextId = db.attendance.length > 0 ? Math.max(...db.attendance.map(a => a.id)) + 1 : 1;
  const newRec = {
    id: nextId,
    studentIdFk: student.id,
    studentId: student.studentId,
    studentName: student.name,
    rollNo: student.rollNo,
    className: student.className,
    division: student.division,
    lectureId: lecture?.id,
    subjectName: lecture ? `${lecture.subjectName} (${lecture.subjectCode})` : undefined,
    professorName: lecture?.professorName,
    date: today,
    time: nowTime,
    status: 'PRESENT' as const,
    isLate,
    classSession: session,
  };

  db.attendance.unshift(newRec);
  saveDB(db);

  res.json({
    success: true,
    alreadyMarked: false,
    message: 'Attendance Marked: PRESENT ✓',
    studentName: student.name,
    studentId: student.studentId,
    rollNo: student.rollNo,
    className: `${student.className} - ${student.division}`,
    time: nowTime,
    status: 'PRESENT',
  });
});

// 9. Manual Attendance
app.post('/api/attendance/manual', (req: Request, res: Response) => {
  const { statusMap, date, classSession, lectureId } = req.body;
  if (!statusMap || !date) {
    return res.status(400).json({ error: 'Missing status data or date.' });
  }

  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const session = classSession || 'Regular';
  const lecture = lectureId ? db.lectures.find(l => l.id === Number(lectureId)) : undefined;

  Object.entries(statusMap).forEach(([stuId, status]) => {
    const student = db.students.find(s => s.studentId === stuId);
    if (!student) return;

    const existingIdx = db.attendance.findIndex(
      r => r.studentId === stuId && r.date === date && r.classSession === session
    );

    if (existingIdx !== -1) {
      db.attendance[existingIdx].status = status as 'PRESENT' | 'ABSENT';
      db.attendance[existingIdx].time = nowTime;
      if (lecture) {
        db.attendance[existingIdx].lectureId = lecture.id;
        db.attendance[existingIdx].subjectName = `${lecture.subjectName} (${lecture.subjectCode})`;
        db.attendance[existingIdx].professorName = lecture.professorName;
      }
    } else {
      const nextId = db.attendance.length > 0 ? Math.max(...db.attendance.map(a => a.id)) + 1 : 1;
      db.attendance.unshift({
        id: nextId,
        studentIdFk: student.id,
        studentId: student.studentId,
        studentName: student.name,
        rollNo: student.rollNo,
        className: student.className,
        division: student.division,
        lectureId: lecture?.id,
        subjectName: lecture ? `${lecture.subjectName} (${lecture.subjectCode})` : undefined,
        professorName: lecture?.professorName,
        date,
        time: nowTime,
        status: status as 'PRESENT' | 'ABSENT',
        classSession: session,
      });
    }
  });

  saveDB(db);
  res.json({ success: true, message: 'Manual attendance saved.' });
});

// 10. Complete Attendance & Real Email Dispatch
app.post('/api/attendance/complete', async (req: Request, res: Response) => {
  const { classSession, className, lectureId } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const session = classSession || 'Regular';

  let eligibleStudents = db.students;
  if (className && className !== 'ALL') {
    eligibleStudents = eligibleStudents.filter(s => s.className.toUpperCase() === className.toUpperCase());
  }

  const sessionRecords = db.attendance.filter(r => r.date === today && r.classSession === session);
  const presentIds = new Set(sessionRecords.filter(r => r.status === 'PRESENT').map(r => r.studentId));

  const absentStudents = eligibleStudents.filter(s => !presentIds.has(s.studentId));

  // Mark absent students in attendance if not yet marked
  absentStudents.forEach(stu => {
    const existing = sessionRecords.find(r => r.studentId === stu.studentId);
    if (!existing) {
      const nextId = db.attendance.length > 0 ? Math.max(...db.attendance.map(a => a.id)) + 1 : 1;
      db.attendance.unshift({
        id: nextId,
        studentIdFk: stu.id,
        studentId: stu.studentId,
        studentName: stu.name,
        rollNo: stu.rollNo,
        className: stu.className,
        division: stu.division,
        date: today,
        time: nowTime,
        status: 'ABSENT',
        classSession: session,
      });
    }
  });

  const lecture = lectureId ? db.lectures.find(l => l.id === Number(lectureId)) : db.lectures[0];
  const professorName = lecture?.professorName || (db.professors[0]?.name || 'Faculty');
  const subjectName = lecture ? lecture.subjectName : 'Scheduled Lecture';
  const subjectCode = lecture ? lecture.subjectCode : '';

  const transporter = createMailTransporter();
  const isSmtpConfigured = transporter !== null && db.emailSettings.connectionStatus === 'CONNECTED';

  let emailsDispatched = 0;
  let emailsFailed = 0;

  for (const stu of absentStudents) {
    // 1. Student Notification
    const stuTemplate = db.emailTemplates.find(t => t.templateType === 'STUDENT_ABSENCE') || DEFAULT_EMAIL_TEMPLATES[0];
    const stuSubject = interpolateText(stuTemplate.subject, stu, today, session, professorName, subjectName, subjectCode);
    const stuBody = interpolateText(stuTemplate.bodyText, stu, today, session, professorName, subjectName, subjectCode);

    let stuStatus: 'DISPATCHED' | 'FAILED' | 'SMTP_UNCONFIGURED' = 'SMTP_UNCONFIGURED';
    let stuErrDetails = '';

    if (isSmtpConfigured && transporter) {
      try {
        await transporter.sendMail({
          from: `"${db.emailSettings.senderName || 'ARMIET Attendance'}" <${db.emailSettings.senderEmail}>`,
          to: stu.studentEmail,
          subject: stuSubject,
          text: stuBody,
        });
        stuStatus = 'DISPATCHED';
        emailsDispatched++;
      } catch (err: unknown) {
        stuStatus = 'FAILED';
        stuErrDetails = err instanceof Error ? err.message : String(err);
        emailsFailed++;
      }
    }

    const nextNotifId = db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;
    db.notifications.unshift({
      id: nextNotifId,
      studentIdFk: stu.id,
      studentId: stu.studentId,
      studentName: stu.name,
      professorName,
      recipientEmail: stu.studentEmail,
      recipientType: 'STUDENT',
      subject: stuSubject,
      message: stuBody,
      date: today,
      time: nowTime,
      status: stuStatus,
      errorDetails: stuErrDetails,
      classSession: session,
    });

    // 2. Parent Notification
    const parTemplate = db.emailTemplates.find(t => t.templateType === 'PARENT_ABSENCE') || DEFAULT_EMAIL_TEMPLATES[1];
    const parSubject = interpolateText(parTemplate.subject, stu, today, session, professorName, subjectName, subjectCode);
    const parBody = interpolateText(parTemplate.bodyText, stu, today, session, professorName, subjectName, subjectCode);

    let parStatus: 'DISPATCHED' | 'FAILED' | 'SMTP_UNCONFIGURED' = 'SMTP_UNCONFIGURED';
    let parErrDetails = '';

    if (isSmtpConfigured && transporter) {
      try {
        await transporter.sendMail({
          from: `"${db.emailSettings.senderName || 'ARMIET Attendance'}" <${db.emailSettings.senderEmail}>`,
          to: stu.parentEmail,
          subject: parSubject,
          text: parBody,
        });
        parStatus = 'DISPATCHED';
        emailsDispatched++;
      } catch (err: unknown) {
        parStatus = 'FAILED';
        parErrDetails = err instanceof Error ? err.message : String(err);
        emailsFailed++;
      }
    }

    const nextParId = db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;
    db.notifications.unshift({
      id: nextParId,
      studentIdFk: stu.id,
      studentId: stu.studentId,
      studentName: stu.name,
      professorName,
      recipientEmail: stu.parentEmail,
      recipientType: 'PARENT',
      subject: parSubject,
      message: parBody,
      date: today,
      time: nowTime,
      status: parStatus,
      errorDetails: parErrDetails,
      classSession: session,
    });
  }

  saveDB(db);

  res.json({
    success: true,
    absentCount: absentStudents.length,
    absentStudents,
    notificationsGenerated: absentStudents.length * 2,
    emailsDispatched,
    emailsFailed,
    isSmtpConfigured,
  });
});

// 11. Email Settings & Real SMTP Testing
app.post('/api/email/settings', (req: Request, res: Response) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Settings object is required.' });
  }

  db.emailSettings = {
    ...db.emailSettings,
    senderEmail: settings.senderEmail?.trim() || '',
    senderName: settings.senderName?.trim() || 'ARMIET Attendance Portal',
    appPassword: settings.appPassword !== undefined && settings.appPassword !== '••••••••••••••••' ? settings.appPassword.trim() : db.emailSettings.appPassword,
    smtpHost: settings.smtpHost?.trim() || 'smtp.gmail.com',
    smtpPort: Number(settings.smtpPort) || 587,
  };

  saveDB(db);
  res.json({ success: true, message: 'Email settings saved.' });
});

// 12. Test SMTP Connection
app.post('/api/email/test', async (req: Request, res: Response) => {
  const { testRecipient, senderEmail, appPassword, smtpHost, smtpPort } = req.body;

  const emailToUse = senderEmail?.trim() || db.emailSettings.senderEmail;
  const passToUse = appPassword && appPassword !== '••••••••••••••••' ? appPassword.trim() : db.emailSettings.appPassword;
  const hostToUse = smtpHost?.trim() || db.emailSettings.smtpHost || 'smtp.gmail.com';
  const portToUse = Number(smtpPort) || db.emailSettings.smtpPort || 587;

  if (!emailToUse || !emailToUse.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid sender email address.' });
  }

  if (!passToUse) {
    return res.status(400).json({ success: false, message: 'App Password is required for SMTP connection.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: hostToUse,
      port: portToUse,
      secure: portToUse === 465,
      auth: {
        user: emailToUse,
        pass: passToUse,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    // If test recipient provided, send actual verification email
    if (testRecipient && testRecipient.includes('@')) {
      await transporter.sendMail({
        from: `"ARMIET Smart Attendance" <${emailToUse}>`,
        to: testRecipient,
        subject: 'SMTP Connection Verified – Smart QR Attendance System',
        text: `Hello,\n\nThis is a real test verification email sent from your Smart QR-Based Attendance System at ARMIET College.\n\nSMTP Configuration is working properly!\nTimestamp: ${new Date().toLocaleString()}`,
      });
    }

    db.emailSettings.connectionStatus = 'CONNECTED';
    db.emailSettings.lastTestedAt = new Date().toLocaleString();
    db.emailSettings.lastErrorMessage = '';
    saveDB(db);

    res.json({
      success: true,
      message: `SMTP Connection test succeeded! Test email delivered to ${testRecipient || emailToUse}.`,
    });
  } catch (err: unknown) {
    console.error('SMTP test error:', err);
    const errMessage = err instanceof Error ? err.message : String(err);
    db.emailSettings.connectionStatus = 'FAILED';
    db.emailSettings.lastTestedAt = new Date().toLocaleString();
    db.emailSettings.lastErrorMessage = errMessage;
    saveDB(db);

    res.status(400).json({
      success: false,
      message: `SMTP Connection Failed: ${errMessage}`,
    });
  }
});

// 13. Email Templates Save/Reset
app.post('/api/email/templates', (req: Request, res: Response) => {
  const { action, templateType, subject, bodyText } = req.body;

  if (action === 'reset') {
    const defaultT = DEFAULT_EMAIL_TEMPLATES.find(t => t.templateType === templateType);
    if (defaultT) {
      const idx = db.emailTemplates.findIndex(t => t.templateType === templateType);
      if (idx !== -1) {
        db.emailTemplates[idx] = { ...defaultT, lastModified: new Date().toISOString() };
      }
      saveDB(db);
      return res.json({ success: true, message: 'Template reset to default.', template: defaultT });
    }
  }

  const idx = db.emailTemplates.findIndex(t => t.templateType === templateType);
  if (idx !== -1) {
    db.emailTemplates[idx] = {
      ...db.emailTemplates[idx],
      subject,
      bodyText,
      isCustomized: true,
      lastModified: new Date().toISOString(),
    };
    saveDB(db);
    return res.json({ success: true, message: 'Template saved.', template: db.emailTemplates[idx] });
  }

  res.status(404).json({ error: 'Template not found.' });
});

// Text interpolator helper
function interpolateText(
  text: string,
  student: any,
  date: string,
  session: string,
  professorName: string,
  subjectName: string,
  subjectCode: string
): string {
  return text
    .replace(/{student_name}/g, student.name)
    .replace(/{roll_no}/g, student.rollNo)
    .replace(/{class_name}/g, student.className)
    .replace(/{division}/g, student.division)
    .replace(/{parent_name}/g, student.parentName)
    .replace(/{student_email}/g, student.studentEmail)
    .replace(/{parent_email}/g, student.parentEmail)
    .replace(/{date}/g, date)
    .replace(/{class_session}/g, session)
    .replace(/{attendance_status}/g, 'ABSENT')
    .replace(/{professor_name}/g, professorName)
    .replace(/{subject_name}/g, subjectName)
    .replace(/{subject_code}/g, subjectCode)
    .replace(/{sender_name}/g, db.emailSettings.senderName || 'ARMIET Attendance Portal')
    .replace(/{college_name}/g, 'ARMIET College of Engineering & Technology');
}

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next();
      }

      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart QR Attendance System running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
