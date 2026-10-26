import React, { useState, useMemo } from 'react';
import { StorageService } from '../storage';

interface ReportsViewProps {
  onNavigate: (view: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'student'>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(undefined);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const students = StorageService.getStudents();
  const lectures = StorageService.getLectures();
  const professors = StorageService.getProfessors();
  const allRecords = StorageService.getAttendanceRecords();

  const activeProf = professors.length > 0 ? professors[0] : undefined;

  // Daily report records
  const dailyRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchDate = r.date === selectedDate;
      const matchLec = selectedLectureId === 'ALL' || String(r.lectureId) === selectedLectureId;
      return matchDate && matchLec;
    });
  }, [allRecords, selectedDate, selectedLectureId]);

  const presentCount = dailyRecords.filter(r => r.status === 'PRESENT').length;
  const totalCount = students.length;
  const absentCount = Math.max(0, totalCount - presentCount);
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // Selected student
  const effectiveStudentId = selectedStudentId || (students.length > 0 ? students[0].id : undefined);
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === effectiveStudentId);
  }, [students, effectiveStudentId]);

  const studentRecords = useMemo(() => {
    if (!selectedStudent) return [];
    return allRecords.filter(r => r.studentId === selectedStudent.studentId);
  }, [allRecords, selectedStudent]);

  const studentPresentCount = studentRecords.filter(r => r.status === 'PRESENT').length;
  const studentTotalRecorded = studentRecords.length;
  const studentRate = studentTotalRecorded > 0 ? Math.round((studentPresentCount / studentTotalRecorded) * 100) : 100;

  const currentLecture = lectures.find(l => String(l.id) === selectedLectureId);
  const professorName = currentLecture?.professorName || (activeProf?.name || 'Course Faculty');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="content-body">
      {/* Tab Switcher */}
      <div className="template-tabs no-print" style={{ maxWidth: '440px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
        >
          <span>📅</span> Daily / Lecture Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('student')}
          className={`tab-btn ${activeTab === 'student' ? 'active' : ''}`}
        >
          <span>👤</span> Student-wise Report
        </button>
      </div>

      {activeTab === 'daily' ? (
        <div className="card">
          <div className="card-header no-print">
            <h3>
              <span>📅</span> Lecture &amp; Daily Attendance Report
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-brown)' }}>Date:</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-brown)' }}>Lecture:</label>
                <select
                  className="form-control"
                  style={{ padding: '6px 10px', fontSize: '13px', width: 'auto' }}
                  value={selectedLectureId}
                  onChange={(e) => setSelectedLectureId(e.target.value)}
                >
                  <option value="ALL">All Lectures</option>
                  {lectures.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.subjectCode} - {l.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="btn btn-golden btn-sm"
              >
                <span>🖨</span> Print / PDF Report
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* Faculty Attribution */}
            <div style={{ marginBottom: '16px', padding: '10px 16px', backgroundColor: 'var(--beige)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                Faculty In-Charge: <strong style={{ color: 'var(--primary-brown)' }}>{professorName}</strong>
                {currentLecture && (
                  <span style={{ marginLeft: '12px', color: 'var(--text-muted)' }}>
                    Course: <strong>{currentLecture.subjectName} ({currentLecture.subjectCode})</strong>
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                College: <strong>ARMIET College of Engineering</strong>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ marginBottom: '20px' }}>
              <div className="metric-card" style={{ padding: '16px 20px' }}>
                <div className="metric-info">
                  <h3>{totalCount}</h3>
                  <p>Enrolled Students</p>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px 20px' }}>
                <div className="metric-info">
                  <h3 style={{ color: 'var(--soft-green)' }}>{presentCount}</h3>
                  <p>Present</p>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px 20px' }}>
                <div className="metric-info">
                  <h3 style={{ color: 'var(--soft-red)' }}>{absentCount}</h3>
                  <p>Absent</p>
                </div>
              </div>

              <div className="metric-card" style={{ padding: '16px 20px' }}>
                <div className="metric-info">
                  <h3 style={{ color: 'var(--golden-hover)' }}>{attendancePercentage}%</h3>
                  <p>Attendance Rate</p>
                </div>
              </div>
            </div>

            {/* Daily Scanned Students Table */}
            <h4 style={{ color: 'var(--primary-brown)', fontSize: '14px', marginBottom: '12px' }}>
              Attendance Records for Date: <span>{selectedDate}</span>
            </h4>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Class & Div</th>
                    <th>Subject / Session</th>
                    <th>Faculty</th>
                    <th>Status</th>
                    <th>Time Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRecords.length > 0 ? (
                    dailyRecords.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.rollNo}</strong></td>
                        <td>
                          <code style={{ backgroundColor: 'var(--beige)', padding: '2px 5px', borderRadius: '3px' }}>
                            {r.studentId}
                          </code>
                        </td>
                        <td><strong>{r.studentName}</strong></td>
                        <td>{r.className} - {r.division}</td>
                        <td>{r.subjectName || r.classSession}</td>
                        <td>{r.professorName || professorName}</td>
                        <td>
                          <span className={`badge ${r.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No attendance records logged for {selectedDate}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header no-print">
            <h3>
              <span>👤</span> Individual Student Attendance History
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-brown)' }}>Student:</label>
              <select
                className="form-control"
                style={{ width: '260px', padding: '6px 12px' }}
                value={effectiveStudentId || ''}
                onChange={(e) => setSelectedStudentId(Number(e.target.value))}
              >
                {students.length === 0 && <option value="">No Students Enrolled</option>}
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rollNo} - {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card-body">
            {selectedStudent ? (
              <>
                <div className="metrics-grid" style={{ marginBottom: '20px' }}>
                  <div className="metric-card" style={{ padding: '16px 20px' }}>
                    <div className="metric-info">
                      <h3>{studentTotalRecorded}</h3>
                      <p>Total Recorded Sessions</p>
                    </div>
                  </div>

                  <div className="metric-card" style={{ padding: '16px 20px' }}>
                    <div className="metric-info">
                      <h3 style={{ color: 'var(--soft-green)' }}>{studentPresentCount}</h3>
                      <p>Present</p>
                    </div>
                  </div>

                  <div className="metric-card" style={{ padding: '16px 20px' }}>
                    <div className="metric-info">
                      <h3 style={{ color: 'var(--soft-red)' }}>{studentTotalRecorded - studentPresentCount}</h3>
                      <p>Absent</p>
                    </div>
                  </div>

                  <div className="metric-card" style={{ padding: '16px 20px' }}>
                    <div className="metric-info">
                      <h3 style={{ color: 'var(--golden-hover)' }}>{studentRate}%</h3>
                      <p>Overall Percentage</p>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Lecture / Session</th>
                        <th>Faculty</th>
                        <th>Class</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRecords.length > 0 ? (
                        studentRecords.map((rec) => (
                          <tr key={rec.id}>
                            <td><strong>{rec.date}</strong></td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{rec.time}</td>
                            <td>{rec.subjectName || rec.classSession}</td>
                            <td>{rec.professorName || professorName}</td>
                            <td>{rec.className} - {rec.division}</td>
                            <td>
                              <span className={`badge ${rec.status === 'PRESENT' ? 'badge-present' : 'badge-absent'}`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                            No session records found for {selectedStudent.name}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No students available. Please register students first.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print / PDF Modal matching official College format */}
      {isPrintModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '840px', width: '95%' }}>
            <div className="modal-header no-print">
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Print Official Attendance Report</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-golden btn-sm"
                >
                  <span>🖨</span> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '30px', backgroundColor: '#FFFFFF', color: '#222' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #4A2E1B', paddingBottom: '14px', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', color: '#4A2E1B', textTransform: 'uppercase' }}>
                  ARMIET COLLEGE OF ENGINEERING &amp; TECHNOLOGY
                </h1>
                <h2 style={{ margin: '5px 0 0', fontSize: '15px', color: '#C59B27' }}>
                  Smart QR-Based Official Attendance Report
                </h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0', color: '#555' }}>
                  Faculty In-Charge: <strong>{professorName}</strong> &bull; Department of Computer Science &amp; Engineering
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px', backgroundColor: '#FAF6F0', border: '1px solid #E4D8CE', fontSize: '13px' }}>
                      <strong>Report Date:</strong> {selectedDate}
                    </td>
                    <td style={{ padding: '6px 10px', backgroundColor: '#FAF6F0', border: '1px solid #E4D8CE', fontSize: '13px' }}>
                      <strong>Total Enrolled:</strong> {totalCount}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px', backgroundColor: '#FAF6F0', border: '1px solid #E4D8CE', fontSize: '13px' }}>
                      <strong>Present Count:</strong>{' '}
                      <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>{presentCount}</span>
                    </td>
                    <td style={{ padding: '6px 10px', backgroundColor: '#FAF6F0', border: '1px solid #E4D8CE', fontSize: '13px' }}>
                      <strong>Absent Count:</strong>{' '}
                      <span style={{ color: '#C62828', fontWeight: 'bold' }}>{absentCount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#4A2E1B', color: 'white' }}>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Roll No</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Student ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Student Name</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Class</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Status</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px 12px', textAlign: 'left' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRecords.map((r) => (
                    <tr key={r.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>{r.rollNo}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>{r.studentId}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}><strong>{r.studentName}</strong></td>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>{r.className} - {r.division}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontWeight: 'bold', color: r.status === 'PRESENT' ? '#2E7D32' : '#C62828' }}>
                        {r.status}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px 12px' }}>{r.time}</td>
                    </tr>
                  ))}
                  {dailyRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', border: '1px solid #ccc' }}>
                        No records logged for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <div style={{ borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '6px' }}>
                  <strong>{professorName}</strong>
                  <div style={{ fontSize: '11px', color: '#555' }}>Faculty In-Charge</div>
                </div>
                <div style={{ borderTop: '1px solid #000', width: '200px', textAlign: 'center', paddingTop: '6px' }}>
                  <strong>Head of Department</strong>
                  <div style={{ fontSize: '11px', color: '#555' }}>Computer Engineering</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
