import React, { useState } from 'react';
import { StorageService } from '../storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    const res = await StorageService.changePassword(currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1800);
    } else {
      setMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div style={{ fontWeight: 700, fontSize: '16px' }}>🔐 Change Administrator Password</div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '14px' }}>
              <span>{message.type === 'success' ? '✓' : '⚠'}</span> <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="currentPassword">
                Current Password *
              </label>
              <input
                type="password"
                id="currentPassword"
                className="form-control"
                placeholder="Enter current password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password (Min 6 characters) *
              </label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmNewPassword">
                Confirm New Password *
              </label>
              <input
                type="password"
                id="confirmNewPassword"
                className="form-control"
                placeholder="Re-enter new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline-brown btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-golden btn-sm"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
