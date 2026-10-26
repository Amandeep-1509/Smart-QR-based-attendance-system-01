import React, { useState } from 'react';
import { StorageService } from '../storage';
import { EmailNotification } from '../types';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<EmailNotification[]>(() =>
    StorageService.getNotifications()
  );
  const [previewNotification, setPreviewNotification] = useState<EmailNotification | null>(null);

  const emailSettings = StorageService.getEmailSettings();
  const isSmtpConfigured = emailSettings.connectionStatus === 'CONNECTED';

  return (
    <div className="content-body">
      {/* Information Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--white), var(--cream))', borderLeft: '5px solid var(--golden)' }}>
        <div className="card-body" style={{ padding: '18px 24px' }}>
          <h4 style={{ color: 'var(--primary-brown)', marginBottom: '6px', fontSize: '15px' }}>
            📧 Dual Student &amp; Parent Automated Notification Log
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 0 }}>
            When an attendance session concludes, the system automatically detects absent students and formats dual notifications:
            one for the <strong>student</strong> and one for the <strong>parent/guardian</strong>.
            {isSmtpConfigured ? (
              <span style={{ color: 'var(--soft-green)', fontWeight: 600, display: 'block', marginTop: '6px' }}>
                ✓ Live SMTP connection active: Real emails are dispatched through {emailSettings.senderEmail}.
              </span>
            ) : (
              <span style={{ color: 'var(--dark-brown)', display: 'block', marginTop: '6px' }}>
                ℹ Configure Gmail SMTP credentials in Admin Email Settings to deliver real live emails to parents.
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Notification History Table */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span>✉</span> Dispatched Email Logs (<span>{notifications.length}</span>)
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Duplicate prevention active: No repeated emails for same student/date/session
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Student</th>
                  <th>Recipient Email</th>
                  <th>Recipient Type</th>
                  <th>Subject</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <tr key={notif.id}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <div>{notif.date}</div>
                        <div>{notif.time}</div>
                      </td>
                      <td>
                        <strong>{notif.studentName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{notif.studentId}</div>
                      </td>
                      <td>
                        <a href={`mailto:${notif.recipientEmail}`} style={{ color: 'var(--primary-brown)', fontSize: '13px' }}>
                          {notif.recipientEmail}
                        </a>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--beige-dark)', color: 'var(--primary-brown)' }}>
                          {notif.recipientType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notif.subject}
                      </td>
                      <td>{notif.classSession}</td>
                      <td>
                        <span className={`badge ${notif.status === 'DISPATCHED' ? 'badge-sent' : notif.status === 'FAILED' ? 'badge-failed' : 'badge-demo'}`}>
                          {notif.status === 'SMTP_UNCONFIGURED' ? 'Archived (No SMTP)' : notif.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewNotification(notif)}
                          className="btn btn-outline-brown btn-sm"
                        >
                          View Preview
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No notifications dispatched yet. Complete an attendance session to notify absentees!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Body Preview Modal */}
      {previewNotification && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                Email Details ({previewNotification.recipientType})
              </div>
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <table style={{ width: '100%', fontSize: '13px', marginBottom: '14px' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', width: '90px', padding: '4px 0' }}>Recipient:</td>
                    <td><strong>{previewNotification.recipientEmail}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Student:</td>
                    <td>{previewNotification.studentName} ({previewNotification.studentId})</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Subject:</td>
                    <td><strong>{previewNotification.subject}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Dispatched:</td>
                    <td>{previewNotification.date} at {previewNotification.time}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Delivery Status:</td>
                    <td>
                      <span className={`badge ${previewNotification.status === 'DISPATCHED' ? 'badge-sent' : previewNotification.status === 'FAILED' ? 'badge-failed' : 'badge-demo'}`}>
                        {previewNotification.status}
                      </span>
                      {previewNotification.errorDetails && (
                        <div style={{ fontSize: '11px', color: 'var(--soft-red)', marginTop: '4px' }}>
                          Error: {previewNotification.errorDetails}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--primary-brown)', marginBottom: '4px' }}>
                Message Body:
              </div>
              <div className="preview-box">
                {previewNotification.message}
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPreviewNotification(null)}
                  className="btn btn-outline-brown btn-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
