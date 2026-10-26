import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { StorageService } from '../storage';
import { Student, AttendanceRecord, Lecture } from '../types';

interface QRScannerViewProps {
  onNavigate: (view: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onNavigate }) => {
  const [classSession, setClassSession] = useState('Regular');
  const [selectedLectureId, setSelectedLectureId] = useState<number | undefined>(undefined);
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanStatus, setScanStatus] = useState<{
    type: 'standby' | 'success' | 'duplicate' | 'error' | 'processing';
    title: string;
    subtitle: string;
    details: string;
  }>({
    type: 'standby',
    title: 'Scanner Ready',
    subtitle: 'Position student QR code within camera boundary or simulate below.',
    details: 'No submit button needed: Attendance marks automatically upon detection!',
  });

  const [completeModal, setCompleteModal] = useState<{
    isOpen: boolean;
    absentCount: number;
    notificationsCreated: number;
    emailsDispatched: number;
    emailsFailed: number;
    isSmtpConfigured: boolean;
    absentStudents: Student[];
  }>({
    isOpen: false,
    absentCount: 0,
    notificationsCreated: 0,
    emailsDispatched: 0,
    emailsFailed: 0,
    isSmtpConfigured: false,
    absentStudents: [],
  });

  const students = StorageService.getStudents();
  const lectures = StorageService.getLectures();
  const allRecords = StorageService.getAttendanceRecords();
  const todayStr = new Date().toISOString().split('T')[0];

  // Set default lecture
  useEffect(() => {
    if (lectures.length > 0 && selectedLectureId === undefined) {
      setSelectedLectureId(lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

  const activeLecture = lectures.find(l => l.id === selectedLectureId);

  // Today's live records for this session
  const [liveSessionRecords, setLiveSessionRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const filtered = allRecords.filter(
      r => r.date === todayStr && r.classSession === classSession && r.status === 'PRESENT'
    );
    setLiveSessionRecords(filtered);
  }, [allRecords, todayStr, classSession]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedIdRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 2500;

  const processStudentId = useCallback(async (rawId: string) => {
    const cleanId = rawId.trim().toUpperCase();
    if (!cleanId) return;

    const now = Date.now();
    if (isProcessingRef.current) return;
    if (cleanId === lastScannedIdRef.current && now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) {
      return;
    }

    isProcessingRef.current = true;
    lastScannedIdRef.current = cleanId;
    lastScanTimeRef.current = now;

    setScanStatus({
      type: 'processing',
      title: 'Processing QR Code...',
      subtitle: `Reading code: ${cleanId}`,
      details: 'Checking database and recording attendance...',
    });

    const result = await StorageService.markQRAttendance(cleanId, classSession, selectedLectureId);

    if (result.success && !result.alreadyMarked) {
      StorageService.playBeep(true);
      setScanStatus({
        type: 'success',
        title: 'QR DETECTED ✓',
        subtitle: `${result.studentName} (Roll No: ${result.rollNo})`,
        details: `Attendance: PRESENT ✓ | Time: ${result.time} | Ready for next scan...`,
      });

      const updated = StorageService.getAttendanceRecords().filter(
        r => r.date === todayStr && r.classSession === classSession && r.status === 'PRESENT'
      );
      setLiveSessionRecords(updated);
    } else if (result.alreadyMarked) {
      StorageService.playBeep(false);
      setScanStatus({
        type: 'duplicate',
        title: 'ALREADY MARKED ✓',
        subtitle: `${result.studentName} (Roll No: ${result.rollNo})`,
        details: `Already marked at ${result.time} for this lecture. Duplicate ignored.`,
      });
    } else {
      StorageService.playBeep(false);
      setScanStatus({
        type: 'error',
        title: 'INVALID QR CODE ✗',
        subtitle: result.message,
        details: 'Check if student is registered in the Students database.',
      });
    }

    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1500);
  }, [classSession, selectedLectureId, todayStr]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader');
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processStudentId(decodedText);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCameraError(`Camera unavailable (${errMsg}). You can simulate scans below using registered Student IDs.`);
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleCompleteAttendance = async () => {
    const result = await StorageService.completeAttendanceAndNotify(classSession, 'ALL', selectedLectureId);
    setCompleteModal({
      isOpen: true,
      absentCount: result.absentCount,
      notificationsCreated: result.notificationsGenerated,
      emailsDispatched: result.emailsDispatched,
      emailsFailed: result.emailsFailed,
      isSmtpConfigured: result.isSmtpConfigured,
      absentStudents: result.absentStudents,
    });
  };

  return (
    <div className="content-body">
      {/* Session & Lecture Selector Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="lectureSelect" style={{ fontWeight: 700, color: 'var(--primary-brown)', fontSize: '14px' }}>
                Active Lecture:
              </label>
              <select
                id="lectureSelect"
                className="form-control"
                style={{ width: '220px', padding: '6px 12px' }}
                value={selectedLectureId || ''}
                onChange={(e) => setSelectedLectureId(Number(e.target.value))}
              >
                {lectures.length === 0 && <option value="">No Lectures Created</option>}
                {lectures.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.subjectCode} - {l.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="classSessionSelect" style={{ fontWeight: 700, color: 'var(--primary-brown)', fontSize: '14px' }}>
                Session:
              </label>
              <select
                id="classSessionSelect"
                className="form-control"
                style={{ width: '160px', padding: '6px 12px' }}
                value={classSession}
                onChange={(e) => setClassSession(e.target.value)}
              >
                <option value="Regular">Regular Session</option>
                <option value="Morning Session">Morning Session</option>
                <option value="Afternoon Session">Afternoon Session</option>
                <option value="Lab Practical">Lab Practical</option>
              </select>
            </div>

            {activeLecture && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--beige)', padding: '5px 10px', borderRadius: '4px' }}>
                👨‍🏫 Faculty: <strong>{activeLecture.professorName}</strong> &bull; Grace Period: <strong>{activeLecture.gracePeriodMinutes || 10} Mins</strong>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-golden"
            onClick={handleCompleteAttendance}
          >
            <span>✉</span> Attendance Completed &rarr; Notify Absentees
          </button>
        </div>
      </div>

      {/* Two Column Scanner Layout */}
      <div className="scanner-layout">
        {/* Left Column: Camera Box & Feedback */}
        <div className="scanner-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ color: 'var(--primary-brown)', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📷</span> Active Scanner Area
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--golden-hover)', fontWeight: 600 }}>
                {cameraActive ? '⚡ Live Camera Active' : 'Camera Standby'}
              </span>
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className={`btn btn-sm ${cameraActive ? 'btn-red' : 'btn-golden'}`}
              >
                {cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="alert alert-warning" style={{ fontSize: '12px', marginBottom: '12px', padding: '10px 14px' }}>
              <span>ℹ</span> {cameraError}
            </div>
          )}

          <div
            id="reader"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--golden-light)',
              minHeight: '280px',
              backgroundColor: '#24160E',
            }}
          >
            {!cameraActive && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '42px', marginBottom: '10px' }}>📹</div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'white' }}>Webcam is currently idle</div>
                <div style={{ fontSize: '12px', color: '#EBDDCF', marginTop: '4px' }}>
                  Click &ldquo;Start Camera&rdquo; above to scan student ID cards, or use Viva Demo Mode below.
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Feedback Card */}
          <div
            className={`scanner-status-card ${
              scanStatus.type === 'success'
                ? 'status-success'
                : scanStatus.type === 'duplicate'
                ? 'status-duplicate'
                : scanStatus.type === 'error'
                ? 'status-error'
                : 'status-standby'
            }`}
          >
            <div style={{ fontSize: '28px' }}>
              {scanStatus.type === 'success'
                ? '✓'
                : scanStatus.type === 'duplicate'
                ? '⚡'
                : scanStatus.type === 'error'
                ? '✗'
                : '🎯'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>{scanStatus.title}</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{scanStatus.subtitle}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>{scanStatus.details}</div>
            </div>
          </div>

          {/* PC Viva Testing Simulation Bar */}
          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed var(--beige-dark)' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-brown)', display: 'block', marginBottom: '6px' }}>
              💻 Viva Simulation (Test scan without camera):
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                className="form-control"
                style={{ padding: '7px 12px', fontSize: '13px' }}
                placeholder="Enter Student ID (e.g. STU001)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    processStudentId(manualInput);
                    setManualInput('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  processStudentId(manualInput);
                  setManualInput('');
                }}
                className="btn btn-outline-brown btn-sm"
                style={{ whiteSpace: 'nowrap' }}
              >
                Scan ID
              </button>
            </div>

            {/* Quick 1-click test chips for registered students */}
            {students.length > 0 && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Click to mark registered student:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {students.map((stu) => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => processStudentId(stu.studentId)}
                      className="chip"
                      title={`Simulate scan for ${stu.name} (${stu.studentId})`}
                    >
                      ⚡ {stu.studentId} - {stu.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Live Feed */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>
              <span>📋</span> Scanned Feed ({liveSessionRecords.length})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--soft-green)', fontWeight: 600 }}>
              Live &bull; Today
            </span>
          </div>

          <div className="card-body" style={{ padding: 0, maxHeight: '520px', overflowY: 'auto' }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveSessionRecords.length > 0 ? (
                    liveSessionRecords.map((rec) => (
                      <tr key={rec.id}>
                        <td>
                          <strong>{rec.rollNo}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rec.studentId}</div>
                        </td>
                        <td>
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
                onClick={() => setCompleteModal(prev => ({ ...prev, isOpen: false }))}
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
                    {completeModal.absentCount} student(s) identified as absent. {completeModal.notificationsCreated} notification records generated for students and parents.
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
                    setCompleteModal(prev => ({ ...prev, isOpen: false }));
                    onNavigate('notifications');
                  }}
                  className="btn btn-golden btn-sm"
                >
                  View Email Logs ✉
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModal(prev => ({ ...prev, isOpen: false }))}
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
