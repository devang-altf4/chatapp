import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePicture ? `http://localhost:3000${user.profilePicture}` : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Update local state when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      if (!profilePicture) {
        setPreviewUrl(user.profilePicture ? `http://localhost:3000${user.profilePicture}` : '');
      }
    }
  }, [user, profilePicture]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);

    const result = await updateProfile(username.trim(), profilePicture);

    if (result.success) {
      // Reset the profile picture file state
      setProfilePicture(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const getInitials = () => {
    return username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Profile Settings</h2>
          <button className="btn-close-modal" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="form-group profile-picture-upload">
            <label>Profile Picture</label>
            <div className="profile-picture-container">
              <div className="profile-picture-preview large">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" />
                ) : (
                  <div className="profile-picture-placeholder">
                    <div className="placeholder-initials">{getInitials()}</div>
                  </div>
                )}
              </div>
              <div className="profile-picture-actions">
                <input
                  type="file"
                  id="settingsProfilePicture"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="settingsProfilePicture" className="btn-upload-profile">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload Photo
                </label>
                {previewUrl && (
                  <button type="button" className="btn-remove-photo" onClick={handleRemovePhoto}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="settingsUsername">Username</label>
            <input
              id="settingsUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="settingsEmail">Email</label>
            <input
              id="settingsEmail"
              type="email"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed', opacity: 0.7 }}
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Email cannot be changed</small>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
