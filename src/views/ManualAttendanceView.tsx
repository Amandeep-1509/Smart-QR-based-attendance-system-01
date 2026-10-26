import React, { useState, useMemo } from 'react';
import { StorageService } from '../storage';

interface ManualAttendanceViewProps {
  onNavigate: (view: string) => void;
}

export const ManualAttendanceView: React.FC<ManualAttendanceViewProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [classSession, setClassSession] = useState('Regular');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);

  const students = StorageService.getStudents();
  const lectures = StorageService.getLectures();
  const allRecords = StorageService.getAttendanceRecords();

  const [selectedLectureId, setSelectedLectureId] = useState<number | undefined>(() => {
    return lectures.length > 0 ? lectures[0].id : undefined;
  });

  const availableClasses = useMemo(() => {
    return Array.from(new Set(students.map(s => s.className)));
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (selectedClass === 'ALL') return students;
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const [statusMap, setStatusMap] = useState<Record<string, 'PRESENT' | 'ABSENT'>>(() => {
    const map: Record<string, 'PRESENT' | 'ABSENT'> = {};
    const relevantRecords = allRecords.filter(
      r => r.date === selectedDate && r.classSession === classSession
    );
    students.forEach(s => {
      const rec = relevantRecords.find(r => r.studentId === s.studentId);
      map[s.studentId] = rec ? rec.status : 'ABSENT';
    });
    return map;
  });

  const handleFilterChange = (date: string, session: string) => {
    setSelectedDate(date);
    setClassSession(session);
    const relevantRecords = StorageService.getAttendanceRecords().filter(
      r => r.date === date && r.classSession === session
    );
    const newMap: Record<string, 'PRESENT' | 'ABSENT'> = {};
    students.forEach(s => {
      const rec = relevantRecords.find(r => r.studentId === s.studentId);
      newMap[s.studentId] = rec ? rec.status : 'ABSENT';
    });
    setStatusMap(newMap);
    setFeedback(null);
  };

  const setAllRadio = (status: 'PRESENT' | 'ABSENT') => {
    const updated = { ...statusMap };
    filteredStudents.forEach(s => {
      updated[s.studentId] = status;
    });
    setStatusMap(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await StorageService.saveManualAttendance(statusMap, selectedDate, classSession, selectedLectureId);
    if (res.success) {
      const presentCount = Object.values(statusMap).filter(st => st === 'PRESENT').length;
      setFeedback(`Manual attendance saved successfully! (${presentCount} present, ${filteredStudents.length - presentCount} absent)`);
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback(res.message);
    }
  };

  const activeLecture = lectures.find(l => l.id === selectedLectureId);

  return (
    <div className="content-body">
      {feedback && (
        <div className="alert alert-success">
          <span>✓</span> <span>{feedback}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Attendance Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => handleFilterChange(e.target.value, classSession)}
              required
            />
          </div>

          <div>
            <label className="form-label">Subject / Lecture</label>
            <select
              className="form-control"
              style={{ width: '220px' }}
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

          <div>
            <label className="form-label">Class Session</label>
            <select
              className="form-control"
              style={{ width: '170px' }}
              value={classSession}
              onChange={(e) => handleFilterChange(selectedDate, e.target.value)}
            >
              <option value="Regular">Regular</option>
              <option value="Morning Session">Morning Session</option>
              <option value="Afternoon Session">Afternoon Session</option>
              <option value="Lab Practical">Lab Practical</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter Branch/Class</label>
            <select
              className="form-control"
              style={{ width: '150px' }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {activeLecture && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Assigned Professor: <strong style={{ color: 'var(--primary-brown)' }}>{activeLecture.professorName}</strong> &bull; Class: <strong>{activeLecture.className} - {activeLecture.division}</strong>
          </div>
        )}
      </div>

      {/* Attendance Form */}
      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-header">
            <h3>
              <span>📝</span> Student Roster ({filteredStudents.length} Students)
            </h3>
            {filteredStudents.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAllRadio('PRESENT')}
                  className="btn btn-outline-brown btn-sm"
                >
                  Select All Present
                </button>
                <button
                  type="button"
                  onClick={() => setAllRadio('ABSENT')}
                  className="btn btn-outline-brown btn-sm"
                >
                  Select All Absent
                </button>
              </div>
            )}
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Class & Div</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>Present</th>
                    <th style={{ textAlign: 'center', width: '140px' }}>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const currentStatus = statusMap[student.studentId] || 'ABSENT';
                      return (
                        <tr key={student.id}>
                          <td><strong>{student.rollNo}</strong></td>
                          <td>
                            <code style={{ backgroundColor: 'var(--beige)', padding: '3px 6px', borderRadius: '4px', color: 'var(--primary-brown)', fontWeight: 700 }}>
                              {student.studentId}
                            </code>
                          </td>
                          <td><strong>{student.name}</strong></td>
                          <td>{student.className} - {student.division}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name={`status_${student.studentId}`}
                              value="PRESENT"
                              checked={currentStatus === 'PRESENT'}
                              onChange={() => setStatusMap(prev => ({ ...prev, [student.studentId]: 'PRESENT' }))}
                              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="radio"
                              name={`status_${student.studentId}`}
                              value="ABSENT"
                              checked={currentStatus === 'ABSENT'}
                              onChange={() => setStatusMap(prev => ({ ...prev, [student.studentId]: 'ABSENT' }))}
                              style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No students enrolled yet. Go to <strong>Students</strong> to register class students.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredStudents.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--beige-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Session: <strong>{classSession}</strong> &bull; Date: <strong>{selectedDate}</strong>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="btn btn-outline-brown"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-golden">
                    <span>💾</span> Save Manual Attendance
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
