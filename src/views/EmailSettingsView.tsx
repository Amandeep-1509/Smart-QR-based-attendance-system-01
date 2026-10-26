import React, { useState } from 'react';
import { StorageService } from '../storage';
import { EmailSetting } from '../types';

export const EmailSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<EmailSetting>(() => StorageService.getEmailSettings());
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.saveEmailSettings(settings);
    if (res.success) {
      setSaveSuccess('Email configuration saved permanently.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setIsTesting(true);
    const res = await StorageService.testEmailConnection(testEmail || settings.senderEmail, settings);
    setIsTesting(false);
    setTestResult(res);
    setSettings(StorageService.getEmailSettings());
  };

  return (
    <div className="content-body">
      {saveSuccess && (
        <div className="alert alert-success">
          <span>✓</span> <span>{saveSuccess}</span>
        </div>
      )}

      {testResult && (
        <div className={`alert ${testResult.success ? 'alert-success' : 'alert-danger'}`}>
          <span>{testResult.success ? '✓' : '⚠'}</span> <span>{testResult.message}</span>
        </div>
      )}

      {/* Header Status Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-brown)', fontSize: '18px', marginBottom: '4px' }}>
              Real SMTP Server Connection Status
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Live connection status for student and parent absence email notifications
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className={`status-pill ${settings.connectionStatus}`}>
              <span>●</span>
              <span>
                {settings.connectionStatus === 'CONNECTED'
                  ? 'Connected'
                  : settings.connectionStatus === 'FAILED'
                  ? 'Failed'
                  : 'Not Configured'}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Left Column: Form */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>⚙</span> Sender Account Configuration
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="senderEmail">
                  Sender Gmail Address *
                </label>
                <input
                  type="email"
                  id="senderEmail"
                  className="form-control"
                  placeholder="e.g. principal@college.edu or yourname@gmail.com"
                  required
                  value={settings.senderEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="senderName">
                  Sender Display Name *
                </label>
                <input
                  type="text"
                  id="senderName"
                  className="form-control"
                  placeholder="e.g. ARMIET Attendance Portal"
                  required
                  value={settings.senderName}
                  onChange={(e) => setSettings(prev => ({ ...prev, senderName: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="appPassword">
                  Google 16-Character App Password
                </label>
                <input
                  type="password"
                  id="appPassword"
                  className="form-control"
                  placeholder="•••• •••• •••• •••• (16 characters)"
                  value={settings.appPassword || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, appPassword: e.target.value }))}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Never exposed publicly. Kept secure on backend.
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpHost">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    id="smtpHost"
                    className="form-control"
                    value={settings.smtpHost || 'smtp.gmail.com'}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="smtpPort">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    id="smtpPort"
                    className="form-control"
                    value={settings.smtpPort || 587}
                    onChange={(e) => setSettings(prev => ({ ...prev, smtpPort: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-golden">
                  <span>💾</span> Save Settings
                </button>
              </div>
            </form>

            {/* Test Connection Box */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px dashed var(--beige-dark)' }}>
              <h4 style={{ color: 'var(--primary-brown)', fontSize: '14px', marginBottom: '10px' }}>
                🧪 Test Real SMTP Connection
              </h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Recipient email for test verification..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="btn btn-outline-brown btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isTesting ? 'Verifying...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Setup Instructions Guide */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>📖</span> How to get a Google App Password
            </h3>
          </div>
          <div className="card-body">
            <div className="info-step">
              <span className="step-num">1</span>
              <div>
                <strong>Enable 2-Step Verification:</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Open your Google Account &rarr; Security &rarr; Turn on 2-Step Verification.
                </p>
              </div>
            </div>

            <div className="info-step">
              <span className="step-num">2</span>
              <div>
                <strong>Search for App Passwords:</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  In the Security search bar, search for &ldquo;App Passwords&rdquo;.
                </p>
              </div>
            </div>

            <div className="info-step">
              <span className="step-num">3</span>
              <div>
                <strong>Generate Password:</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Enter app name &ldquo;Smart Attendance System&rdquo; and click Generate.
                </p>
              </div>
            </div>

            <div className="info-step">
              <span className="step-num">4</span>
              <div>
                <strong>Paste &amp; Save:</strong>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Copy the 16-character code into the Google App Password field on the left and click Save Settings.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '12px 16px', backgroundColor: 'var(--beige)', border: '1px solid var(--golden-border)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--dark-brown)' }}>
              <strong>Real Delivery:</strong> When configured, actual emails are dispatched to student and parent email addresses upon session completion.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
