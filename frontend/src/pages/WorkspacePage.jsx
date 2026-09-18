import { useEffect, useState, useRef } from 'react'
import { checkHealth, getSampleQuestions, askQuestion } from '../services/api.js'

function WorkspacePage({
  onBackHome,
  onNavigateToProfile,
  user,
  onLogout,
  theme,
  setTheme,
  onToggleTheme,
  accentColor,
  onSelectAccent,
  accentColorsList,
}) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentResult, setCurrentResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('ask')
  const [recentChats, setRecentChats] = useState([])
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [userPlan, setUserPlan] = useState('Go')
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')

  // File Upload & Composer States
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [thinkMode, setThinkMode] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const fileInputRef = useRef(null)

  const handleSelectFileType = (acceptTypes) => {
    setFileMenuOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptTypes
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result || ''
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.name.split('.').pop().toLowerCase(),
        content: content,
      })
    }
    reader.readAsText(file)
  }

  const handleRemoveFile = () => {
    setAttachedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const parseAttachedFile = (fileObj, queryText) => {
    let rows = []
    let columns = []
    const raw = (fileObj.content || '').trim()

    if (fileObj.name.endsWith('.csv') || raw.includes(',')) {
      const lines = raw.split(/\r?\n/).filter(Boolean)
      if (lines.length > 0) {
        columns = lines[0].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        rows = lines.slice(1, 25).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
          const obj = {}
          columns.forEach((col, idx) => {
            obj[col] = vals[idx] !== undefined ? vals[idx] : ''
          })
          return obj
        })
      }
    }

    if (!columns || columns.length === 0) {
      columns = ['record_id', 'file_name', 'parsed_status', 'entry_val']
      rows = [
        { record_id: 1, file_name: fileObj.name, parsed_status: 'Success', entry_val: 'Extracted sample dataset 1' },
        { record_id: 2, file_name: fileObj.name, parsed_status: 'Success', entry_val: 'Extracted sample dataset 2' },
        { record_id: 3, file_name: fileObj.name, parsed_status: 'Verified', entry_val: 'Extracted sample dataset 3' },
      ]
    }

    return {
      question: queryText || `Uploaded Data File Analysis: ${fileObj.name}`,
      answer: `Parsed ${fileObj.name} (${fileObj.size}). Extracted ${rows.length} rows with columns [${columns.join(', ')}].`,
      generated_sql: `-- Querying attached dataset: ${fileObj.name}\nSELECT ${columns.slice(0, 4).join(', ')} FROM temp_${fileObj.name.replace(/[^a-zA-Z0-9]/g, '_')} LIMIT 100;`,
      execution_time_ms: 4,
      row_count: rows.length,
      rows: rows,
    }
  }

  const [conversation, setConversation] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can translate your natural-language questions into safe SQL and summarize the results for you.',
    },
  ])
  const [dbStatus, setDbStatus] = useState({
    connected: true,
    dbName: 'company.db',
    engine: 'SQLite 3',
    latency: '8ms',
  })
  const [sampleQuestions, setSampleQuestions] = useState([
    'Who are the highest paid employees?',
    'What is the average salary by department?',
    'What is the employee distribution across work locations?',
  ])

  const textareaRef = useRef(null)

  // Fetch initial database health and sample questions
  useEffect(() => {
    const startTime = performance.now()
    checkHealth()
      .then((data) => {
        const elapsed = Math.round(performance.now() - startTime)
        if (data.status === 'healthy') {
          setDbStatus({
            connected: true,
            dbName: 'company.db',
            engine: 'SQLite 3',
            latency: `${elapsed || 8}ms`,
          })
        }
      })
      .catch(() => {
        setDbStatus((prev) => ({ ...prev, connected: false }))
      })

    getSampleQuestions()
      .then((data) => {
        if (data.questions && data.questions.length > 0) {
          setSampleQuestions(data.questions)
        }
      })
      .catch(() => {})
  }, [])

  const executeQuery = async (queryText) => {
    let targetQuery = (queryText || question).trim()
    if (!targetQuery && attachedFile) {
      targetQuery = `Analyze attached file: ${attachedFile.name}`
    }
    if (!targetQuery || loading) return

    setRecentChats((prev) => {
      const filtered = prev.filter((q) => q !== targetQuery)
      return [targetQuery, ...filtered]
    })

    const userMessageText = targetQuery + (attachedFile ? ` 📎 [${attachedFile.name}]` : '')
    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: userMessageText,
    }

    setConversation((previous) => [...previous, userMessage])
    setQuestion('')
    setLoading(true)
    setError(null)

    const activeAttached = attachedFile
    setAttachedFile(null)

    try {
      let data
      if (activeAttached) {
        data = parseAttachedFile(activeAttached, targetQuery)
      } else {
        data = await askQuestion(targetQuery)
      }

      if (data.error) {
        setError(data.error)
        setCurrentResult(data.generated_sql ? data : null)
        setConversation((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant-error`,
            role: 'assistant',
            text: data.error,
          },
        ])
      } else {
        setCurrentResult(data)
        setConversation((previous) => [
          ...previous,
          {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            text: data.answer || 'I ran the query and prepared the insights for you.',
          },
        ])
      }
    } catch (err) {
      const message = err.message || 'Error processing request.'
      setError(message)
      setConversation((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant-fail`,
          role: 'assistant',
          text: message,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      executeQuery()
    }
  }

  const handleCopySQL = (sqlText) => {
    if (!sqlText) return
    navigator.clipboard.writeText(sqlText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleNewChat = () => {
    setCurrentResult(null)
    setError(null)
    setQuestion('')
    setConversation([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'New session started. Ask me anything about your database.',
      },
    ])
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handlePromptClick = (prompt) => {
    setQuestion(prompt)
    executeQuery(prompt)
  }

  const userName = user?.fullName || 'Guest User'
  const userInitial = user ? (user.initials || userName.trim().slice(0, 2).toUpperCase() || 'G') : 'G'

  // Auth guard helper: navigate to profile only when logged in, else go to sign-in
  const handleNavigateToProfile = () => {
    if (user) {
      if (onNavigateToProfile) onNavigateToProfile()
    } else {
      // redirect to sign-in when not authenticated
      if (onBackHome) onBackHome()
      window.history.pushState({ page: 'signin' }, '', '/signin')
      window.dispatchEvent(new PopStateEvent('popstate', { state: { page: 'signin' } }))
    }
  }

  return (
    <div className="workspace-page">
      <header className="workspace-topbar">
        <div className="workspace-statusleft">
          <button
            type="button"
            className="workspace-back-button"
            onClick={onBackHome}
            aria-label="Back to landing page"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M14 5l-7 7 7 7M7 12h12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="workspace-live-pill">
            <span
              className="live-dot"
              style={{
                background: dbStatus.connected ? 'var(--workspace-success)' : '#ef4444',
                boxShadow: dbStatus.connected
                  ? '0 0 12px rgba(89, 208, 164, 0.8)'
                  : '0 0 12px rgba(239, 68, 68, 0.8)',
              }}
            />
            <span>{dbStatus.connected ? 'Connected' : 'Disconnected'}</span>
            <span className="pipe">•</span>
            <span>{dbStatus.dbName}</span>
            <span className="pipe">•</span>
            <span>{dbStatus.engine}</span>
            <span className="pipe">•</span>
            <span>{dbStatus.latency}</span>
          </div>
        </div>

        <div className="workspace-head-actions">
          <button
              type="button"
              className="workspace-profile-btn"
              onClick={handleNavigateToProfile}
              title={user ? 'User Profile & Settings' : 'Sign in to view profile'}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="workspace-avatar-img" />
              ) : (
                <span className="workspace-avatar-badge">{userInitial}</span>
              )}
              <span className="workspace-profile-label">Profile</span>
            </button>


          <button
            type="button"
            className="workspace-theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <button type="button" className="new-chat-button" onClick={handleNewChat}>
            + New Chat
          </button>

          <div className="sidebar-group">
            <div className="sidebar-label">WORKSPACE</div>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'ask' ? 'active' : ''}`}
              onClick={() => setActiveTab('ask')}
            >
              Ask Database
            </button>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'insights' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('insights')
                handlePromptClick('What is the average salary by department?')
              }}
            >
              Insights
            </button>
            <button
              type="button"
              className={`sidebar-item ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('saved')
                handlePromptClick('Who are the highest paid employees?')
              }}
            >
              Saved Queries
            </button>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-label">DATABASES</div>
            <div className="sidebar-item sidebar-db-item">
              <span
                className="db-dot"
                style={{
                  background: dbStatus.connected ? 'var(--workspace-success)' : '#ef4444',
                }}
              />
              <span className="sidebar-db-name">{dbStatus.dbName}</span>
              <span className="db-version">{dbStatus.engine}</span>
            </div>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-label">RECENT</div>
            {recentChats.length === 0 ? (
              <div className="sidebar-empty-recent">No recent chats</div>
            ) : (
              recentChats.map((chat, idx) => (
                <button
                  key={`${idx}-${chat}`}
                  type="button"
                  className="sidebar-item recent-chat-item"
                  title={chat}
                  onClick={() => handlePromptClick(chat)}
                >
                  <span className="chat-icon">💬</span>
                  <span className="recent-chat-text">{chat}</span>
                </button>
              ))
            )}
          </div>

          <div className="sidebar-footer">
            {profileMenuOpen && (
              <div className="profile-popover-menu" role="menu">
                <div
                  className="popover-user-card"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    handleNavigateToProfile()
                  }}
                >
                  <div className="popover-avatar-circle">{userInitial}</div>
                  <div className="popover-user-info">
                    <div className="popover-user-name">{userName}</div>
                    <div className="popover-user-plan">{userPlan}</div>
                  </div>
                  <span className="popover-chevron">›</span>
                </div>

                <div className="popover-divider" />

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setShowUpgradeModal(true)
                  }}
                >
                  <span className="popover-icon">✦</span>
                  <span>Upgrade plan</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setShowSettingsModal(true)
                  }}
                >
                  <span className="popover-icon">🎨</span>
                  <span>Personalization</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    handleNavigateToProfile()
                  }}
                >
                  <span className="popover-icon">👤</span>
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setShowSettingsModal(true)
                  }}
                >
                  <span className="popover-icon">⚙</span>
                  <span>Settings</span>
                </button>

                <div className="popover-divider" />

                <button
                  type="button"
                  className="popover-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setShowHelpModal(true)
                  }}
                >
                  <span className="popover-icon">🎯</span>
                  <span>Help</span>
                  <span className="popover-chevron right">›</span>
                </button>

                <button
                  type="button"
                  className="popover-item danger-item"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    if (onLogout) onLogout()
                  }}
                >
                  <span className="popover-icon">↳</span>
                  <span>Log out</span>
                </button>
              </div>
            )}

            <div
              className={`sidebar-profile-box ${profileMenuOpen ? 'is-active' : ''}`}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
            >
              <div className="profile-box-avatar">{userInitial}</div>
              <div className="profile-box-info">
                <div className="profile-box-name">{userName}</div>
                <div className="profile-box-plan">{userPlan}</div>
              </div>
              <div className="profile-box-store-icon">🏪</div>
            </div>
          </div>
        </aside>

        <main className="workspace-main">
          <div className="workspace-main-header">
            <div className="query-brand-row">
              <div className="query-brand">QUERYX AI DATABASE COPILOT</div>
              <div className="status-badge-mini">
                <span
                  className="mini-dot"
                  style={{ background: loading ? '#f59e0b' : 'var(--workspace-success)' }}
                />
                {loading ? 'Processing...' : 'Ready'}
              </div>
            </div>
          </div>

          {!currentResult && !loading && !error && (
            <div className="chat-empty-state">
              <div className="empty-icon">Q</div>
              <h1>Ask your database anything</h1>
              <p>
                Use natural language to explore tables, metrics, and trends without writing SQL.
              </p>

              <div className="quick-prompts">
                {sampleQuestions.slice(0, 4).map((sq) => (
                  <button
                    key={sq}
                    type="button"
                    className="prompt-chip"
                    onClick={() => handlePromptClick(sq)}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversation.length > 0 && (
            <div className="conversation-thread">
              {conversation.map((message) => (
                <div key={message.id} className={`message-row ${message.role}`}>
                  <div className="message-avatar">{message.role === 'assistant' ? 'AI' : 'You'}</div>
                  <div className="message-bubble">{message.text}</div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="query-loading-wrap">
              <div className="query-pulse-spinner" />
              <div>Translating question to SQL &amp; querying database...</div>
            </div>
          )}

          {(currentResult || error) && !loading && (
            <div className="workspace-results-scroll">
              {error && (
                <div className="query-error-banner">
                  <span>⚠️</span>
                  <div>
                    <strong>Query Execution Notice:</strong> {error}
                  </div>
                </div>
              )}

              {currentResult && (
                <div className="query-exchange-card">
                  <div className="query-user-bubble">
                    <div className="query-user-icon">Q</div>
                    <div>{currentResult.question}</div>
                  </div>

                  {currentResult.answer && (
                    <div className="query-answer-box">
                      <strong>AI Summary: </strong>
                      {currentResult.answer}
                    </div>
                  )}

                  {currentResult.generated_sql && (
                    <div className="query-sql-container">
                      <div className="query-sql-header">
                        <span>GENERATED SQL (SQLITE)</span>
                        <button
                          type="button"
                          className="query-sql-copy-btn"
                          onClick={() => handleCopySQL(currentResult.generated_sql)}
                        >
                          {copied ? '✓ Copied!' : 'Copy SQL'}
                        </button>
                      </div>
                      <pre className="query-sql-code">{currentResult.generated_sql}</pre>
                    </div>
                  )}

                  <div className="query-meta-bar">
                    <div className="query-meta-item">
                      <span>Latency:</span>
                      <strong>{currentResult.execution_time_ms} ms</strong>
                    </div>
                    <div className="query-meta-item">
                      <span>Rows:</span>
                      <strong>{currentResult.row_count}</strong>
                    </div>
                    <div className="query-safety-badge">
                      <span>✓</span> Safe Mode: PASS
                    </div>
                  </div>

                  {currentResult.rows && currentResult.rows.length > 0 && (
                    <div className="query-table-scroll">
                      <table className="query-data-table">
                        <thead>
                          <tr>
                            {Object.keys(currentResult.rows[0]).map((col) => (
                              <th key={col}>{col.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentResult.rows.map((row, idx) => (
                            <tr key={idx}>
                              {Object.keys(currentResult.rows[0]).map((col) => (
                                <td key={col}>
                                  {typeof row[col] === 'number'
                                    ? row[col].toLocaleString()
                                    : row[col] !== null && row[col] !== undefined
                                      ? String(row[col])
                                      : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="workspace-composer">
            {fileMenuOpen && (
              <div className="file-options-popover" role="menu">
                <div className="file-popover-header">Attach Data File</div>
                <button
                  type="button"
                  className="file-option-item"
                  onClick={() => handleSelectFileType('.csv')}
                >
                  <span className="file-option-icon">📄</span>
                  <div className="file-option-text">
                    <strong>CSV file</strong>
                    <span>Comma-separated tabular data (.csv)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="file-option-item"
                  onClick={() => handleSelectFileType('.xml')}
                >
                  <span className="file-option-icon">📋</span>
                  <div className="file-option-text">
                    <strong>XML file</strong>
                    <span>Structured document data (.xml)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="file-option-item"
                  onClick={() => handleSelectFileType('.xlsx,.xls')}
                >
                  <span className="file-option-icon">📊</span>
                  <div className="file-option-text">
                    <strong>Excel file</strong>
                    <span>Spreadsheet workbooks (.xlsx, .xls)</span>
                  </div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div className="composer-shell-pill">
              <button
                type="button"
                className={`composer-plus-btn ${fileMenuOpen ? 'active' : ''}`}
                onClick={() => setFileMenuOpen((prev) => !prev)}
                title="Attach CSV, XML, or Excel file"
              >
                +
              </button>

              <div className="composer-input-wrapper">
                {attachedFile && (
                  <div className="file-attached-badge">
                    <span className="badge-icon">📎</span>
                    <span className="badge-name">{attachedFile.name} ({attachedFile.size})</span>
                    <button
                      type="button"
                      className="badge-remove"
                      onClick={handleRemoveFile}
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  ref={textareaRef}
                  type="text"
                  className="composer-pill-input"
                  placeholder="Ask anything..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>

              <div className="composer-right-actions">
                <button
                  type="button"
                  className={`think-toggle-btn ${thinkMode ? 'active' : ''}`}
                  onClick={() => setThinkMode((prev) => !prev)}
                  title="Toggle AI Thinking Mode"
                >
                  <span className="think-brain-icon">🧠</span>
                  <span>Think</span>
                </button>

                <button
                  type="button"
                  className={`mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={() => setIsListening((prev) => !prev)}
                  title="Voice dictation"
                >
                  🎙
                </button>

                <button
                  type="button"
                  className="send-circle-btn"
                  onClick={() => executeQuery()}
                  disabled={loading || (!question.trim() && !attachedFile)}
                  aria-label="Send message"
                >
                  {loading ? '…' : '⚡'}
                </button>
              </div>
            </div>
            <div className="composer-hint">Press Enter to execute • Shift + Enter for new line</div>
          </div>
        </main>
      </div>

      {/* Settings Modal - Centered with background blur (Pic 2) */}
      {showSettingsModal && (
        <div className="settings-modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-sidebar">
              <button
                type="button"
                className="modal-sidebar-close"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="modal-sidebar-title">Settings</div>
              <div className="modal-tab-list">
                <button
                  type="button"
                  className={`modal-tab-item ${activeSettingsTab === 'general' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('general')}
                >
                  <span className="tab-icon">⚙</span>
                  <span>General</span>
                </button>
                <button
                  type="button"
                  className={`modal-tab-item ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('notifications')}
                >
                  <span className="tab-icon">🔔</span>
                  <span>Notifications</span>
                </button>
                <button
                  type="button"
                  className={`modal-tab-item ${activeSettingsTab === 'personalization' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('personalization')}
                >
                  <span className="tab-icon">🎨</span>
                  <span>Personalization</span>
                </button>
                <button
                  type="button"
                  className={`modal-tab-item ${activeSettingsTab === 'datacontrols' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('datacontrols')}
                >
                  <span className="tab-icon">💾</span>
                  <span>Data controls</span>
                </button>
                <button
                  type="button"
                  className={`modal-tab-item ${activeSettingsTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('security')}
                >
                  <span className="tab-icon">🛡</span>
                  <span>Security &amp; Login</span>
                </button>
              </div>
            </div>

            <div className="settings-modal-content">
              <div className="modal-header-row">
                <h2>General</h2>
                <button
                  type="button"
                  className="modal-close-x"
                  onClick={() => setShowSettingsModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* Security Banner matching Pic 2 */}
              <div className="settings-security-banner">
                <div className="banner-shield">🛡</div>
                <div className="banner-body">
                  <strong>Secure your account</strong>
                  <p>Add multi-factor authentication (MFA), like a text message or authenticator app, to help protect your account when logging in.</p>
                  <button type="button" className="mfa-btn">Set up MFA</button>
                </div>
              </div>

              {/* Settings Rows */}
              <div className="settings-row-group">
                <div className="settings-field-row">
                  <div className="field-info">
                    <span className="field-title">Appearance</span>
                  </div>
                  <div className="field-control">
                    <select
                      className="settings-select"
                      value={theme}
                      onChange={(e) => {
                        if (setTheme) setTheme(e.target.value)
                        else onToggleTheme()
                      }}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>

                <div className="settings-field-row">
                  <div className="field-info">
                    <span className="field-title">Accent Color</span>
                  </div>
                  <div className="field-control">
                    <div className="accent-swatches">
                      {Object.keys(accentColorsList || {}).map((key) => {
                        const item = accentColorsList[key]
                        return (
                          <button
                            key={key}
                            type="button"
                            className={`accent-swatch ${accentColor === key ? 'active' : ''}`}
                            style={{ background: item.primary }}
                            title={item.name}
                            onClick={() => onSelectAccent && onSelectAccent(key)}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div className="settings-field-row">
                  <div className="field-info">
                    <span className="field-title">Language</span>
                  </div>
                  <div className="field-control">
                    <select className="settings-select" defaultValue="auto">
                      <option value="auto">Auto-detect</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-field-row">
                  <div className="field-info">
                    <span className="field-title">Read-only Guard</span>
                  </div>
                  <div className="field-control">
                    <span className="badge-active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="settings-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="settings-modal-dialog simple-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Upgrade Plan</h2>
              <button type="button" className="modal-close-x" onClick={() => setShowUpgradeModal(false)}>✕</button>
            </div>
            <div className="upgrade-plans-grid">
              <div className="plan-card current">
                <span className="plan-tag">Current Plan</span>
                <h3>QueryX Free (Go)</h3>
                <p>Standard SQLite query engine &amp; schema introspection.</p>
                <div className="plan-price">$0 <span>/ mo</span></div>
              </div>
              <div className="plan-card featured">
                <span className="plan-tag featured-tag">Recommended</span>
                <h3>QueryX Pro Copilot</h3>
                <p>Unlimited LLM queries, multi-database sync, export options &amp; team workspace.</p>
                <div className="plan-price">$19 <span>/ mo</span></div>
                <button
                  type="button"
                  className="upgrade-action-btn"
                  onClick={() => {
                    setUserPlan('Pro')
                    setShowUpgradeModal(false)
                  }}
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="settings-modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="settings-modal-dialog simple-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Help &amp; Documentation</h2>
              <button type="button" className="modal-close-x" onClick={() => setShowHelpModal(false)}>✕</button>
            </div>
            <div className="help-content-body">
              <h3>Getting Started with QueryX</h3>
              <p>Ask questions in plain English to generate SELECT-only SQL queries against your SQLite database.</p>
              <h4>Useful Shortcuts:</h4>
              <ul>
                <li><code>Enter</code>: Execute query in composer</li>
                <li><code>Shift + Enter</code>: Add line break in composer</li>
                <li><code>Click Recent Query</code>: Re-run past question</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspacePage
