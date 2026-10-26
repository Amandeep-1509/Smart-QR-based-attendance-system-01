import React from 'react';
import { User } from '../types';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  onOpenChangePassword: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  onOpenChangePassword,
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-logo-wrap">
          <img
            className="brand-logo"
            src="/images/armiet-logo.png"
            alt="ARMIET College logo"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<span style="font-weight:800;color:#543621;font-size:16px;">ARMIET</span>';
              }
            }}
          />
        </div>
        <div className="brand-copy">
          <div className="brand-title">Smart QR Based</div>
          <div className="brand-subtitle">Attendance System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-heading">Main Navigation</div>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
        >
          <span className="icon">📊</span>
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('students')}
          className={`nav-link ${activeView === 'students' || activeView === 'student-form' || activeView === 'student-card' ? 'active' : ''}`}
        >
          <span className="icon">🎓</span>
          <span>Students</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('professors')}
          className={`nav-link ${activeView === 'professors' ? 'active' : ''}`}
        >
          <span className="icon">👨‍🏫</span>
          <span>Faculty / Professors</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('lectures')}
          className={`nav-link ${activeView === 'lectures' ? 'active' : ''}`}
        >
          <span className="icon">📚</span>
          <span>Lectures &amp; Subjects</span>
        </button>

        <div className="nav-heading">Attendance Modules</div>

        <button
          type="button"
          onClick={() => onNavigate('qr')}
          className={`nav-link ${activeView === 'qr' ? 'active' : ''}`}
        >
          <span className="icon">📷</span>
          <span>QR Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('manual')}
          className={`nav-link ${activeView === 'manual' ? 'active' : ''}`}
        >
          <span className="icon">📝</span>
          <span>Manual Attendance</span>
        </button>

        <div className="nav-heading">Notifications & Analytics</div>

        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          className={`nav-link ${activeView === 'notifications' ? 'active' : ''}`}
        >
          <span className="icon">✉</span>
          <span>Email Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className={`nav-link ${activeView === 'reports' ? 'active' : ''}`}
        >
          <span className="icon">📈</span>
          <span>Attendance Reports</span>
        </button>

        <div className="nav-heading">Admin Settings</div>

        <button
          type="button"
          onClick={() => onNavigate('email-settings')}
          className={`nav-link ${activeView === 'email-settings' ? 'active' : ''}`}
        >
          <span className="icon">⚙</span>
          <span>Email Settings</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('email-templates')}
          className={`nav-link ${activeView === 'email-templates' ? 'active' : ''}`}
        >
          <span className="icon">📝</span>
          <span>Email Templates</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.fullName ? currentUser.fullName.charAt(0) : 'A'}
          </div>
          <div>
            <div className="user-name">{currentUser.fullName}</div>
            <div className="user-role">{currentUser.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={onOpenChangePassword}
            className="btn-logout"
            title="Change Password"
            style={{ fontSize: '15px' }}
          >
            🔑
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="btn-logout"
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
};
