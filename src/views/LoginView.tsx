import React, { useState } from 'react';
import { StorageService } from '../storage';
import { User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onGoToSetup?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onGoToSetup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setLoading(true);
    const res = await StorageService.login(username, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
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
          <h2>Smart QR Based Attendance System</h2>
          <p>ARMIET College of Engineering &amp; Technology</p>
        </div>

        <div className="login-body">
          {errorMessage && (
            <div className="alert alert-danger">
              <span>⚠</span> <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Portal Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                placeholder="Enter username"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-golden"
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Attendance Portal'}
            </button>
          </form>

          {onGoToSetup && (
            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--beige-dark)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>First time administrator setup? </span>
              <button
                type="button"
                onClick={onGoToSetup}
                style={{ background: 'none', border: 'none', color: 'var(--primary-brown)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Initialize Master Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
