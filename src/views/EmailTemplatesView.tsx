import React, { useState, useMemo } from 'react';
import { StorageService, DEFAULT_TEMPLATES } from '../storage';
import { EmailTemplate } from '../types';

export const EmailTemplatesView: React.FC = () => {
  const [activeType, setActiveType] = useState<EmailTemplate['templateType']>('STUDENT_ABSENCE');
  const [templates, setTemplates] = useState<EmailTemplate[]>(() => StorageService.getTemplates());
  const [feedback, setFeedback] = useState<string | null>(null);

  const currentTemplate = useMemo(() => {
    return (
      templates.find(t => t.templateType === activeType) || {
        id: 0,
        templateType: activeType,
        displayLabel: DEFAULT_TEMPLATES[activeType].label,
        subject: DEFAULT_TEMPLATES[activeType].subject,
        bodyText: DEFAULT_TEMPLATES[activeType].body,
        isCustomized: false,
      }
    );
  }, [templates, activeType]);

  const [subjectInput, setSubjectInput] = useState(currentTemplate.subject);
  const [bodyInput, setBodyInput] = useState(currentTemplate.bodyText);

  const handleTabChange = (type: EmailTemplate['templateType']) => {
    setActiveType(type);
    const t = templates.find(item => item.templateType === type);
    if (t) {
      setSubjectInput(t.subject);
      setBodyInput(t.bodyText);
    } else {
      setSubjectInput(DEFAULT_TEMPLATES[type].subject);
      setBodyInput(DEFAULT_TEMPLATES[type].body);
    }
    setFeedback(null);
  };

  const sampleStudent = StorageService.getStudents()[0] || {
    id: 1,
    studentId: 'STU101',
    rollNo: '101',
    name: 'Sample Student',
    className: 'CSE',
    division: 'A',
    studentEmail: 'student@college.edu',
    parentName: 'Parent Name',
    parentEmail: 'parent@example.com',
  };

  const professors = StorageService.getProfessors();
  const sampleProfName = professors[0]?.name || 'Prof. Sanjay Patil';

  const todayStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  // Interpolated preview
  const previewSubject = useMemo(() => {
    return StorageService.interpolate(subjectInput, sampleStudent, todayStr, 'Regular', sampleProfName, 'Operating Systems', 'CS301');
  }, [subjectInput, sampleStudent, todayStr, sampleProfName]);

  const previewBody = useMemo(() => {
    return StorageService.interpolate(bodyInput, sampleStudent, todayStr, 'Regular', sampleProfName, 'Operating Systems', 'CS301', {
      totalCount: 40,
      presentCount: 35,
      absentCount: 5,
      attendancePercentage: 88,
    });
  }, [bodyInput, sampleStudent, todayStr, sampleProfName]);

  const insertPlaceholder = (tag: string) => {
    setBodyInput(prev => prev + tag);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await StorageService.updateTemplate(activeType, subjectInput, bodyInput);
    setTemplates(StorageService.getTemplates());
    setFeedback(`Template "${DEFAULT_TEMPLATES[activeType].label}" saved successfully.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReset = async () => {
    if (window.confirm('Reset this template to its default original text?')) {
      await StorageService.resetTemplate(activeType);
      const reset = DEFAULT_TEMPLATES[activeType];
      setSubjectInput(reset.subject);
      setBodyInput(reset.body);
      setTemplates(StorageService.getTemplates());
      setFeedback('Template restored to default successfully.');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const chips = [
    '{student_name}',
    '{roll_no}',
    '{class_name}',
    '{division}',
    '{parent_name}',
    '{student_email}',
    '{parent_email}',
    '{date}',
    '{class_session}',
    '{professor_name}',
    '{subject_name}',
    '{subject_code}',
    '{attendance_status}',
    '{sender_name}',
    '{college_name}',
  ];

  return (
    <div className="content-body">
      {feedback && (
        <div className="alert alert-success">
          <span>✓</span> <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="template-tabs">
        {(['STUDENT_ABSENCE', 'PARENT_ABSENCE', 'TEACHER_ABSENCE', 'TEACHER_ATTENDANCE'] as const).map(
          (type) => {
            const isCustom = templates.find(t => t.templateType === type)?.isCustomized;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTabChange(type)}
                className={`tab-btn ${activeType === type ? 'active' : ''}`}
              >
                {isCustom && <span className="customized-dot" title="Customized template"></span>}
                <span>{DEFAULT_TEMPLATES[type].label}</span>
              </button>
            );
          }
        )}
      </div>

      <div className="editor-layout">
        {/* Left Column: Editor */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>✏</span> Edit {DEFAULT_TEMPLATES[activeType].label}
            </h3>
            {currentTemplate.isCustomized && (
              <span className="badge badge-demo">Customized</span>
            )}
          </div>

          <div className="card-body">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label" htmlFor="subjectInput">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  id="subjectInput"
                  className="form-control"
                  value={subjectInput}
                  onChange={(e) => setSubjectInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Insert Dynamic Placeholders (Click to add):</label>
                <div className="placeholder-chips">
                  {chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => insertPlaceholder(chip)}
                      className="chip"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="templateBody">
                  Email Message Body Template
                </label>
                <textarea
                  id="templateBody"
                  className="form-control"
                  style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                  value={bodyInput}
                  onChange={(e) => setBodyInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-outline-brown btn-sm"
                >
                  ↺ Reset to Default
                </button>
                <button type="submit" className="btn btn-golden">
                  <span>💾</span> Save Template
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Sample Preview */}
        <div className="card">
          <div className="card-header">
            <h3>
              <span>👁</span> Live Sample Preview
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Faculty: {sampleProfName}
            </span>
          </div>

          <div className="card-body">
            <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--beige-dark)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Subject
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-brown)', marginTop: '4px' }}>
                {previewSubject}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              Message Body Preview
            </div>

            <div className="preview-box" style={{ minHeight: '280px' }}>
              {previewBody}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
