import React, { useState } from 'react';
import { StorageService } from '../storage';
import { Lecture, Professor } from '../types';

export const LecturesView: React.FC = () => {
  const [lectures, setLectures] = useState<Lecture[]>(() => StorageService.getLectures());
  const professors = StorageService.getProfessors();
  const [editingLecture, setEditingLecture] = useState<Partial<Lecture> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const refreshList = () => {
    setLectures(StorageService.getLectures());
  };

  const handleOpenAdd = () => {
    const defaultProf = professors[0];
    setEditingLecture({
      subjectName: '',
      subjectCode: '',
      professorId: defaultProf ? defaultProf.id : 0,
      professorName: defaultProf ? defaultProf.name : '',
      className: 'CSE',
      division: 'A',
      startTime: '09:00 AM',
      endTime: '10:00 AM',
      gracePeriodMinutes: 10,
    });
  };

  const handleOpenEdit = (lec: Lecture) => {
    setEditingLecture({ ...lec });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecture || !editingLecture.subjectName?.trim() || !editingLecture.subjectCode?.trim()) {
      setFeedback({ type: 'error', message: 'Subject name and code are required.' });
      return;
    }

    const res = await StorageService.saveLecture(editingLecture);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setEditingLecture(null);
      refreshList();
      setTimeout(() => setFeedback(null), 3000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDelete = async (id: number) => {
    const res = await StorageService.deleteLecture(id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Lecture deleted.' });
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
            Lecture &amp; Course Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Configure lectures, assign subject professors, set class timings, and specify grace periods.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="btn btn-golden"
        >
          <span>+</span> Add New Lecture
        </button>
      </div>

      {/* Lectures Table Card */}
      <div className="card">
        <div className="card-header">
          <h3>
            <span>📚</span> Scheduled Lectures ({lectures.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Each lecture links directly to the designated faculty member
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject / Course Name</th>
                  <th>Assigned Professor</th>
                  <th>Class & Div</th>
                  <th>Timing</th>
                  <th>Grace Period</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lectures.length > 0 ? (
                  lectures.map((lec) => (
                    <tr key={lec.id}>
                      <td>
                        <code style={{ backgroundColor: 'var(--beige)', padding: '3px 6px', borderRadius: '4px', color: 'var(--primary-brown)', fontWeight: 700 }}>
                          {lec.subjectCode}
                        </code>
                      </td>
                      <td>
                        <strong>{lec.subjectName}</strong>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--primary-brown)' }}>{lec.professorName}</strong>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--beige-dark)', color: 'var(--primary-brown)' }}>
                          {lec.className} - {lec.division}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        ⏰ {lec.startTime} – {lec.endTime}
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'var(--golden-light)', color: '#8A6D15' }}>
                          {lec.gracePeriodMinutes || 10} Mins
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lec)}
                            className="btn btn-outline-brown btn-sm"
                            title="Edit Lecture"
                          >
                            ✏ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(lec.id)}
                            className="btn btn-red btn-sm"
                            title="Delete Lecture"
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
                      No lectures scheduled yet. Click &ldquo;+ Add New Lecture&rdquo; above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Lecture Modal */}
      {editingLecture && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>
                {editingLecture.id ? '✏ Edit Lecture Schedule' : '➕ Add Lecture Schedule'}
              </div>
              <button
                type="button"
                onClick={() => setEditingLecture(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="subjectCode">
                      Subject / Course Code *
                    </label>
                    <input
                      type="text"
                      id="subjectCode"
                      className="form-control"
                      placeholder="e.g. CS401"
                      required
                      value={editingLecture.subjectCode || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, subjectCode: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="subjectName">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      id="subjectName"
                      className="form-control"
                      placeholder="e.g. Operating Systems"
                      required
                      value={editingLecture.subjectName || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, subjectName: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="assignedProf">
                    Assigned Professor *
                  </label>
                  <select
                    id="assignedProf"
                    className="form-control"
                    required
                    value={editingLecture.professorId || ''}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const found = professors.find(p => p.id === id);
                      setEditingLecture(prev => prev ? ({
                        ...prev,
                        professorId: id,
                        professorName: found ? found.name : '',
                      }) : null);
                    }}
                  >
                    <option value="">-- Select Professor --</option>
                    {professors.map((p: Professor) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="lecClass">
                      Class / Branch *
                    </label>
                    <input
                      type="text"
                      id="lecClass"
                      className="form-control"
                      placeholder="e.g. CSE"
                      required
                      value={editingLecture.className || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, className: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lecDiv">
                      Division *
                    </label>
                    <input
                      type="text"
                      id="lecDiv"
                      className="form-control"
                      placeholder="e.g. A"
                      required
                      value={editingLecture.division || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, division: e.target.value } : null)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="startTime">
                      Start Time
                    </label>
                    <input
                      type="text"
                      id="startTime"
                      className="form-control"
                      placeholder="e.g. 09:00 AM"
                      value={editingLecture.startTime || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="endTime">
                      End Time
                    </label>
                    <input
                      type="text"
                      id="endTime"
                      className="form-control"
                      placeholder="e.g. 10:00 AM"
                      value={editingLecture.endTime || ''}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="gracePeriod">
                      Grace Period (Mins)
                    </label>
                    <input
                      type="number"
                      id="gracePeriod"
                      className="form-control"
                      min="0"
                      max="60"
                      value={editingLecture.gracePeriodMinutes || 10}
                      onChange={(e) => setEditingLecture(prev => prev ? { ...prev, gracePeriodMinutes: Number(e.target.value) } : null)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setEditingLecture(null)}
                    className="btn btn-outline-brown btn-sm"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-golden btn-sm">
                    <span>💾</span> Save Lecture
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
                Are you sure you want to remove lecture{' '}
                <strong>{lectures.find(l => l.id === deleteConfirmId)?.subjectName}</strong>?
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
