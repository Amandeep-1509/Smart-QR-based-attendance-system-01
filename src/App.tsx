import React, { useState, useEffect } from 'react';
import { StorageService } from './storage';
import { User } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './views/DashboardView';
import { QRScannerView } from './views/QRScannerView';
import { ManualAttendanceView } from './views/ManualAttendanceView';
import { StudentsView } from './views/StudentsView';
import { StudentFormView } from './views/StudentFormView';
import { StudentCardView } from './views/StudentCardView';
import { ProfessorsView } from './views/ProfessorsView';
import { LecturesView } from './views/LecturesView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { EmailSettingsView } from './views/EmailSettingsView';
import { EmailTemplatesView } from './views/EmailTemplatesView';
import { LoginView } from './views/LoginView';
import { InitialSetupView } from './views/InitialSetupView';
import { ChangePasswordModal } from './views/ChangePasswordModal';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    StorageService.syncState().then((state) => {
      setIsInitialized(state.isInitialized);
      const user = StorageService.getCurrentUser();
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  const handleNavigate = (view: string, studentId?: number) => {
    setActiveView(view);
    setSelectedStudentId(studentId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleSetupComplete = (user: User) => {
    setIsInitialized(true);
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cream)', color: 'var(--primary-brown)', fontWeight: 600 }}>
        Loading Smart QR Attendance System...
      </div>
    );
  }

  // 1. If system is not initialized, show first-time Administrator Setup
  if (!isInitialized) {
    return <InitialSetupView onSetupComplete={handleSetupComplete} />;
  }

  // 2. If initialized but not logged in, show Login
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} onGoToSetup={() => setIsInitialized(false)} />;
  }

  const getViewDetails = () => {
    switch (activeView) {
      case 'dashboard':
        return {
          title: 'Attendance Dashboard',
          subtitle: 'Real-time overview of student attendance, lectures, and email dispatches',
        };
      case 'students':
        return {
          title: 'Student Management',
          subtitle: 'Register, edit, view students and generate their official attendance QR codes',
        };
      case 'student-form':
        return {
          title: selectedStudentId ? 'Edit Student Details' : 'Register New Student',
          subtitle: 'Fill in academic identification and parent contact details',
        };
      case 'student-card':
        return {
          title: 'Student Smart ID Card',
          subtitle: 'Print or download official QR attendance ID card',
        };
      case 'professors':
        return {
          title: 'Faculty & Professor Management',
          subtitle: 'Enter, edit, and assign faculty members across lectures and reports',
        };
      case 'lectures':
        return {
          title: 'Lecture & Subject Management',
          subtitle: 'Configure subjects, assign professors, lecture timings, and grace periods',
        };
      case 'qr':
        return {
          title: 'Instant QR Attendance',
          subtitle: 'Scan and Pass: Zero-click continuous attendance recognition',
        };
      case 'manual':
        return {
          title: 'Manual Attendance Backup',
          subtitle: 'Fallback attendance marking when camera or student QR is unavailable',
        };
      case 'notifications':
        return {
          title: 'Email Notification History',
          subtitle: 'Automated absence dispatch logs for absent students and parents',
        };
      case 'reports':
        return {
          title: 'Attendance Reports & Analytics',
          subtitle: 'Daily reports, individual student tracking, and PDF printable export',
        };
      case 'email-settings':
        return {
          title: 'Sender Email Settings',
          subtitle: 'Configure real Gmail SMTP credentials to deliver absence notifications',
        };
      case 'email-templates':
        return {
          title: 'Email Templates Editor',
          subtitle: 'Customize automated absence notifications for students, parents, and faculty',
        };
      default:
        return {
          title: 'Smart Attendance System',
          subtitle: 'ARMIET College Portal',
        };
    }
  };

  const details = getViewDetails();

  return (
    <div className="app-container">
      <div className="no-print">
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />
      </div>

      <div className="main-wrapper">
        <Header
          title={details.title}
          subtitle={details.subtitle}
          onNavigate={handleNavigate}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        />

        {activeView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {activeView === 'students' && <StudentsView onNavigate={handleNavigate} />}
        {activeView === 'student-form' && (
          <StudentFormView studentId={selectedStudentId} onNavigate={handleNavigate} />
        )}
        {activeView === 'student-card' && (
          <StudentCardView
            studentId={selectedStudentId || 1}
            onNavigate={handleNavigate}
          />
        )}
        {activeView === 'professors' && <ProfessorsView />}
        {activeView === 'lectures' && <LecturesView />}
        {activeView === 'qr' && <QRScannerView onNavigate={handleNavigate} />}
        {activeView === 'manual' && <ManualAttendanceView onNavigate={handleNavigate} />}
        {activeView === 'notifications' && <NotificationsView />}
        {activeView === 'reports' && <ReportsView onNavigate={handleNavigate} />}
        {activeView === 'email-settings' && <EmailSettingsView />}
        {activeView === 'email-templates' && <EmailTemplatesView />}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
};
