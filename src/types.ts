export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'TEACHER';
  email?: string;
  department?: string;
}

export interface Professor {
  id: number;
  name: string;
  facultyId: string;
  designation: string;
  department: string;
  email: string;
  mobile?: string;
}

export interface Lecture {
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
}

export interface Student {
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
}

export interface AttendanceRecord {
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
}

export interface EmailNotification {
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
}

export interface EmailSetting {
  id: number;
  senderEmail: string;
  senderName: string;
  appPassword?: string;
  smtpHost: string;
  smtpPort: number;
  connectionStatus: 'CONNECTED' | 'NOT_CONFIGURED' | 'FAILED';
  lastTestedAt?: string;
  lastErrorMessage?: string;
}

export interface EmailTemplate {
  id: number;
  templateType: 'STUDENT_ABSENCE' | 'PARENT_ABSENCE' | 'TEACHER_ABSENCE' | 'TEACHER_ATTENDANCE';
  displayLabel: string;
  subject: string;
  bodyText: string;
  isCustomized: boolean;
  lastModified?: string;
}
