import React, { useState } from 'react';
import { StorageService } from '../storage';
import { Professor } from '../types';

export const ProfessorsView: React.FC = () => {
  const [professors, setProfessors] = useState<Professor[]>(() => StorageService.getProfessors());
  const [editingProf, setEditingProf] = useState<Partial<Professor> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const refreshList = () => {
    setProfessors(StorageService.getProfessors());
  };

  const handleOpenAdd = () => {
    setEditingProf({
      name: '',
      facultyId: `FAC${String(professors.length + 1).padStart(3, '0')}`,
      designation: 'Assistant Professor',
      department: 'Computer Science & Engineering',
      email: '',
      mobile: '',
    });
  };

  const handleOpenEdit = (prof: Professor) => {
    setEditingProf({ ...prof });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProf || !editingProf.name?.trim()) {
      setFeedback({ type: 'error', message: 'Professor name is required.' });
      return;
    }

    const res = await StorageService.saveProfessor(editingProf);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setEditingProf(null);
      refreshList();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDelete = async (id: number) => {
    const res = await StorageService.deleteProfessor(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Professor deleted successfully.' });
      setDeleteConfirmId(null);
      refreshList();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="content-body">
      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          <span>{feedback.type === 'success' ? '✓' : '⚠'}</span> <span>{feedback.message}</span>
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '18px', color: 'var(--primary-brown)', fontWeight: 700 }}>
            Faculty &amp; Professor Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Enter and edit professor names. Saved names automatically update across lecture schedules, PDF reports, and absentee email alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-golden"
        >
          <span>+</span> Add New Professor
        </button>
      </div>

      {/* Professors Table Card */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span>👨‍🏫</span> Registered Professors ({professors.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Changes are permanently saved to database
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Faculty ID</th>
                  <th>Professor Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Contact Email</th>
                  <th>Mobile</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {professors.length > 0 ? (
                  professors.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code style={{ backgroundColor: 'var(--beige)', padding: '3px 6px', borderRadius: '4px', color: 'var(--primary-brown)', fontWeight: 700 }}>
                          {p.facultyId}
                        </code>
                      </td>
                      <td>
                        <strong style={{ fontSize: '14px' }}>{p.name}</strong>
                      </td>
                      <td>{p.designation}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--beige-dark)', color: 'var(--primary-brown)' }}>
                          {p.department}
                        </span>
                      </td>
                      <td>
                        <a href={`mailto:${p.email}`} style={{ color: 'var(--primary-brown)' }}>
                          {p.email || '—'}
                        </a>
                      </td>
                      <td>{p.mobile || '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="btn btn-outline-brown btn-sm"
                            title="Edit Professor Name & Details"
                          >
                            ✏ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="btn btn-red btn-sm"
                            title="Delete Professor"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No faculty members registered yet. Click &ldquo;+ Add New Professor&rdquo; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Professor Modal */}
      {editingProf && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {editingProf.id ? '✏ Edit Professor Details' : '➕ Add New Faculty Member'}
              </div>
              <button
                type="button"
                onClick={() => setEditingProf(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profName">
                    Professor Full Name *
                  </label>
                  <input
                    type="text"
                    id="profName"
                    className="form-control"
                    placeholder="e.g. Prof. Nilesh Deshmukh or Dr. Rekha Sharma"
                    required
                    value={editingProf.name || ''}
                    onChange={(e) => setEditingProf(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    This name will appear on official PDF reports, lectures, and email signatures.
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="facultyId">
                      Faculty / Employee ID
                    </label>
                    <input
                      type="text"
                      id="facultyId"
                      className="form-control"
                      placeholder="e.g. FAC101"
                      value={editingProf.facultyId || ''}
                      onChange={(e) => setEditingProf(prev => prev ? { ...prev, facultyId: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="profDesig">
                      Designation
                    </label>
                    <input
                      type="text"
                      id="profDesig"
                      className="form-control"
                      placeholder="e.g. Assistant Professor, HOD"
                      value={editingProf.designation || ''}
                      onChange={(e) => setEditingProf(prev => prev ? { ...prev, designation: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profDept">
                    Department / Branch
                  </label>
                  <input
                    type="text"
                    id="profDept"
                    className="form-control"
                    placeholder="e.g. Computer Science & Engineering"
                    value={editingProf.department || ''}
                    onChange={(e) => setEditingProf(prev => prev ? { ...prev, department: e.target.value } : null)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="profEmail">
                      Official Email
                    </label>
                    <input
                      type="email"
                      id="profEmail"
                      className="form-control"
                      placeholder="faculty@college.edu"
                      value={editingProf.email || ''}
                      onChange={(e) => setEditingProf(prev => prev ? { ...prev, email: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="profMobile">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="text"
                      id="profMobile"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={editingProf.mobile || ''}
                      onChange={(e) => setEditingProf(prev => prev ? { ...prev, mobile: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingProf(null)}
                    className="btn btn-outline-brown btn-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-golden btn-sm">
                    <span>💾</span> Save Professor Name
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Confirm Deletion</div>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                Are you sure you want to remove professor{' '}
                <strong>{professors.find(p => p.id === deleteConfirmId)?.name}</strong>?
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
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
