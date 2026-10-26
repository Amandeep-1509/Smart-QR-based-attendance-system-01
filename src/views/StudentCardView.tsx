import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { StorageService } from '../storage';

interface StudentCardViewProps {
  studentId: number;
  onNavigate: (view: string) => void;
}

export const StudentCardView: React.FC<StudentCardViewProps> = ({ studentId, onNavigate }) => {
  const student = StorageService.getStudentById(studentId) || StorageService.getStudents()[0];
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (student) {
      QRCode.toDataURL(student.studentId, {
        width: 260,
        margin: 2,
        color: {
          dark: '#4A2E1B',
          light: '#FFFFFF',
        },
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.warn('QR gen error:', err));
    }
  }, [student]);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl || !student) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `QR_${student.studentId}_${student.rollNo}.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!student) {
    return (
      <div className="content-body">
        <div className="alert alert-danger">Student not found.</div>
        <button type="button" onClick={() => onNavigate('students')} className="btn btn-outline-brown">
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="content-body">
      <div className="no-print" style={{ maxWidth: '480px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => onNavigate('students')}
          className="btn btn-outline-brown btn-sm"
        >
          &larr; Back to Students
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleDownloadQR}
            className="btn btn-golden btn-sm"
          >
            <span>📥</span> Download QR PNG
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-brown btn-sm"
          >
            <span>🖨</span> Print Card
          </button>
        </div>
      </div>

      {/* Smart ID Card */}
      <div className="id-card-container">
        <div className="id-card-header">
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--golden)', fontWeight: 700 }}>
            COLLEGE OF ENGINEERING & TECHNOLOGY
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '3px' }}>
            STUDENT IDENTITY CARD
          </div>
        </div>

        <div className="id-card-body">
          {/* QR Code Frame */}
          <div className="id-qr-frame">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Student Attendance QR Code"
                width="180"
                height="180"
                style={{ display: 'block' }}
              />
            ) : (
              <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Generating QR...
              </div>
            )}
          </div>

          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary-brown)', marginTop: '8px' }}>
            {student.name}
          </div>

          <div style={{ fontSize: '13px', color: 'var(--golden-hover)', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '14px' }}>
            ID: {student.studentId}
          </div>

          <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderTop: '1px solid var(--beige-dark)', paddingTop: '12px' }}>
            <tbody>
              <tr>
                <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Roll No:</td>
                <td><strong>{student.rollNo}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Class & Div:</td>
                <td><strong>{student.className} - {student.division}</strong></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Student Email:</td>
                <td style={{ fontSize: '11px' }}>{student.studentEmail}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text-muted)', padding: '4px 0' }}>Parent Contact:</td>
                <td style={{ fontSize: '11px' }}>{student.parentName}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '18px', paddingTop: '10px', borderTop: '1px dashed var(--beige-dark)', fontSize: '11px', color: 'var(--text-muted)' }}>
            ⚡ Scan this QR Code at the classroom door to mark instant attendance.
          </div>
        </div>
      </div>
    </div>
  );
};
