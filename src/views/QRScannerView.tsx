import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { StorageService } from '../storage';
import { Student, AttendanceRecord } from '../types';

interface QRScannerViewProps {
  onNavigate: (view: string) => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onNavigate }) => {
  const [classSession, setClassSession] = useState('Regular');
  const [selectedLectureId, setSelectedLectureId] = useState<number | undefined>(undefined);
  const [manualInput, setManualInput] = useState('');
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('auto');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [scanStatus, setScanStatus] = useState<{
    type: 'standby' | 'success' | 'duplicate' | 'error' | 'processing';
    title: string;
    subtitle: string;
    details: string;
  }>({
    type: 'standby',
    title: 'Scanner Ready',
    subtitle: 'Position student QR code within camera boundary or simulate below.',
    details: 'Zero-click automatic recognition: Attendance marks automatically upon detection!',
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

  // Set default lecture if none selected
  useEffect(() => {
    if (lectures.length > 0 && selectedLectureId === undefined) {
      setSelectedLectureId(lectures[0].id);
    }
  }, [lectures, selectedLectureId]);

  const activeLecture = lectures.find((l) => l.id === selectedLectureId);

  // Today's live records for this session
  const [liveSessionRecords, setLiveSessionRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const filtered = allRecords.filter(
      (r) => r.date === todayStr && r.classSession === classSession && r.status === 'PRESENT'
    );
    setLiveSessionRecords(filtered);
  }, [allRecords, todayStr, classSession]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const lastScannedIdRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 2500;

  // Process student ID and mark attendance automatically
  const processStudentId = useCallback(
    async (rawId: string) => {
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
        details: 'Checking student record and saving attendance to database...',
      });

      const result = await StorageService.markQRAttendance(cleanId, classSession, selectedLectureId);

      if (result.success && !result.alreadyMarked) {
        StorageService.playBeep(true);
        setScanStatus({
          type: 'success',
          title: 'ATTENDANCE MARKED ✓',
          subtitle: `${result.studentName} (Roll No: ${result.rollNo})`,
          details: `Status: PRESENT ✓ | Recorded Time: ${result.time} | Ready for next scan...`,
        });

        const updated = StorageService.getAttendanceRecords().filter(
          (r) => r.date === todayStr && r.classSession === classSession && r.status === 'PRESENT'
        );
        setLiveSessionRecords(updated);
      } else if (result.alreadyMarked) {
        StorageService.playBeep(false);
        setScanStatus({
          type: 'duplicate',
          title: 'ALREADY MARKED ✓',
          subtitle: `${result.studentName} (Roll No: ${result.rollNo})`,
          details: `Student was already marked at ${result.time} for this lecture. Duplicate ignored.`,
        });
      } else {
        StorageService.playBeep(false);
        setScanStatus({
          type: 'error',
          title: 'INVALID QR CODE ✗',
          subtitle: result.message,
          details: 'Student ID not found in registered roster. Verify student enrollment.',
        });
      }

      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1500);
    },
    [classSession, selectedLectureId, todayStr]
  );

  // Probe available cameras on mount
  useEffect(() => {
    const detectCameras = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        return;
      }
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setAvailableCameras(
            devices.map((d, index) => ({
              id: d.id,
              label: d.label || `Camera ${index + 1}`,
            }))
          );
        }
      } catch (err) {
        // Devices might not be labeled before permission grant; this is normal
      }
    };
    detectCameras();
  }, []);

  // Safe camera startup with graceful constraints fallback
  const startCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    try {
      // 1. Check for Secure Context (HTTPS or localhost)
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '[::1]';
      const isHttps = window.location.protocol === 'https:';

      if (!isLocalhost && !isHttps && !window.isSecureContext) {
        throw new Error(
          'SECURE_CONTEXT_REQUIRED: Browsers require HTTPS or localhost to access camera hardware. If running over plain HTTP on an external IP, camera permissions are blocked by browser security.'
        );
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'BROWSER_UNSUPPORTED: Your browser does not support the MediaDevices WebRTC API. Please use Google Chrome, Microsoft Edge, Safari, or Firefox.'
        );
      }

      // 2. Request user media permission explicitly
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        testStream.getTracks().forEach((t) => t.stop());
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
          throw new Error(
            'PERMISSION_DENIED: Camera permission was denied. Please click the camera/lock icon in your browser address bar, set Camera to "Allow", and try again.'
          );
        } else if (permErr.name === 'NotFoundError' || permErr.name === 'DevicesNotFoundError') {
          throw new Error(
            'NO_CAMERA_FOUND: No camera hardware was detected on this computer. Connect a webcam or test with the Viva Simulation buttons below.'
          );
        } else if (permErr.name === 'NotReadableError' || permErr.name === 'TrackStartError') {
          throw new Error(
            'CAMERA_IN_USE: The camera is currently locked by another application (e.g. Zoom, Google Meet, Teams, or another browser tab). Please close other apps using the webcam and retry.'
          );
        }
        throw permErr;
      }

      // 3. Refresh camera devices list with official labels now that permission is granted
      try {
        const freshDevices = await Html5Qrcode.getCameras();
        if (freshDevices && freshDevices.length > 0) {
          setAvailableCameras(
            freshDevices.map((d, index) => ({
              id: d.id,
              label: d.label || `Camera ${index + 1}`,
            }))
          );
        }
      } catch (devErr) {
        // Proceed even if device list query fails
      }

      // 4. Clean up any existing Html5Qrcode instance
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.warn('Error clearing previous scanner instance:', e);
        }
      }

      // Ensure the scanner host exists and is visible before Html5Qrcode initializes.
      const scannerElement = document.getElementById('qr-reader-container');
      if (!scannerElement) {
        throw new Error('SCANNER_ELEMENT_MISSING: QR scanner container was not found. Please reload the page and try again.');
      }
      scannerElement.style.display = 'block';
      scannerElement.style.minHeight = '300px';

      const scannerInstance = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = scannerInstance;

      // 5. Build camera config with fallback
      // On laptops, facingMode 'environment' fails with OverconstrainedError because only a user webcam exists.
      // We start with selected camera ID if specified, or ideal facingMode, falling back automatically.
      const scanConfig = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const handleScanSuccess = (decodedText: string) => {
        processStudentId(decodedText);
      };

      let started = false;

      // Strategy A: Specific device ID chosen by user
      if (selectedCameraId && selectedCameraId !== 'auto') {
        try {
          await scannerInstance.start(
            selectedCameraId,
            scanConfig,
            handleScanSuccess,
            () => {}
          );
          started = true;
        } catch (specErr) {
          console.warn('Failed starting specific camera ID, falling back to auto:', specErr);
        }
      }

      // Strategy B: Facing mode with ideal constraints
      if (!started) {
        try {
          await scannerInstance.start(
            { facingMode: { ideal: facingMode } },
            scanConfig,
            handleScanSuccess,
            () => {}
          );
          started = true;
        } catch (idealErr) {
          console.warn('Ideal facing mode failed, retrying with default user camera:', idealErr);
        }
      }

      // Strategy C: Generic user camera fallback (prevents OverconstrainedError on PC laptops)
      if (!started) {
        await scannerInstance.start(
          { facingMode: 'user' },
          scanConfig,
          handleScanSuccess,
          () => {}
        );
        started = true;
      }

      setCameraActive(true);
      setCameraError(null);
    } catch (err: unknown) {
      console.error('Camera startup error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);

      if (errMsg.includes('SECURE_CONTEXT_REQUIRED')) {
        setCameraError(
          '🔒 Camera requires HTTPS or localhost. Modern browsers block camera access on unencrypted HTTP connections. Use the Viva Simulation mode below to test scanning.'
        );
      } else if (errMsg.includes('PERMISSION_DENIED')) {
        setCameraError(
          '🚫 Camera access blocked. Click the lock/camera icon in your browser URL bar, grant camera permission, and click "Start Camera".'
        );
      } else if (errMsg.includes('NO_CAMERA_FOUND')) {
        setCameraError(
          '📷 No webcam hardware detected on this device. Connect a camera or use the Viva Simulation buttons below.'
        );
      } else if (errMsg.includes('CAMERA_IN_USE')) {
        setCameraError(
          '⚠️ Webcam is currently in use by another application (e.g. Zoom, Google Meet). Close other video apps and retry.'
        );
      } else {
        setCameraError(`Camera Error: ${errMsg}. You can use the Viva Simulation button below to test without a physical camera.`);
      }
      setCameraActive(false);
      // Release any partially initialized scanner after a failed startup.
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (cleanupError) {
          console.warn('Scanner cleanup after startup failure:', cleanupError);
        } finally {
          html5QrCodeRef.current = null;
        }
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Safe camera stop
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Camera stop error:', err);
      }
    }
    setCameraActive(false);
  };

  // Cleanup camera tracks on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
              html5QrCodeRef.current?.clear();
            });
          }
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  // Handle camera switch (e.g. Front vs Rear or specific camera)
  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    if (cameraActive) {
      await stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

  const handleFacingModeToggle = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setSelectedCameraId('auto');
    if (cameraActive) {
      await stopCamera();
      setTimeout(() => {
        startCamera();
      }, 300);
    }
  };

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
                {lectures.map((l) => (
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
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--beige)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                }}
              >
                👨‍🏫 Faculty: <strong>{activeLecture.professorName}</strong> &bull; Grace Period:{' '}
                <strong>{activeLecture.gracePeriodMinutes || 10} Mins</strong>
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
        {/* Left Column: Camera Box & Controls */}
        <div className="scanner-box">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3
              style={{
                color: 'var(--primary-brown)',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
              }}
            >
              <span>📷</span> Live QR Attendance Scanner
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Front / Rear Toggle */}
              <button
                type="button"
                onClick={handleFacingModeToggle}
                className="btn btn-outline-brown btn-sm"
                title="Toggle Front/Rear Camera"
                style={{ fontSize: '11px', padding: '5px 9px' }}
              >
                🔄 {facingMode === 'environment' ? 'Rear (Back)' : 'Front (Webcam)'}
              </button>

              {/* Hardware Camera Selector (if multiple available) */}
              {availableCameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="form-control"
                  style={{ width: '150px', padding: '4px 8px', fontSize: '11px' }}
                >
                  <option value="auto">Auto Select</option>
                  {availableCameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Start / Stop Toggle */}
              <button
                type="button"
                disabled={isStartingCamera}
                onClick={cameraActive ? stopCamera : startCamera}
                className={`btn btn-sm ${cameraActive ? 'btn-red' : 'btn-golden'}`}
              >
                {isStartingCamera ? 'Connecting...' : cameraActive ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </div>

          {cameraError && (
            <div
              className="alert alert-warning"
              style={{
                fontSize: '13px',
                marginBottom: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '16px' }}>⚠</span>
              <div style={{ flex: 1 }}>{cameraError}</div>
            </div>
          )}

          {/* Dedicated Scanner Viewport */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#24160E',
              border: cameraActive ? '2px solid var(--soft-green)' : '2px dashed var(--golden)',
              minHeight: '300px',
            }}
          >
            {/* The actual HTML5 QR Code container (MUST remain unmutated by React) */}
            <div
              id="qr-reader-container"
              style={{
                width: '100%',
                minHeight: '300px',
                display: 'block',
                position: 'relative',
                zIndex: 1,
              }}
            />

            {/* Overlay placeholder when camera is not running */}
            {!cameraActive && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  color: 'white',
                  backgroundColor: '#24160E',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>
                  Camera is Currently Inactive
                </div>
                <div style={{ fontSize: '13px', color: '#EBDDCF', maxWidth: '360px', marginBottom: '16px' }}>
                  Click &ldquo;Start Camera&rdquo; above to enable continuous QR scanning. On mobile, toggle Front/Rear as needed.
                </div>
                <button
                  type="button"
                  disabled={isStartingCamera}
                  onClick={startCamera}
                  className="btn btn-golden btn-sm"
                  style={{ padding: '8px 20px' }}
                >
                  {isStartingCamera ? 'Connecting...' : '▶ Start Camera Scanner'}
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Real-Time Feedback Card */}
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
            <label
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--primary-brown)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              💻 Viva Demonstration Simulation (Instant test without camera):
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
                Scan Code
              </button>
            </div>

            {/* Quick 1-click test chips for registered students */}
            {students.length > 0 && (
              <>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Click registered student to test immediate automatic scan:
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
