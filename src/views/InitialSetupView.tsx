import React, { useState } from 'react';
import { StorageService } from '../storage';
import { User } from '../types';

interface InitialSetupViewProps {
  onSetupComplete: (user: User) => void;
}

export const InitialSetupView: React.FC<InitialSetupViewProps> = ({ onSetupComplete }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    designation: 'Professor & Head of Department',
    department: 'Computer Science & Engineering',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.username.trim()) {
      setErrorMessage('Please enter an administrator username.');
      return;
    }
    if (!formData.fullName.trim()) {
      setErrorMessage('Please enter the administrator/professor full name.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const result = await StorageService.setupAdmin({
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName,
      designation: formData.designation,
      department: formData.department,
      email: formData.email,
    });
    setLoading(false);

    if (result.success && result.user) {
      onSetupComplete(result.user);
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '520px' }}>
        <div className="login-header">
          <div className="logo-badge">
            <img
              src="/images/armiet-logo.png"
              alt="ARMIET College logo"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span style="font-weight:800;color:#543621;font-size:16px;">ARMIET COLLEGE</span>';
                }
              }}
            />
          </div>
          <h2>System Initialization Setup</h2>
          <p>Create Administrator &amp; Head Professor Account</p>
        </div>

        <div className="login-body">
          <div style={{ backgroundColor: 'var(--beige)', border: '1px solid var(--golden-border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--dark-brown)' }}>
            <strong>Welcome to Smart QR Attendance!</strong> No administrator account exists yet. Please configure your master administrator and initial professor credentials below.
          </div>

          {errorMessage && (
            <div className="alert alert-danger">
              <span>⚠</span> <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                Professor / Administrator Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                className="form-control"
                placeholder="e.g. Dr. S. K. Patil"
                required
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="designation">
                  Designation *
                </label>
                <input
                  type="text"
                  id="designation"
                  className="form-control"
                  placeholder="e.g. HOD / Professor"
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department / Branch *
                </label>
                <input
                  type="text"
                  id="department"
                  className="form-control"
                  placeholder="e.g. Computer Science"
                  required
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Portal Login Username *
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  placeholder="e.g. admin"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Official Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="admin@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password (Min 6 chars) *
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Enter strong password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="form-control"
                  placeholder="Re-enter password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-golden"
              style={{ width: '100%', justifyContent: 'center', marginTop: '14px', padding: '12px' }}
            >
              {loading ? 'Initializing System...' : 'Initialize System & Create Admin Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
