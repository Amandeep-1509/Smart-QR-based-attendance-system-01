import React, { useState } from 'react';
import { StorageService } from '../storage';
import { User } from '../types';

interface AuthViewProps {
  isInitialized: boolean;
  onAuthSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ isInitialized, onAuthSuccess }) => {
  // Default to 'signup' only when no administrator account exists yet; otherwise default to 'signin'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(isInitialized ? 'signin' : 'signup');

  // Sign In state
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpData, setSignUpData] = useState({
    username: '',
    fullName: '',
    designation: isInitialized ? 'Assistant Professor' : 'Professor & Head of Department',
    department: 'Computer Science & Engineering',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Switch tabs
  const handleTabSwitch = (tab: 'signin' | 'signup') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab(tab);
  };

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signInUsername.trim() || !signInPassword) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setLoading(true);
    const res = await StorageService.login(signInUsername.trim(), signInPassword);
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Invalid username or password.');
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = signUpData.username.trim().toLowerCase();
    const cleanFullName = signUpData.fullName.trim();

    if (!cleanFullName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (signUpData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    const res = await StorageService.registerUser({
      username: cleanUsername,
      password: signUpData.password,
      fullName: cleanFullName,
      designation: signUpData.designation.trim() || 'Professor',
      department: signUpData.department.trim() || 'Computer Engineering',
      email: signUpData.email.trim(),
    });
    setLoading(false);

    if (res.success && res.user) {
      setSuccessMessage(res.message);
      // Immediately log the user in and enter dashboard
      setTimeout(() => {
        onAuthSuccess(res.user!);
      }, 300);
    } else {
      setErrorMessage(res.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        {/* Header */}
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
          <h2>Smart QR Attendance System</h2>
          <p>ARMIET College of Engineering &amp; Technology</p>
        </div>

        {/* Dual Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid var(--beige-dark)',
            backgroundColor: 'var(--beige)',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabSwitch('signin')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: activeTab === 'signin' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'signin' ? 'var(--dark-brown)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === 'signin' ? '3px solid var(--golden)' : '3px solid transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>🔑</span> Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('signup')}
            style={{
              flex: 1,
              padding: '14px 16px',
              border: 'none',
              background: activeTab === 'signup' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'signup' ? 'var(--dark-brown)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === 'signup' ? '3px solid var(--golden)' : '3px solid transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>✍️</span> {isInitialized ? 'Sign Up (Faculty)' : 'Sign Up (Master Admin)'}
          </button>
        </div>

        {/* Card Body */}
        <div className="login-body">
          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '18px' }}>
              <span>⚠</span> <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '18px' }}>
              <span>✓</span> <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' && (
            <div>
              {!isInitialized && (
                <div
                  style={{
                    backgroundColor: 'var(--golden-light)',
                    border: '1px solid var(--golden-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: '#7D6312',
                  }}
                >
                  ℹ <strong>First-Time Notice:</strong> No master administrator account exists yet. Click the <strong>Sign Up</strong> tab above to create the initial administrative credentials.
                </div>
              )}

              <form onSubmit={handleSignIn} autoComplete="off">
                <div className="form-group">
                  <label className="form-label" htmlFor="signInUsername">
                    Portal Username *
                  </label>
                  <input
                    type="text"
                    id="signInUsername"
                    name="username"
                    className="form-control"
                    placeholder="Enter registered username"
                    required
                    autoFocus
                    value={signInUsername}
                    onChange={(e) => setSignInUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="signInPassword">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="signInPassword"
                    name="password"
                    className="form-control"
                    placeholder="Enter password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-golden"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Attendance Portal'}
                </button>
              </form>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--beige-dark)',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  {isInitialized ? 'New faculty or staff member? ' : 'First time setting up the system? '}
                </span>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-brown)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {isInitialized ? 'Register Faculty Account' : 'Create Master Admin'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <div>
              <div
                style={{
                  backgroundColor: isInitialized ? 'var(--beige)' : 'var(--golden-light)',
                  border: isInitialized ? '1px solid var(--beige-dark)' : '1px solid var(--golden-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  marginBottom: '16px',
                  fontSize: '12px',
                  color: isInitialized ? 'var(--dark-brown)' : '#7D6312',
                }}
              >
                {!isInitialized ? (
                  <>
                    <strong>Master Administrator Setup:</strong> Create the root administrator and head professor credentials to initialize the system database permanently.
                  </>
                ) : (
                  <>
                    <strong>Faculty Registration:</strong> Register a new Professor or Teacher account. You can configure lectures and record student attendance upon login.
                  </>
                )}
              </div>

              <form onSubmit={handleSignUp} autoComplete="off">
                <div className="form-group">
                  <label className="form-label" htmlFor="signUpFullName">
                    Full Name (Professor / Faculty) *
                  </label>
                  <input
                    type="text"
                    id="signUpFullName"
                    className="form-control"
                    placeholder="e.g. Dr. A. P. Sharma"
                    required
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData((prev) => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpDesignation">
                      Designation *
                    </label>
                    <input
                      type="text"
                      id="signUpDesignation"
                      className="form-control"
                      placeholder="e.g. Professor / HOD"
                      required
                      value={signUpData.designation}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, designation: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpDepartment">
                      Department *
                    </label>
                    <input
                      type="text"
                      id="signUpDepartment"
                      className="form-control"
                      placeholder="e.g. Computer Engineering"
                      required
                      value={signUpData.department}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpUsername">
                      Username (Min 3 chars) *
                    </label>
                    <input
                      type="text"
                      id="signUpUsername"
                      className="form-control"
                      placeholder="e.g. prof_sharma"
                      required
                      value={signUpData.username}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, username: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpEmail">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      id="signUpEmail"
                      className="form-control"
                      placeholder="faculty@college.edu"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpPassword">
                      Password (Min 6 chars) *
                    </label>
                    <input
                      type="password"
                      id="signUpPassword"
                      className="form-control"
                      placeholder="Enter strong password"
                      required
                      value={signUpData.password}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="signUpConfirmPassword">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="signUpConfirmPassword"
                      className="form-control"
                      placeholder="Re-enter password"
                      required
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-golden"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }}
                >
                  {loading
                    ? 'Saving to Database...'
                    : !isInitialized
                    ? 'Create Master Administrator & Launch'
                    : 'Register Faculty Account'}
                </button>
              </form>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--beige-dark)',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-brown)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Sign In to Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
