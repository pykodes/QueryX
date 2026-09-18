import { useEffect, useState } from 'react'

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
]

function ProfilePage({
  user,
  onUpdateUser,
  onBackHome,
  onNavigateToWorkspace,
  theme,
  onToggleTheme,
}) {
  // Redirect unauthenticated users to the landing/signin page
  useEffect(() => {
    if (!user) {
      if (onBackHome) onBackHome()
      window.history.replaceState({ page: 'signin' }, '', '/signin')
      window.dispatchEvent(new PopStateEvent('popstate', { state: { page: 'signin' } }))
    }
  }, [user, onBackHome])

  const [formData, setFormData] = useState(() => ({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    work: user?.work || user?.company || '',
    role: user?.role || '',
    department: user?.department || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    authProvider: user?.authProvider || '',
    joinedDate: user?.joinedDate || '',
    sqlEngine: user?.sqlEngine || 'SQLite 3',
  }))

  const [isEditing, setIsEditing] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const getInitials = (name) => {
    if (!name || !name.trim()) return 'Q'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('') || 'Q'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    const initials = getInitials(formData.fullName)
    const updatedUser = {
      ...user,
      ...formData,
      initials,
    }
    if (onUpdateUser) {
      onUpdateUser(updatedUser)
    }
    setIsEditing(false)
    setShowAvatarPicker(false)
    setToastMessage('Profile updated successfully!')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSelectPresetAvatar = (url) => {
    setFormData((prev) => ({ ...prev, avatarUrl: url }))
    setShowAvatarPicker(false)
  }

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="profile-topbar-left">
          <button
            type="button"
            className="profile-back-home-btn"
            onClick={onBackHome}
            aria-label="Back to home landing page"
          >
            <span className="btn-icon">←</span>
            <span>Back to Home</span>
          </button>
          <div className="profile-brand">
            <span className="brand-badge">Q</span>
            <span className="brand-name">QueryX Account Profile</span>
          </div>
        </div>

        <div className="profile-topbar-right">
          <button
            type="button"
            className="profile-workspace-btn"
            onClick={onNavigateToWorkspace}
          >
            <span>Go to Workspace</span>
            <span className="btn-arrow">→</span>
          </button>
          <button
            type="button"
            className="profile-theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      {toastMessage && <div className="profile-toast">{toastMessage}</div>}

      <main className="profile-container">
        {/* Banner Card */}
        <div className="profile-card banner-card">
          <div className="banner-background" />
          <div className="banner-content">
            <div className="avatar-wrapper">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.fullName}
                  className="profile-avatar-img"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(formData.fullName)}
                </div>
              )}
              <button
                type="button"
                className="edit-avatar-badge"
                onClick={() => setShowAvatarPicker((prev) => !prev)}
                title="Change Avatar"
              >
                📷
              </button>
            </div>

            <div className="user-identity">
              <h1 className="user-name">{formData.fullName}</h1>
              <p className="user-role-work">
                {formData.role} • {formData.work}
              </p>
              <div className="user-tags">
                <span className="auth-tag google-auth-tag">
                  ✓ {formData.authProvider}
                </span>
                <span className="status-tag active">Active Account</span>
                <span className="joined-tag">Member since {formData.joinedDate}</span>
              </div>
            </div>

            <div className="profile-card-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="profile-primary-btn"
                  onClick={() => setIsEditing(true)}
                >
                  ✎ Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  className="profile-secondary-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Avatar Selector Drawer */}
          {showAvatarPicker && (
            <div className="avatar-picker-panel">
              <div className="picker-title">Select Avatar or Provide Image URL</div>
              <div className="preset-avatars">
                {AVATAR_PRESETS.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preset ${i + 1}`}
                    className={`preset-img ${formData.avatarUrl === url ? 'selected' : ''}`}
                    onClick={() => handleSelectPresetAvatar(url)}
                  />
                ))}
              </div>
              <div className="url-input-row">
                <input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={formData.avatarUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))
                  }
                  className="profile-input"
                />
                <button
                  type="button"
                  className="profile-small-btn"
                  onClick={() => setShowAvatarPicker(false)}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Details Form / View */}
        <form onSubmit={handleSave} className="profile-form-grid">
          {/* Personal Information */}
          <div className="profile-card">
            <h2 className="card-title">Personal Information</h2>
            <p className="card-subtitle">Manage your contact details and identity</p>

            <div className="field-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                className="profile-input"
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="profile-input"
                required
              />
            </div>

            <div className="field-row">
              <div className="field-group">
                <label htmlFor="phone">Phone / Contact Info</label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="profile-input"
                />
              </div>
              <div className="field-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="profile-input"
                />
              </div>
            </div>
          </div>

          {/* Work & Organization */}
          <div className="profile-card">
            <h2 className="card-title">Work &amp; Professional</h2>
            <p className="card-subtitle">Your organizational role and department</p>

            <div className="field-group">
              <label htmlFor="work">Company / Organization</label>
              <input
                id="work"
                type="text"
                name="work"
                value={formData.work}
                onChange={handleChange}
                disabled={!isEditing}
                className="profile-input"
              />
            </div>

            <div className="field-row">
              <div className="field-group">
                <label htmlFor="role">Job Title / Role</label>
                <input
                  id="role"
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="profile-input"
                />
              </div>
              <div className="field-group">
                <label htmlFor="department">Department</label>
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="profile-input"
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="bio">Professional Bio</label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className="profile-textarea"
              />
            </div>
          </div>

          {/* Auth & Security Metadata */}
          <div className="profile-card full-width-card">
            <h2 className="card-title">Authentication &amp; Account Status</h2>
            <p className="card-subtitle">Overview of your account credentials and Google Sync</p>

            <div className="meta-grid">
              <div className="meta-box">
                <span className="meta-label">AUTH METHOD</span>
                <span className="meta-value">{formData.authProvider}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">GOOGLE ACCOUNT SYNC</span>
                <span className="meta-value status-active">Connected &amp; Verified</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">SQL ENGINE PREFERENCE</span>
                <span className="meta-value">{formData.sqlEngine}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">ACCOUNT PRIVACY</span>
                <span className="meta-value">Read-Only Safety Guard Enabled</span>
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="form-actions-bar">
              <button
                type="button"
                className="profile-secondary-btn"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="profile-primary-btn">
                Save Changes
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}

export default ProfilePage
