 import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import './styles/landing.css'
import './styles/auth.css'
import './styles/workspace.css'
import './styles/profile.css'

const ACCENT_COLORS = {
  purple: { name: 'Default Purple', primary: '#6d4ae7', secondary: '#8f7afc' },
  blue: { name: 'Ocean Blue', primary: '#2563eb', secondary: '#60a5fa' },
  emerald: { name: 'Emerald Green', primary: '#10b981', secondary: '#34d399' },
  orange: { name: 'Sunset Orange', primary: '#f59e0b', secondary: '#fbbf24' },
  rose: { name: 'Cyber Rose', primary: '#e11d48', secondary: '#f43f5e' },
}

const getPageFromLocation = () => {
  if (typeof window === 'undefined') return 'landing'
  if (window.location.pathname === '/signin') return 'signin'
  if (window.location.pathname === '/workspace') return 'workspace'
  if (window.location.pathname === '/profile') return 'profile'
  return 'landing'
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const savedTheme = window.localStorage.getItem('queryx-theme')
  return savedTheme === 'dark' ? 'dark' : 'light'
}

const getInitialAccent = () => {
  if (typeof window === 'undefined') return 'purple'
  return window.localStorage.getItem('queryx-accent') || 'purple'
}

const getInitialUser = () => {
  if (typeof window === 'undefined') return null

  try {
    const savedUser = window.localStorage.getItem('queryx-user')
    return savedUser ? JSON.parse(savedUser) : null
  } catch (error) {
    console.error('Failed to parse saved user', error)
    return null
  }
}

const getInitials = (fullName) => {
  if (!fullName || !fullName.trim()) return 'PK'
  const names = fullName.trim().split(/\s+/).filter(Boolean)
  return names.slice(0, 2).map((name) => name[0]?.toUpperCase() ?? '').join('') || 'PK'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [accentColor, setAccentColor] = useState(() => getInitialAccent())
  const [currentUser, setCurrentUser] = useState(() => getInitialUser())
  const [showUserCreatedToast, setShowUserCreatedToast] = useState(false)

  const navigateTo = (page) => {
    const targetPage = page === 'profile' && !currentUser ? 'signin' : page
    const nextPage =
      targetPage === 'signin'
        ? 'signin'
        : targetPage === 'workspace'
          ? 'workspace'
          : targetPage === 'profile'
            ? 'profile'
            : 'landing'
    const targetPath =
      nextPage === 'signin'
        ? '/signin'
        : nextPage === 'workspace'
          ? '/workspace'
          : nextPage === 'profile'
            ? '/profile'
            : '/'

    setCurrentPage(nextPage)
    window.history.pushState({ page: nextPage }, '', targetPath)
  }


  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  const handleSelectAccent = (colorKey) => {
    if (ACCENT_COLORS[colorKey]) {
      setAccentColor(colorKey)
    }
  }

  const handleAccountCreated = (userData) => {
    const nextUser = {
      ...userData,
      initials: getInitials(userData.fullName),
    }

    setCurrentUser(nextUser)
    window.localStorage.setItem('queryx-user', JSON.stringify(nextUser))
    setShowUserCreatedToast(true)

    window.setTimeout(() => {
      setShowUserCreatedToast(false)
      navigateTo('landing')
    }, 1400)
  }

  const handleUpdateUser = (updatedUserData) => {
    setCurrentUser(updatedUserData)
    window.localStorage.setItem('queryx-user', JSON.stringify(updatedUserData))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    window.localStorage.removeItem('queryx-user')
    navigateTo('landing')
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('queryx-theme', theme)
  }, [theme])

  useEffect(() => {
    const config = ACCENT_COLORS[accentColor] || ACCENT_COLORS.purple
    document.documentElement.style.setProperty('--workspace-accent', config.primary)
    document.documentElement.style.setProperty('--workspace-accent-2', config.secondary)
    window.localStorage.setItem('queryx-accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getPageFromLocation())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const targetPath =
      currentPage === 'signin'
        ? '/signin'
        : currentPage === 'workspace'
          ? '/workspace'
          : currentPage === 'profile'
            ? '/profile'
            : '/'

    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ page: currentPage }, '', targetPath)
    }
  }, [currentPage])

  if (currentPage === 'signin') {
    return (
      <div key={currentPage} className="page-transition-shell">
        <SignInPage
          onBackHome={() => navigateTo('landing')}
          theme={theme}
          onToggleTheme={toggleTheme}
          onAccountCreated={handleAccountCreated}
        />
        {showUserCreatedToast && <div className="user-created-toast">User created</div>}
      </div>
    )
  }

  if (currentPage === 'workspace') {
    return (
      <div key={currentPage} className="page-transition-shell">
        <WorkspacePage
          onBackHome={() => navigateTo('landing')}
          onNavigateToProfile={() => navigateTo('profile')}
          user={currentUser}
          onLogout={handleLogout}
          theme={theme}
          setTheme={setTheme}
          onToggleTheme={toggleTheme}
          accentColor={accentColor}
          onSelectAccent={handleSelectAccent}
          accentColorsList={ACCENT_COLORS}
        />
        {showUserCreatedToast && <div className="user-created-toast">User created</div>}
      </div>
    )
  }

  if (currentPage === 'profile') {
    // Redirect unauthenticated users to sign in
    if (!currentUser) {
      window.history.replaceState({ page: 'signin' }, '', '/signin')
      return (
        <div key="signin" className="page-transition-shell">
          <SignInPage
            onBackHome={() => navigateTo('landing')}
            theme={theme}
            onToggleTheme={toggleTheme}
            onAccountCreated={handleAccountCreated}
          />
          {showUserCreatedToast && <div className="user-created-toast">User created</div>}
        </div>
      )
    }
    return (
      <div key={currentPage} className="page-transition-shell">
        <ProfilePage
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onBackHome={() => navigateTo('landing')}
          onNavigateToWorkspace={() => navigateTo('workspace')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        {showUserCreatedToast && <div className="user-created-toast">User created</div>}
      </div>
    )
  }

  return (
    <div key={currentPage} className="page-transition-shell">
      <LandingPage
        user={currentUser}
        onNavigateToSignIn={() => navigateTo('signin')}
        onNavigateToWorkspace={() => navigateTo('workspace')}
        onNavigateToProfile={() => currentUser ? navigateTo('profile') : navigateTo('signin')}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {showUserCreatedToast && <div className="user-created-toast">User created</div>}
    </div>
  )
}

export default App
