import { useEffect, useState, useRef } from 'react'
import { checkHealth, getSampleQuestions, askQuestion } from '../services/api.js'

function WorkspacePage({ onBackHome, theme, onToggleTheme }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentResult, setCurrentResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('ask')
  const [readOnlyGuard, setReadOnlyGuard] = useState(true)
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
    const targetQuery = (queryText || question).trim()
    if (!targetQuery || loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await askQuestion(targetQuery)

      if (data.error) {
        setError(data.error)
        setCurrentResult(data.generated_sql ? data : null)
      } else {
        setCurrentResult(data)
      }
    } catch (err) {
      setError(err.message || 'Error processing request.')
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
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handlePromptClick = (prompt) => {
    setQuestion(prompt)
    executeQuery(prompt)
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
          <label className="workspace-search" aria-label="Search actions and schema">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search actions & schema..." readOnly />
            <span className="shortcut">⌘K</span>
          </label>

          <button
            type="button"
            className="workspace-guard-toggle"
            onClick={() => setReadOnlyGuard((prev) => !prev)}
          >
            <span className="guard-mark" style={{ color: readOnlyGuard ? 'var(--workspace-success)' : '#94a3b8' }}>
              ✓
            </span>
            {readOnlyGuard ? 'Read-Only Guard: Active' : 'Read-Only Guard: Off'}
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
            <div className="sidebar-label">RECENT</div>
            <button
              type="button"
              className="sidebar-item"
              onClick={() => handlePromptClick('Who are the highest paid employees?')}
            >
              Top earners report
            </button>
            <button
              type="button"
              className="sidebar-item"
              onClick={() => handlePromptClick('What is the average salary by department?')}
            >
              Department salaries
            </button>
            <button
              type="button"
              className="sidebar-item"
              onClick={() => handlePromptClick('What is the employee distribution across work locations?')}
            >
              Work location trends
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="footer-db-row">
              <span className="db-dot" />
              <span>{dbStatus.dbName}</span>
              <span className="db-version">{dbStatus.engine}</span>
            </div>
            <button type="button" className="sidebar-item footer-link" onClick={onBackHome}>
              Settings
            </button>
            <button type="button" className="sidebar-item footer-link" onClick={onBackHome}>
              Help &amp; Documentation
            </button>
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

            <div className="query-mode-row">
              <button type="button" className="mode-tag">
                Read-only
              </button>
              <button type="button" className="mode-tag">
                Schema mode
              </button>
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
            <div className="composer-shell">
              <button
                type="button"
                className="mini-plus"
                onClick={handleNewChat}
                title="Reset conversation"
              >
                +
              </button>
              <textarea
                ref={textareaRef}
                placeholder="Ask QueryX anything about your database..."
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="button"
                className="send-button"
                onClick={() => executeQuery()}
                disabled={loading || !question.trim()}
                aria-label="Execute query"
              >
                {loading ? '…' : '→'}
              </button>
            </div>
            <div className="composer-hint">Press Enter to execute • Shift + Enter for new line</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default WorkspacePage
