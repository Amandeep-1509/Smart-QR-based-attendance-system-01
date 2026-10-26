import React, { useState } from 'react';
import { StorageService } from '../storage';

interface StudentFormViewProps {
  studentId?: number;
  onNavigate: (view: string) => void;
}

export const StudentFormView: React.FC<StudentFormViewProps> = ({ studentId, onNavigate }) => {
  const existingStudent = studentId ? StorageService.getStudentById(studentId) : undefined;
  const isEdit = !!existingStudent;

  const [formData, setFormData] = useState({
    studentId: existingStudent?.studentId || '',
    rollNo: existingStudent?.rollNo || '',
    name: existingStudent?.name || '',
    className: existingStudent?.className || 'CSE',
    division: existingStudent?.division || 'A',
    studentEmail: existingStudent?.studentEmail || '',
    studentMobile: existingStudent?.studentMobile || '',
    parentName: existingStudent?.parentName || '',
    parentEmail: existingStudent?.parentEmail || '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.studentId.trim()) {
      setErrorMessage('Student ID is required.');
      return;
    }
    if (!formData.rollNo.trim()) {
      setErrorMessage('Roll Number is required.');
      return;
    }
    if (!formData.name.trim()) {
      setErrorMessage('Student Name is required.');
      return;
    }
    if (!formData.studentEmail.trim() || !formData.studentEmail.includes('@')) {
      setErrorMessage('Valid Student Email is required for automated absentee notices.');
      return;
    }
    if (!formData.parentName.trim()) {
      setErrorMessage('Parent/Guardian Name is required.');
      return;
    }
    if (!formData.parentEmail.trim() || !formData.parentEmail.includes('@')) {
      setErrorMessage('Valid Parent Email is required for absentee alerts.');
      return;
    }

    setLoading(true);
    const res = await StorageService.saveStudent({
      ...(isEdit ? { id: studentId } : {}),
      studentId: formData.studentId,
      rollNo: formData.rollNo,
      name: formData.name,
      className: formData.className,
      division: formData.division,
      studentEmail: formData.studentEmail,
      studentMobile: formData.studentMobile,
      parentName: formData.parentName,
      parentEmail: formData.parentEmail,
    });
    setLoading(false);

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    onNavigate('students');
  };

  return (
    <div className="content-body">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {errorMessage && (
          <div className="alert alert-danger">
            <span>⚠</span> <span>{errorMessage}</span>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3>
              <span>{isEdit ? '✏ Edit Student' : '➕ New Student Registration'}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="btn btn-outline-brown btn-sm"
            >
              &larr; Back to List
            </button>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Section 1: Academic Info */}
              <h4 style={{ color: 'var(--primary-brown)', marginBottom: '14px', fontSize: '15px', borderBottom: '2px solid var(--beige)', paddingBottom: '6px' }}>
                1. Academic Identification
              </h4>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="studentId">
                    Unique Student ID * (Encoded in QR Code)
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    className="form-control"
                    placeholder="e.g. STU101"
                    required
                    readOnly={isEdit}
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Must be unique per student. Encoded into their printable attendance card.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="rollNo">
                    College Roll Number *
                  </label>
                  <input
                    type="text"
                    id="rollNo"
                    className="form-control"
                    placeholder="e.g. 101"
                    required
                    value={formData.rollNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="e.g. Rajesh Kumar"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="className">
                    Class / Branch *
                  </label>
                  <input
                    type="text"
                    id="className"
                    className="form-control"
                    placeholder="e.g. CSE, IT, MECH"
                    required
                    value={formData.className}
                    onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="division">
                    Division / Section *
                  </label>
                  <input
                    type="text"
                    id="division"
                    className="form-control"
                    placeholder="e.g. A"
                    required
                    value={formData.division}
                    onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                  />
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <h4 style={{ color: 'var(--primary-brown)', margin: '24px 0 14px', fontSize: '15px', borderBottom: '2px solid var(--beige)', paddingBottom: '6px' }}>
                2. Notification &amp; Contact Information
              </h4>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="studentEmail">
                    Student Email Address * (For Absence Notification)
                  </label>
                  <input
                    type="email"
                    id="studentEmail"
                    className="form-control"
                    placeholder="student@college.edu"
                    required
                    value={formData.studentEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="studentMobile">
                    Student Mobile (Optional)
                  </label>
                  <input
                    type="text"
                    id="studentMobile"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={formData.studentMobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentMobile: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="parentName">
                    Parent / Guardian Name *
                  </label>
                  <input
                    type="text"
                    id="parentName"
                    className="form-control"
                    placeholder="e.g. Suresh Kumar"
                    required
                    value={formData.parentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="parentEmail">
                    Parent Email Address * (For Absence Notification)
                  </label>
                  <input
                    type="email"
                    id="parentEmail"
                    className="form-control"
                    placeholder="parent@example.com"
                    required
                    value={formData.parentEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('students')}
                  className="btn btn-outline-brown"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-golden">
                  <span>💾</span> {loading ? 'Saving...' : isEdit ? 'Update Student Details' : 'Register Student & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
