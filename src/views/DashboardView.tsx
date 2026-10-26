import React, { useMemo } from 'react';
import { StorageService } from '../storage';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const students = StorageService.getStudents();
  const records = StorageService.getAttendanceRecords();
  const notifications = StorageService.getNotifications();
  const emailSettings = StorageService.getEmailSettings();
  const professors = StorageService.getProfessors();
  const lectures = StorageService.getLectures();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const todayRecords = useMemo(() => {
    return records.filter(r => r.date === todayStr);
  }, [records, todayStr]);

  const presentToday = useMemo(() => {
    return todayRecords.filter(r => r.status === 'PRESENT').length;
  }, [todayRecords]);

  const totalStudents = students.length;
  const absentToday = Math.max(0, totalStudents - presentToday);
  const attendancePercentage = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

  const recentScans = useMemo(() => {
    return records.slice(0, 5);
  }, [records]);

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, 5);
  }, [notifications]);

  // 7-day trend calculation from actual records
  const trendData = useMemo(() => {
    const days: { label: string; date: string; present: number; absent: number; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      const dayRecords = records.filter(r => r.date === dStr);
      const p = dayRecords.filter(r => r.status === 'PRESENT').length;
      const a = dayRecords.filter(r => r.status === 'ABSENT').length;

      days.push({
        label: dLabel,
        date: dStr,
        present: p,
        absent: a,
        total: p + a,
      });
    }
    return days;
  }, [records]);

  const maxVal = Math.max(
    1,
    ...trendData.map(d => Math.max(d.present, d.absent, d.total)),
    totalStudents
  );

  return (
    <div className="content-body">
      {/* Real Email Status Banner */}
      {emailSettings.connectionStatus === 'CONNECTED' ? (
        <div className="alert alert-success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>✓ Live SMTP Email Dispatch Active:</strong>{' '}
            <span>
              Real absence notifications will be sent from <code>{emailSettings.senderEmail}</code>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('email-settings')}
            className="btn btn-outline-brown btn-sm"
          >
            Email Settings
          </button>
        </div>
      ) : emailSettings.connectionStatus === 'FAILED' ? (
        <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>⚠ SMTP Authentication Failed:</strong>{' '}
            <span>{emailSettings.lastErrorMessage || 'Check Gmail / SMTP credentials in Email Settings.'}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('email-settings')}
            className="btn btn-red btn-sm"
          >
            Fix Credentials
          </button>
        </div>
      ) : (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>⚙ SMTP Not Yet Configured:</strong>{' '}
            <span>
              Configure your college Gmail or SMTP credentials in Email Settings to enable real automated absence delivery to students and parents.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('email-settings')}
            className="btn btn-golden btn-sm"
          >
            Configure SMTP
          </button>
        </div>
      )}

      {/* Prominent Actions Hero Banner */}
      <div className="action-banner">
        <div className="banner-text">
          <h2>Ready to Take Lecture Attendance?</h2>
          <p>
            Date: <strong>{formattedToday}</strong> &bull; Registered Professors: <strong>{professors.length}</strong> &bull; Scheduled Lectures: <strong>{lectures.length}</strong>
          </p>
        </div>
        <div className="banner-buttons">
          <button
            type="button"
            onClick={() => onNavigate('qr')}
            className="btn btn-golden"
          >
            <span>📷</span> [ START QR ATTENDANCE ]
          </button>
          <button
            type="button"
            onClick={() => onNavigate('manual')}
            className="btn btn-outline"
          >
            <span>📝</span> [ MANUAL ATTENDANCE ]
          </button>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box icon-blue">👥</div>
          <div className="metric-info">
            <h3>{totalStudents}</h3>
            <p>Total Registered Students</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box icon-green">✓</div>
          <div className="metric-info">
            <h3 style={{ color: 'var(--soft-green)' }}>{presentToday}</h3>
            <p>Present Today</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box icon-red">✗</div>
          <div className="metric-info">
            <h3 style={{ color: 'var(--soft-red)' }}>{absentToday}</h3>
            <p>Absent Today</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box icon-golden">📈</div>
          <div className="metric-info">
            <h3 style={{ color: 'var(--golden-hover)' }}>{attendancePercentage}%</h3>
            <p>Today&apos;s Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Empty State Onboarding Guidance */}
      {totalStudents === 0 && (
        <div className="card" style={{ border: '2px dashed var(--golden)', backgroundColor: 'var(--white)', padding: '24px', textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🎓</div>
          <h3 style={{ color: 'var(--primary-brown)', marginBottom: '8px' }}>Database Ready for Viva Demonstration</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 18px', fontSize: '13px' }}>
            No dummy or demo records exist. Add your students in <strong>Students Management</strong> to generate their official Smart QR ID cards and begin marking live attendance.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onNavigate('student-form')}
              className="btn btn-golden btn-sm"
            >
              + Register First Student
            </button>
            <button
              type="button"
              onClick={() => onNavigate('professors')}
              className="btn btn-outline-brown btn-sm"
            >
              Manage Professors
            </button>
            <button
              type="button"
              onClick={() => onNavigate('lectures')}
              className="btn btn-outline-brown btn-sm"
            >
              Schedule Lectures
            </button>
          </div>
        </div>
      )}

      {/* 7-Day Attendance Trend Chart */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span>📊</span> 7-Day Attendance History
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Daily distribution of logged present vs absent students
          </span>
        </div>
        <div className="card-body">
          <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '30px', position: 'relative' }}>
            {trendData.map((item, idx) => {
              const presentHeight = item.present > 0 ? Math.max(12, (item.present / maxVal) * 160) : 0;
              const absentHeight = item.absent > 0 ? Math.max(12, (item.absent / maxVal) * 160) : 0;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    <div
                      title={`Present: ${item.present}`}
                      style={{
                        width: '42%',
                        maxWidth: '34px',
                        height: `${presentHeight}px`,
                        backgroundColor: item.present > 0 ? 'var(--soft-green)' : 'var(--beige-dark)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        minHeight: '4px',
                      }}
                    >
                      {item.present > 0 && (
                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 700, color: 'var(--soft-green)' }}>
                          {item.present}
                        </span>
                      )}
                    </div>
                    <div
                      title={`Absent: ${item.absent}`}
                      style={{
                        width: '42%',
                        maxWidth: '34px',
                        height: `${absentHeight}px`,
                        backgroundColor: item.absent > 0 ? 'var(--soft-red)' : 'var(--beige-dark)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        minHeight: '4px',
                      }}
                    >
                      {item.absent > 0 && (
                        <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '11px', fontWeight: 700, color: 'var(--soft-red)' }}>
                          {item.absent}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', paddingTop: '10px', borderTop: '1px solid var(--beige)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--soft-green)', borderRadius: '2px' }}></div>
              <span>Present Records</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--soft-red)', borderRadius: '2px' }}></div>
              <span>Absent Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Live Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Scans */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>
              <span>📷</span> Recent Scans Log
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="btn btn-outline-brown btn-sm"
            >
              View Full Report
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.length > 0 ? (
                    recentScans.map(s => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.studentName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.studentId}</div>
                        </td>
                        <td>{s.rollNo}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.time}</td>
                        <td>
                          <span className={`badge ${s.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No attendance records logged yet today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>
              <span>✉</span> Absence Email Notifications
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="btn btn-outline-brown btn-sm"
            >
              View History
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map(n => (
                      <tr key={n.id}>
                        <td>
                          <strong>{n.studentName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.recipientEmail}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'var(--beige-dark)', color: 'var(--primary-brown)' }}>
                            {n.recipientType}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{n.time}</td>
                        <td>
                          <span className={`badge ${n.status === 'DISPATCHED' ? 'badge-sent' : n.status === 'FAILED' ? 'badge-failed' : 'badge-demo'}`}>
                            {n.status === 'SMTP_UNCONFIGURED' ? 'Unconfigured' : n.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No email alerts dispatched yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
