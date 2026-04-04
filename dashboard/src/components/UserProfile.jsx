// ============================================================
// AutoHealX — User Profile Component
// User management and role-based access control
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const UserProfile = () => {
  const { currentUser, userRole, userDevices, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'user': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'user': return '👤';
      default: return '❓';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="user-profile">
      <div className="profile-trigger" onClick={() => setShowProfile(!showProfile)}>
        <div className="user-avatar">
          {currentUser.photoURL ? (
            <img src={currentUser.photoURL} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {(currentUser.displayName || currentUser.email)[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">
            {currentUser.displayName || currentUser.email.split('@')[0]}
          </div>
          <div className="user-role" style={{ color: getRoleColor(userRole) }}>
            {getRoleIcon(userRole)} {userRole}
          </div>
        </div>
        <div className="profile-arrow">
          {showProfile ? '▲' : '▼'}
        </div>
      </div>

      {showProfile && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-avatar">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <div className="avatar-large">
                  {(currentUser.displayName || currentUser.email)[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-details">
              <h3>{currentUser.displayName || 'User'}</h3>
              <p>{currentUser.email}</p>
              <div className="role-badge" style={{ backgroundColor: getRoleColor(userRole) }}>
                {getRoleIcon(userRole)} {userRole.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-icon">🖥️</div>
              <div className="stat-info">
                <div className="stat-value">{userDevices.length}</div>
                <div className="stat-label">Devices</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🟢</div>
              <div className="stat-info">
                <div className="stat-value">
                  {userDevices.filter(d => {
                    if (!d.lastHeartbeat) return false;
                    const diffMinutes = (new Date() - new Date(d.lastHeartbeat)) / (1000 * 60);
                    return diffMinutes < 2;
                  }).length}
                </div>
                <div className="stat-label">Online</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">24/7</div>
                <div className="stat-label">Monitoring</div>
              </div>
            </div>
          </div>

          <div className="profile-permissions">
            <h4>🔐 Access Permissions</h4>
            <div className="permission-list">
              <div className="permission-item">
                <span className="permission-icon">👀</span>
                <span className="permission-text">View system metrics</span>
                <span className="permission-status granted">✓</span>
              </div>
              <div className="permission-item">
                <span className="permission-icon">🔄</span>
                <span className="permission-text">Control processes</span>
                <span className="permission-status granted">✓</span>
              </div>
              <div className="permission-item">
                <span className="permission-icon">🤖</span>
                <span className="permission-text">Approve auto-heal actions</span>
                <span className="permission-status granted">✓</span>
              </div>
              {userRole === 'admin' && (
                <div className="permission-item">
                  <span className="permission-icon">👑</span>
                  <span className="permission-text">Manage all devices</span>
                  <span className="permission-status granted">✓</span>
                </div>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button className="profile-btn secondary">
              ⚙️ Settings
            </button>
            <button className="profile-btn danger" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;