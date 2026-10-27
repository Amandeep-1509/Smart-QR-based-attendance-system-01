                          <strong>{rec.studentName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {rec.className} - {rec.division}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {rec.time}
                        </td>
                        <td>
                          <span className="badge badge-present">PRESENT</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📸</div>
                        Waiting for scans in this session...<br />
                        <small>Scanned students will appear here in real-time.</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Attendance Summary Modal */}
      {completeModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Attendance Completed &amp; Absentee Report</div>
              <button
                type="button"
                onClick={() => setCompleteModal((prev) => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                <span>✓</span>
                <div>
                  <strong>Session Completed:</strong>
                  <div>
                    {completeModal.absentCount} student(s) identified as absent.{' '}
                    {completeModal.notificationsCreated} notification records generated for students and parents.
                  </div>
                  {completeModal.isSmtpConfigured ? (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--soft-green)' }}>
                      📧 Live Dispatch: {completeModal.emailsDispatched} emails sent via SMTP server.
                    </div>
                  ) : (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--dark-brown)' }}>
                      ℹ SMTP credentials not configured. Absence notifications have been archived in the database log.
                    </div>
                  )}
                </div>
              </div>

              <h4 style={{ color: 'var(--primary-brown)', marginBottom: '10px', fontSize: '14px' }}>
                Absent Students:
              </h4>

              {completeModal.absentStudents.length > 0 ? (
                <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class</th>
                        <th>Parent Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completeModal.absentStudents.map((s) => (
                        <tr key={s.id}>
                          <td>{s.rollNo}</td>
                          <td><strong>{s.name}</strong></td>
                          <td>{s.className} - {s.division}</td>
                          <td>{s.parentEmail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--soft-green)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
                  🎉 100% Attendance Recorded! All students were present for this lecture.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCompleteModal((prev) => ({ ...prev, isOpen: false }));
                    onNavigate('notifications');
                  }}
                  className="btn btn-golden btn-sm"
                >
                  View Email Logs ✉
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModal((prev) => ({ ...prev, isOpen: false }))}
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
