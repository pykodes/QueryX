import { useMemo, useState } from 'react'

function SignInPage({ onBackHome, theme, onToggleTheme, onAccountCreated }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState('')

  const passwordStrength = useMemo(() => {
    const value = formData.password

    if (!value.trim()) {
      return { label: 'Waiting', colorClass: 'empty', bars: [0, 0, 0, 0] }
    }

    let score = 0

    if (value.length >= 8) score += 1
    if (/[A-Z]/.test(value)) score += 1
    if (/[0-9]/.test(value)) score += 1
    if (/[^A-Za-z0-9]/.test(value)) score += 1

    if (score <= 1) return { label: 'Low', colorClass: 'weak', bars: [1, 0, 0, 0] }
    if (score === 2) return { label: 'Moderate', colorClass: 'medium', bars: [1, 1, 0, 0] }
    if (score === 3) return { label: 'Strong', colorClass: 'strong', bars: [1, 1, 1, 0] }
    return { label: 'Quantum grade', colorClass: 'excellent', bars: [1, 1, 1, 1] }
  }, [formData.password])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedName = formData.fullName.trim()
    const trimmedEmail = formData.email.trim()

    if (!trimmedName) {
      setFormError('Please enter your full name.')
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.')
      return
    }

    if (formData.password.length < 8) {
      setFormError('Password must contain at least 8 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    if (!formData.acceptedTerms) {
      setFormError('Please accept the terms and privacy policy to continue.')
      return
    }

    setFormError('')
    onAccountCreated({
      fullName: trimmedName,
      email: trimmedEmail,
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-back-row">
        <button type="button" className="auth-back-button" onClick={onBackHome} aria-label="Back to landing page">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="auth-back-icon">
            <path d="M14 5l-7 7 7 7M7 12h12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="auth-shell">
        <div className="auth-panel">
          <div className="auth-topbar">
            <div className="auth-brand" aria-label="QueryX brand">
              <div className="brand-mark">Q</div>
              <span className="brand-text">QueryX</span>
            </div>

            <div className="status-badge">
              <span className="status-dot" />
              System online
            </div>

            <div className="theme-switcher auth-theme-switcher" role="group" aria-label="Color theme switcher">
              <button type="button" className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && onToggleTheme()} aria-pressed={theme === 'light'}>
                Light
              </button>
              <button type="button" className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && onToggleTheme()} aria-pressed={theme === 'dark'}>
                Dark
              </button>
            </div>
          </div>

          <div className="auth-header">
            <span className="auth-tag">Smart • Secure • Simple</span>
            <h1>Create your account</h1>
            <p>Start your journey with us today and bring your workflows, metrics, and AI insights into one premium operating system.</p>
          </div>

          <div className="auth-social-row">
            <button type="button" className="auth-social-button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21.6 12.23c0-.68-.06-1.35-.18-1.98H12v3.74h5.39a4.62 4.62 0 0 1-2 3.02v2.45h3.22c1.9-1.74 2.99-4.3 2.99-7.23Z" fill="#4285F4" />
                <path d="M12 22c2.7 0 4.96-.9 6.61-2.42l-3.22-2.45c-.9.6-2.04.95-3.39.95-2.61 0-4.82-1.75-5.6-4.13H.96v2.56A10 10 0 0 0 12 22Z" fill="#34A853" />
                <path d="M6.4 18.9c-.48-.9-.76-1.88-.76-2.9s.28-2 .76-2.9V10.6H.96A9.96 9.96 0 0 0 0 12c0 1.6.38 3.1.96 4.4L6.4 18.9Z" fill="#FBBC05" />
                <path d="M12 5.98c1.48 0 2.81.51 3.86 1.52l2.9-2.9C16.95 1.97 14.7 1 12 1A10 10 0 0 0 .96 16.4L6.4 14.1C7.18 11.76 9.39 9.98 12 9.98Z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="auth-social-button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.51 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.9-.01-1.77-2.78.61-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.02 1.53 1.02.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.26-4.56-1.13-4.56-5.04 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.02A9.54 9.54 0 0 1 12 6.84c.85 0 1.71.12 2.5.35 1.9-1.29 2.74-1.02 2.74-1.02.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.73 0 3.92-2.35 4.78-4.58 5.03.36.31.68.92.68 1.86 0 1.35-.01 2.44-.01 2.77 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" fill="currentColor" />
              </svg>
              GitHub
            </button>
          </div>

          <div className="auth-divider">
            <span>or register with email</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {formError && <div className="auth-error-box">{formError}</div>}

            <div className="auth-field">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon">◔</span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Work Email</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                />
                <span className="input-state success">✓</span>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Create Password</label>
              <div className="input-wrap">
                <span className="input-icon">◌</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              <div className="strength-box">
                <div className="strength-head">
                  <span>Strength Rating</span>
                  <strong>{passwordStrength.label}</strong>
                </div>
                <div className="strength-meter" aria-label="Password strength">
                  {passwordStrength.bars.map((filled, index) => (
                    <span key={index} className={filled ? `filled ${passwordStrength.colorClass}` : ''} />
                  ))}
                </div>
                <div className="strength-notes">
                  <span>✓ 8+ chars</span>
                  <span>✓ Uppercase</span>
                  <span>✓ Symbol</span>
                </div>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon">↻</span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <label className="terms-row" htmlFor="acceptedTerms">
              <input
                id="acceptedTerms"
                name="acceptedTerms"
                type="checkbox"
                checked={formData.acceptedTerms}
                onChange={handleChange}
              />
              <span>
                I agree to the <a href="#">Terms of Compute</a> and acknowledge the <a href="#">Privacy Protocol</a>.
              </span>
            </label>

            <button type="submit" className="auth-submit-button">
              Create Account
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <p className="auth-switch-text">
              Already have an account? <button type="button" onClick={onBackHome}>Sign in</button>
            </p>
          </form>
        </div>

      </div>
    </div>
  )
}

export default SignInPage
