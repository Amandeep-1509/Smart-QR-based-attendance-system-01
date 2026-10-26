import React from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onNavigate: (view: string) => void;
  onOpenChangePassword?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onNavigate, onOpenChangePassword }) => {
  return (
    <header className="top-header no-print">
      <div className="page-title-group">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-actions">
        {onOpenChangePassword && (
          <button
            type="button"
            onClick={onOpenChangePassword}
            className="btn btn-outline-brown btn-sm"
            title="Change Account Password"
          >
            <span>🔑</span> Change Password
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate('email-settings')}
          className="btn btn-outline-brown btn-sm"
          title="Configure Sender Email"
        >
          <span>⚙</span> Email Settings
        </button>
        <button
          type="button"
          onClick={() => onNavigate('qr')}
          className="btn btn-golden btn-sm"
        >
          <span>📷</span> Start QR Scan
        </button>
      </div>
    </header>
  );
};
