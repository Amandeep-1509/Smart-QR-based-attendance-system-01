import React, { useState, useMemo } from 'react';
import { StorageService } from '../storage';
import { Student } from '../types';
import QRCode from 'qrcode';

interface StudentsViewProps {
  onNavigate: (view: string, studentId?: number) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());

  const refreshStudents = () => {
    setStudents(StorageService.getStudents());
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.division.toLowerCase().includes(q) ||
        s.studentEmail.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const handleDelete = async (id: number) => {
    const student = students.find(s => s.id === id);
    const res = await StorageService.deleteStudent(id);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Student "${student?.name || id}" removed successfully.`,
      });
      setDeleteConfirmId(null);
      refreshStudents();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDownloadQR = async (student: Student) => {
    try {
      const dataUrl = await QRCode.toDataURL(student.studentId, {
        width: 320,
        margin: 2,
        color: {
          dark: '#4A2E1B',
          light: '#FFFFFF',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `QR_${student.studentId}_${student.rollNo}.png`;
      link.click();
    } catch (err) {
      console.warn('Failed to generate QR code download:', err);
    }
  };

  return (
    <div className="content-body">
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠'}</span> <span>{feedback.message}</span>
        </div>
      )}

      {/* Toolbar: Search & Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by name, roll no, class or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => onNavigate('student-form')}
            className="btn btn-golden"
          >
            <span>+</span> Add New Student
          </button>
        </div>
      </div>

      {/* Students List Table Card */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span>🎓</span> Registered Students (<span>{filteredStudents.length}</span>)
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Each student receives an auto-generated unique QR encoded with their Student ID
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Class & Div</th>
                  <th>Student Email</th>
                  <th>Parent Contact</th>
                  <th>QR Code</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <code style={{ backgroundColor: 'var(--beige)', padding: '3px 6px', borderRadius: '4px', fontWeight: 700, color: 'var(--primary-brown)' }}>
                          {student.studentId}
                        </code>
                      </td>
                      <td><strong>{student.rollNo}</strong></td>
                      <td>
                        <strong>{student.name}</strong>
                        {student.studentMobile && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            📱 {student.studentMobile}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--beige-dark)', color: 'var(--primary-brown)' }}>
                          {student.className} - {student.division}
                        </span>
                      </td>
                      <td>
                        <a href={`mailto:${student.studentEmail}`} style={{ color: 'var(--primary-brown)', fontSize: '13px' }}>
                          {student.studentEmail}
                        </a>
                      </td>
                      <td>
                        <div>{student.parentName}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{student.parentEmail}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onNavigate('student-card', student.id)}
                            className="btn btn-outline-brown btn-sm"
                            title="View & Print ID Card with QR"
                          >
                            <span>🪪</span> Card
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadQR(student)}
                            className="btn btn-golden btn-sm"
                            title="Download QR Code PNG"
                          >
                            <span>📥</span> QR
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onNavigate('student-form', student.id)}
                            className="btn btn-outline-brown btn-sm"
                            title="Edit Student"
                          >
                            ✏ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(student.id)}
                            className="btn btn-red btn-sm"
                            title="Delete Student"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      {searchQuery
                        ? 'No students found matching your search.'
                        : 'No students enrolled yet. Click "+ Add New Student" above to register student records.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Confirm Student Deletion</div>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Are you sure you want to remove student{' '}
                <strong>{students.find(s => s.id === deleteConfirmId)?.name}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn btn-outline-brown btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="btn btn-red btn-sm"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
