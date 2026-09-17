 import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'
import './styles/landing.css'
import './styles/auth.css'
import './styles/workspace.css'

const getPageFromLocation = () => {
  if (typeof window === 'undefined') return 'landing'
  if (window.location.pathname === '/signin') return 'signin'
  if (window.location.pathname === '/workspace') return 'workspace'
  return 'landing'
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const savedTheme = window.localStorage.getItem('queryx-theme')
  return savedTheme === 'dark' ? 'dark' : 'light'
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
  if (!fullName || !fullName.trim()) return 'Q'
  const names = fullName.trim().split(/\s+/).filter(Boolean)
  return names.slice(0, 2).map((name) => name[0]?.toUpperCase() ?? '').join('') || 'Q'
}

function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromLocation())
  const [theme, setTheme] = useState(() => getInitialTheme())
  const [currentUser, setCurrentUser] = useState(() => getInitialUser())
  const [showUserCreatedToast, setShowUserCreatedToast] = useState(false)

  const navigateTo = (page) => {
    const nextPage = page === 'signin' ? 'signin' : page === 'workspace' ? 'workspace' : 'landing'
    const targetPath = nextPage === 'signin' ? '/signin' : nextPage === 'workspace' ? '/workspace' : '/'

    setCurrentPage(nextPage)
    window.history.pushState({ page: nextPage }, '', targetPath)
  }

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
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
    const handlePopState = () => {
      setCurrentPage(getPageFromLocation())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const targetPath = currentPage === 'signin' ? '/signin' : currentPage === 'workspace' ? '/workspace' : '/'

    if (window.location.pathname !== targetPath) {
      window.history.replaceState({ page: currentPage }, '', targetPath)
    }
  }, [currentPage])

  if (currentPage === 'signin') {
    return (
      <div key={currentPage} className="page-transition-shell">
        <SignInPage onBackHome={() => navigateTo('landing')} theme={theme} onToggleTheme={toggleTheme} onAccountCreated={handleAccountCreated} />
        {showUserCreatedToast && <div className="user-created-toast">User created</div>}
      </div>
    )
  }

  if (currentPage === 'workspace') {
    return (
      <div key={currentPage} className="page-transition-shell">
        <WorkspacePage onBackHome={() => navigateTo('landing')} theme={theme} onToggleTheme={toggleTheme} />
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
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {showUserCreatedToast && <div className="user-created-toast">User created</div>}
    </div>
  )
}

export default App
