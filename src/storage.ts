import {
  User,
  Professor,
  Lecture,
  Student,
  AttendanceRecord,
  EmailNotification,
  EmailSetting,
  EmailTemplate,
} from './types';

export const DEFAULT_TEMPLATES: Record<EmailTemplate['templateType'], { subject: string; body: string; label: string }> = {
  STUDENT_ABSENCE: {
    label: 'Student Absence Notification',
    subject: 'Attendance Notification – You Were Marked Absent Today',
    body: `Dear {student_name},

This is to inform you that you were marked ABSENT for today's lecture.

Details:
  Date       : {date}
  Lecture    : {subject_name} ({subject_code})
  Faculty    : {professor_name}
  Class      : {class_name} – {division}
  Roll No    : {roll_no}
  Status     : {attendance_status}

If you believe this is an error, please contact your faculty member immediately.

Regards,
{professor_name}
{college_name}`,
  },
  PARENT_ABSENCE: {
    label: 'Parent Absence Alert',
    subject: "Your Ward's Attendance Notification – {student_name} Was Absent",
    body: `Dear {parent_name},

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
  },
  TEACHER_ABSENCE: {
    label: 'Faculty Absence Summary',
    subject: 'Lecture Attendance Summary – Absent Students for {date}',
    body: `Dear Faculty,

Here is the attendance report for {subject_name} ({class_name} – {division}) on {date}.

Faculty: {professor_name}
Session: {class_session}
Total Absent: {absent_count} students.

Full session records have been archived in the attendance portal.

Regards,
{college_name} Administration`,
  },
  TEACHER_ATTENDANCE: {
    label: 'Faculty Full Statistics',
    subject: 'Attendance Statistics – {subject_name} on {date}',
    body: `Dear Faculty,

Attendance stats for {subject_name} on {date}:
Faculty In-Charge : {professor_name}
Total Students     : {total_count}
Present            : {present_count}
Absent             : {absent_count}
Attendance Rate    : {attendance_percentage}%

Full details and printable PDF reports are available in Attendance Reports.

Regards,
{college_name} Administration`,
  },
};

export const StorageService = {
  // Sync state from server API
  async syncState(): Promise<{ isInitialized: boolean }> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('smart_attendance_is_initialized', JSON.stringify(data.isInitialized));
        localStorage.setItem('smart_attendance_professors', JSON.stringify(data.professors || []));
        localStorage.setItem('smart_attendance_lectures', JSON.stringify(data.lectures || []));
        localStorage.setItem('smart_attendance_students', JSON.stringify(data.students || []));
        localStorage.setItem('smart_attendance_records', JSON.stringify(data.attendance || []));
        localStorage.setItem('smart_attendance_notifications', JSON.stringify(data.notifications || []));
        localStorage.setItem('smart_attendance_email_settings', JSON.stringify(data.emailSettings || {}));
        localStorage.setItem('smart_attendance_templates', JSON.stringify(data.emailTemplates || []));
        return { isInitialized: data.isInitialized };
      }
    } catch (e) {
      console.warn('Backend sync failed, using cached storage:', e);
    }
    const cachedInit = localStorage.getItem('smart_attendance_is_initialized');
    return { isInitialized: cachedInit ? JSON.parse(cachedInit) : false };
  },

  isInitialized(): boolean {
    const raw = localStorage.getItem('smart_attendance_is_initialized');
    return raw ? JSON.parse(raw) : false;
  },

  // First-time Administrator Setup
  async setupAdmin(data: {
    username: string;
    password: string;
    fullName: string;
    designation: string;
    department: string;
    email: string;
  }): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        this.setCurrentUser(result.user);
        localStorage.setItem('smart_attendance_is_initialized', 'true');
        await this.syncState();
        return { success: true, message: result.message, user: result.user };
      }
      return { success: false, message: result.error || 'Failed to setup admin account.' };
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  },

  // Auth
  getCurrentUser(): User | null {
    const raw = localStorage.getItem('smart_attendance_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem('smart_attendance_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('smart_attendance_user');
    }
  },

  async login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        this.setCurrentUser(result.user);
        await this.syncState();
        return { success: true, user: result.user };
      }
      return { success: false, message: result.error || 'Invalid credentials.' };
    } catch (e: unknown) {
      return { success: false, message: 'Server communication error. Please try again.' };
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Not authenticated.' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error || 'Password update failed.' };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error changing password.' };
    }
  },

  // Professors
  getProfessors(): Professor[] {
    const raw = localStorage.getItem('smart_attendance_professors');
    return raw ? JSON.parse(raw) : [];
  },

  async saveProfessor(prof: Partial<Professor>): Promise<{ success: boolean; message: string; professor?: Professor }> {
    try {
      const res = await fetch('/api/professors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', professor: prof }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message, professor: result.professor };
      }
      return { success: false, message: result.error || 'Error saving professor.' };
    } catch (e) {
      return { success: false, message: 'Server error saving professor.' };
    }
  },

  async deleteProfessor(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/professors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', professor: { id } }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error || 'Error deleting professor.' };
    } catch (e) {
      return { success: false, message: 'Server error deleting professor.' };
    }
  },

  // Lectures
  getLectures(): Lecture[] {
    const raw = localStorage.getItem('smart_attendance_lectures');
    return raw ? JSON.parse(raw) : [];
  },

  async saveLecture(lec: Partial<Lecture>): Promise<{ success: boolean; message: string; lecture?: Lecture }> {
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', lecture: lec }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message, lecture: result.lecture };
      }
      return { success: false, message: result.error || 'Error saving lecture.' };
    } catch (e) {
      return { success: false, message: 'Server error saving lecture.' };
    }
  },

  async deleteLecture(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', lecture: { id } }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error || 'Error deleting lecture.' };
    } catch (e) {
      return { success: false, message: 'Server error deleting lecture.' };
    }
  },

  // Students
  getStudents(): Student[] {
    const raw = localStorage.getItem('smart_attendance_students');
    return raw ? JSON.parse(raw) : [];
  },

  getStudentById(id: number): Student | undefined {
    return this.getStudents().find(s => s.id === id);
  },

  async saveStudent(stu: Partial<Student>): Promise<{ success: boolean; message: string; student?: Student }> {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', student: stu }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message, student: result.student };
      }
      return { success: false, message: result.error || 'Error saving student.' };
    } catch (e) {
      return { success: false, message: 'Server error saving student.' };
    }
  },

  async deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', student: { id } }),
      });
      const result = await res.json();
      if (res.ok) {
        await this.syncState();
        return { success: true, message: result.message };
      }
      return { success: false, message: result.error || 'Error deleting student.' };
    } catch (e) {
      return { success: false, message: 'Server error deleting student.' };
    }
  },

  // Attendance
  getAttendanceRecords(): AttendanceRecord[] {
    const raw = localStorage.getItem('smart_attendance_records');
    return raw ? JSON.parse(raw) : [];
  },

  async markQRAttendance(
    studentId: string,
    classSession: string = 'Regular',
    lectureId?: number
  ): Promise<{
    success: boolean;
    alreadyMarked: boolean;
    message: string;
    studentName?: string;
    studentId?: string;
    rollNo?: string;
    className?: string;
    time?: string;
    status?: 'PRESENT' | 'ABSENT' | 'ERROR';
  }> {
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, classSession, lectureId }),
      });
      const result = await res.json();
      await this.syncState();
      return result;
    } catch (e) {
      return {
        success: false,
        alreadyMarked: false,
        message: 'Network error processing QR scan.',
        status: 'ERROR',
      };
    }
  },

  async saveManualAttendance(
    statusMap: Record<string, 'PRESENT' | 'ABSENT'>,
    date: string,
    classSession: string,
    lectureId?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusMap, date, classSession, lectureId }),
      });
      const result = await res.json();
      await this.syncState();
      return { success: res.ok, message: result.message || result.error };
    } catch (e) {
      return { success: false, message: 'Network error saving manual attendance.' };
    }
  },

  async completeAttendanceAndNotify(
    classSession: string = 'Regular',
    className: string = 'ALL',
    lectureId?: number
  ): Promise<{
    success: boolean;
    absentCount: number;
    absentStudents: Student[];
    notificationsGenerated: number;
    emailsDispatched: number;
    emailsFailed: number;
    isSmtpConfigured: boolean;
  }> {
    try {
      const res = await fetch('/api/attendance/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classSession, className, lectureId }),
      });
      const result = await res.json();
      await this.syncState();
      return result;
    } catch (e) {
      return {
        success: false,
        absentCount: 0,
        absentStudents: [],
        notificationsGenerated: 0,
        emailsDispatched: 0,
        emailsFailed: 0,
        isSmtpConfigured: false,
      };
    }
  },

  // Notifications
  getNotifications(): EmailNotification[] {
    const raw = localStorage.getItem('smart_attendance_notifications');
    return raw ? JSON.parse(raw) : [];
  },

  // Email Settings
  getEmailSettings(): EmailSetting {
    const raw = localStorage.getItem('smart_attendance_email_settings');
    return raw
      ? JSON.parse(raw)
      : {
          id: 1,
          senderEmail: '',
          senderName: 'ARMIET Attendance Portal',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          connectionStatus: 'NOT_CONFIGURED',
        };
  },

  async saveEmailSettings(settings: Partial<EmailSetting>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const result = await res.json();
      await this.syncState();
      return { success: res.ok, message: result.message || result.error };
    } catch (e) {
      return { success: false, message: 'Error saving settings.' };
    }
  },

  async testEmailConnection(testRecipient: string, settings: Partial<EmailSetting>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient,
          senderEmail: settings.senderEmail,
          appPassword: settings.appPassword,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
        }),
      });
      const result = await res.json();
      await this.syncState();
      return { success: result.success, message: result.message };
    } catch (e: unknown) {
      return { success: false, message: e instanceof Error ? e.message : 'Error testing connection.' };
    }
  },

  // Email Templates
  getTemplates(): EmailTemplate[] {
    const raw = localStorage.getItem('smart_attendance_templates');
    return raw ? JSON.parse(raw) : [];
  },

  async updateTemplate(templateType: EmailTemplate['templateType'], subject: string, bodyText: string): Promise<void> {
    try {
      await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', templateType, subject, bodyText }),
      });
      await this.syncState();
    } catch (e) {
      console.warn('Error saving template:', e);
    }
  },

  async resetTemplate(templateType: EmailTemplate['templateType']): Promise<void> {
    try {
      await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', templateType }),
      });
      await this.syncState();
    } catch (e) {
      console.warn('Error resetting template:', e);
    }
  },

  interpolate(
    text: string,
    student: Student,
    date: string,
    classSession: string = 'Regular',
    professorName: string = 'Professor',
    subjectName: string = 'Lecture',
    subjectCode: string = '',
    extra?: { totalCount?: number; presentCount?: number; absentCount?: number; attendancePercentage?: number }
  ): string {
    const settings = this.getEmailSettings();
    return text
      .replace(/{student_name}/g, student.name)
      .replace(/{roll_no}/g, student.rollNo)
      .replace(/{class_name}/g, student.className)
      .replace(/{division}/g, student.division)
      .replace(/{parent_name}/g, student.parentName)
      .replace(/{student_email}/g, student.studentEmail)
      .replace(/{parent_email}/g, student.parentEmail)
      .replace(/{date}/g, date)
      .replace(/{class_session}/g, classSession)
      .replace(/{attendance_status}/g, 'ABSENT')
      .replace(/{professor_name}/g, professorName)
      .replace(/{subject_name}/g, subjectName)
      .replace(/{subject_code}/g, subjectCode)
      .replace(/{sender_name}/g, settings.senderName || 'ARMIET Attendance Portal')
      .replace(/{college_name}/g, 'ARMIET College of Engineering & Technology')
      .replace(/{total_count}/g, String(extra?.totalCount ?? 0))
      .replace(/{present_count}/g, String(extra?.presentCount ?? 0))
      .replace(/{absent_count}/g, String(extra?.absentCount ?? 0))
      .replace(/{attendance_percentage}/g, String(extra?.attendancePercentage ?? 0));
  },

  // Web Audio chime
  playBeep(isSuccess: boolean) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (isSuccess) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  },
};
