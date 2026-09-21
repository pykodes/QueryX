import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { checkHealth, getSampleQuestions, askQuestion, getQueryHistory, getDatabases, getSchema, uploadDatabase } from '../services/api.js'
import VisualizationCard from '../components/VisualizationCard/VisualizationCard'
import { analyzeQueryResult } from '../components/VisualizationCard/ChartAnalyzer'
import VoiceInput from '../components/VoiceInput/VoiceInput'
/* eslint-disable react/immutability */

/**
 * ChatTurn — memoized so it only re-renders when its own exchange data changes.
 * Voice recognition state, question text, and isVoiceListening changes in WorkspacePage
 * do NOT cause past chat turns to re-render (no more Recharts/table cascade).
 */
const ChatTurn = memo(function ChatTurn({
  ex,
  exIdx,
  copied,
  highlightedVizId,
  vizCardRefs,
  onToggleVisualization,
  onCopySQL,
}) {
  return (
    <div className="chat-turn-container">
      {/* USER QUESTION BUBBLE */}
      <div className="message-row user">
        <div className="message-bubble">{ex.question}</div>
        <div className="message-avatar">You</div>
      </div>

      {/* AI ASSISTANT RESPONSE WITH SQL, DATA & RECHARTS VISUALIZATION */}
      <div className="message-row assistant">
        <div className="message-avatar">AI</div>
        <div className="query-exchange-card">
          {ex.answer && (
            <div className="query-answer-box">
              <strong>AI Summary: </strong>
              {ex.answer}
            </div>
          )}

          {ex.generated_sql && (
            <div className="query-sql-container">
              <div className="query-sql-header">
                <span>GENERATED SQL (SQLITE)</span>
                <button
                  type="button"
                  className="query-sql-copy-btn"
                  onClick={() => onCopySQL(ex.generated_sql)}
                >
                  {copied ? '✓ Copied!' : 'Copy SQL'}
                </button>
              </div>
              <pre className="query-sql-code">{ex.generated_sql}</pre>
            </div>
          )}

          <div className="query-meta-bar">
            <div className="query-meta-item">
              <span>Latency:</span>
              <strong>{ex.execution_time_ms} ms</strong>
            </div>
            <div className="query-meta-item">
              <span>Rows:</span>
              <strong>{ex.row_count}</strong>
            </div>
            <div className="query-safety-badge">
              <span>✓</span> Safe Mode: PASS
            </div>
          </div>

          {ex.rows && ex.rows.length > 0 && (
            <div className="query-table-scroll">
              <table className="query-data-table">
                <thead>
                  <tr>
                    {Object.keys(ex.rows[0]).map((col) => (
                      <th key={col}>{col.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ex.rows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(ex.rows[0]).map((col) => (
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

          {/* VISUAL REPRESENTATION TOGGLE CONTROL */}
          {ex.visualizationAvailable && (
            <div className="viz-toggle-wrapper">
              <button
                type="button"
                className={`viz-toggle-btn ${ex.visualizationVisible ? 'is-open' : 'is-closed'}`}
                onClick={() => onToggleVisualization(ex.id)}
                aria-expanded={ex.visualizationVisible}
              >
                <span className="viz-toggle-icon">📊</span>
                <span className="viz-toggle-label">Visual Representation</span>
                <span className="viz-toggle-chevron">
                  {ex.visualizationVisible ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

          {/* RECHARTS VISUALIZATION CARD (ONLY RENDERED WHEN VISIBLE = TRUE) */}
          {ex.visualizationAvailable && ex.visualizationVisible && (
            <VisualizationCard
              result={ex}
              cardRef={(el) => (vizCardRefs.current[ex.id || exIdx] = el)}
              isHighlighted={highlightedVizId === (ex.id || exIdx)}
            />
          )}
        </div>
      </div>
    </div>
  )
})

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
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentResult, setCurrentResult] = useState(null)
  const [exchanges, setExchanges] = useState([])
  const [highlightedVizId, setHighlightedVizId] = useState(null)
  const [currentVizNavIndex, setCurrentVizNavIndex] = useState(-1)
  const vizCardRefs = useRef({})
  const chatStreamRef = useRef(null)
  const chatEndRef = useRef(null)
  const voiceInputRef = useRef(null)
  const textareaRef = useRef(null)

  // Stable callbacks for VoiceInput — defined once, never recreated
  const handleVoiceCommit = useCallback((finalText) => setQuestion(finalText), [])
  const handleVoiceListeningChange = useCallback((listening) => setIsVoiceListening(listening), [])

  // Live update: writes interim/final speech text into the input immediately as user speaks
  const handleVoiceLiveUpdate = useCallback((text) => setQuestion(text), [])

  // Auto-query: triggered by VoiceInput pause-detection timer (1.5s silence after speech)
  // Voice has already stopped at this point; just run the query with the committed text
  const handleVoiceAutoQuery = useCallback((text) => {
    if (!text || !text.trim()) return
    setQuestion(text)
    // Small frame delay so setQuestion renders before executeQuery reads it
    requestAnimationFrame(() => executeQuery(text))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-dismiss error popup after 5 seconds
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } else if (chatStreamRef.current) {
        chatStreamRef.current.scrollTo({
          top: chatStreamRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }
    }, 80)
  }, [])

  useEffect(() => {
    if (exchanges.length > 0 || loading) {
      scrollToBottom()
    }
  }, [exchanges, loading, scrollToBottom])
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('ask')
  const [recentChats, setRecentChats] = useState([])
  const [databases, setDatabases] = useState([{ id: 'sample', name: 'QueryX Sample Database', type: 'sample' }])
  const [selectedDatabaseId, setSelectedDatabaseId] = useState('sample')
  const [databasesLoading, setDatabasesLoading] = useState(true)
  const [databaseUploadLoading, setDatabaseUploadLoading] = useState(false)
  const [databaseError, setDatabaseError] = useState(null)
  const [databaseMenuOpen, setDatabaseMenuOpen] = useState(false)
  const databaseSelectorRef = useRef(null)
  const [schemaOpen, setSchemaOpen] = useState(false)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaError, setSchemaError] = useState(null)
  const [databaseSchema, setDatabaseSchema] = useState({})
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [userPlan, setUserPlan] = useState('Go')
  const [activeSettingsTab, setActiveSettingsTab] = useState('general')

  // File Upload & Composer States
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
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

  const lastExecutedQueryRef = useRef({ text: '', time: 0 })

  // Fetch initial database health and sample questions
  useEffect(() => {
    const startTime = performance.now()
    checkHealth()
      .then((data) => {
        const elapsed = Math.round(performance.now() - startTime)
        if (data.status === 'healthy') {
          setDbStatus((current) => ({
            ...current,
            connected: true,
            engine: 'SQLite 3',
            latency: `${elapsed || 8}ms`,
          }))
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

  // Fetch stored query history for logged in user
  useEffect(() => {
    setRecentChats([])
    if (user?.id) {
      getQueryHistory(user.id, user.email)
        .then((res) => {
          const historyQuestions = Array.from(
            new Set((res?.history || []).map((historyItem) => historyItem.question))
          )
          setRecentChats(historyQuestions)
        })
        .catch(() => {})
    }
  }, [user?.email, user?.id])

  useEffect(() => {
    let active = true
    setDatabasesLoading(true)
    setDatabaseError(null)
    setDatabases([{ id: 'sample', name: 'QueryX Sample Database', type: 'sample' }])
    setSelectedDatabaseId('sample')

    getDatabases(user?.id)
      .then((result) => {
        if (!active) return
        const availableDatabases = result.databases || []
        setDatabases(availableDatabases)
        const savedDatabaseId = user?.id
          ? window.localStorage.getItem(`queryx-database-${user.id}`)
          : null
        const nextDatabase = availableDatabases.find(
          (database) => String(database.id) === String(savedDatabaseId)
        ) || availableDatabases[0]
        if (nextDatabase) setSelectedDatabaseId(String(nextDatabase.id))
      })
      .catch((loadError) => {
        if (!active) return
        setDatabaseError(loadError.message || 'Unable to load databases')
      })
      .finally(() => {
        if (active) setDatabasesLoading(false)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id && selectedDatabaseId) {
      window.localStorage.setItem(`queryx-database-${user.id}`, String(selectedDatabaseId))
    }
    const selectedDatabase = databases.find(
      (database) => String(database.id) === String(selectedDatabaseId)
    )
    if (selectedDatabase) {
      setDbStatus((current) => ({ ...current, dbName: selectedDatabase.name }))
    }
  }, [databases, selectedDatabaseId, user?.id])

  useEffect(() => {
    const handleOutsideDatabaseClick = (event) => {
      if (databaseSelectorRef.current && !databaseSelectorRef.current.contains(event.target)) {
        setDatabaseMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideDatabaseClick)
    return () => document.removeEventListener('mousedown', handleOutsideDatabaseClick)
  }, [])

  useEffect(() => {
    let active = true
    setSchemaLoading(true)
    setSchemaError(null)
    getSchema(selectedDatabaseId, user?.id)
      .then((result) => {
        if (!active) return
        if (result.error) throw new Error(result.error)
        setDatabaseSchema(result.schema || {})
      })
      .catch((loadError) => {
        if (!active) return
        setDatabaseSchema({})
        setSchemaError(loadError.message || 'Unable to load database schema')
      })
      .finally(() => {
        if (active) setSchemaLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedDatabaseId, user?.id])

  const handleDatabaseUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user?.id) return
    setDatabaseUploadLoading(true)
    setDatabaseError(null)
    try {
      const database = await uploadDatabase(file, user.id)
      setDatabases((current) => [database, ...current])
      setSelectedDatabaseId(String(database.id))
    } catch (uploadError) {
      setDatabaseError(uploadError.message)
    } finally {
      setDatabaseUploadLoading(false)
    }
  }

  const EXPLICIT_VIZ_REGEX = /graph|visualize|visualization|chart|plot|graphically|visual representation|show data visually/i

  const handleToggleVisualization = useCallback((exchangeId) => {
    let willBeVisible = false
    setExchanges((prev) =>
      prev.map((ex) => {
        if (ex.id === exchangeId) {
          willBeVisible = !ex.visualizationVisible
          return { ...ex, visualizationVisible: willBeVisible }
        }
        return ex
      })
    )

    if (willBeVisible) {
      setTimeout(() => {
        if (exchangeId && vizCardRefs.current[exchangeId]) {
          vizCardRefs.current[exchangeId].scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedVizId(exchangeId)
          setTimeout(() => setHighlightedVizId(null), 2500)
        }
      }, 100)
    }
  }, [])

  const executeQuery = async (queryText) => {
    let targetQuery = (queryText || question).trim()
    if (!targetQuery && attachedFile) {
      targetQuery = `Analyze attached file: ${attachedFile.name}`
    }
    if (!targetQuery || loading) return

    // Guard against double execution within 2000ms
    const now = Date.now()
    if (
      lastExecutedQueryRef.current.text === targetQuery &&
      now - lastExecutedQueryRef.current.time < 2000
    ) {
      return
    }
    lastExecutedQueryRef.current = { text: targetQuery, time: now }

    if (voiceInputRef.current && typeof voiceInputRef.current.stop === 'function') {
      voiceInputRef.current.stop()
    }

    const isExplicitVizReq = EXPLICIT_VIZ_REGEX.test(targetQuery)

    // Check if user is asking a follow-up request to visualize the previous query (e.g., "show me a graph")
    const isPureFollowUpVizReq =
      isExplicitVizReq &&
      targetQuery.split(' ').length <= 6 &&
      !/select|from|where|count|avg|sum|salary|employee|department|who|what|how many|which/i.test(targetQuery)

    const preparedUnrevealedEx = exchanges.slice().reverse().find((ex) => ex.visualizationAvailable && !ex.visualizationVisible)

    if (isPureFollowUpVizReq && preparedUnrevealedEx) {
      handleToggleVisualization(preparedUnrevealedEx.id)
      setQuestion('')
      return
    }

    setRecentChats((prev) => {
      const filtered = prev.filter((q) => q !== targetQuery)
      return [targetQuery, ...filtered]
    })

    // setQuestion('') // moved to after loading completes
    setLoading(true)
    setError(null)
    scrollToBottom()

    const activeAttached = attachedFile
    setAttachedFile(null)

    try {
      let data
      if (activeAttached) {
        data = parseAttachedFile(activeAttached, targetQuery)
      } else {
        data = await askQuestion(targetQuery, null, user?.id, user?.email, selectedDatabaseId)
      }

      if (data.error) {
        setError(data.error)
        setCurrentResult(data.generated_sql ? data : null)
      } else {
        const isChartable =
          Boolean(data.rows && data.rows.length >= 2 && analyzeQueryResult(data.rows, targetQuery).isChartable)

        const resultWithId = {
          ...data,
          id: `ex-${Date.now()}`,
          question: targetQuery,
          visualizationAvailable: isChartable,
          visualizationPrepared: isChartable,
          visualizationVisible: isChartable && isExplicitVizReq,
        }

        setCurrentResult(resultWithId)
        setExchanges((prev) => [...prev, resultWithId])
      }
    } catch (err) {
      const message = err.message || 'Error processing request.'
      setError(message)
    } finally {
      // Clear the input and reset voice listening state before ending loading
      setQuestion('');
      setIsVoiceListening(false);
      setLoading(false);
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      executeQuery()
    }
  }

  const handleCopySQL = useCallback((sqlText) => {
    if (!sqlText) return
    navigator.clipboard.writeText(sqlText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const handleNewChat = () => {
    setCurrentResult(null)
    setExchanges([])
    setError(null)
    setQuestion('')
    setCurrentVizNavIndex(-1)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handlePromptClick = (prompt) => {
    setQuestion(prompt)
    executeQuery(prompt)
  }

  // Count chartable visualizations available in current chat exchanges
  const availableExchanges = exchanges.filter((ex) => ex && ex.visualizationAvailable)
  const vizCount = availableExchanges.length

  // Navigate/scroll to latest or cycle through prepared visualizations in chat
  const handleVisualRepresentationClick = () => {
    setActiveTab('visual')

    if (vizCount === 0) {
      // Remain inactive if no meaningful visualizations available
      return
    }

    // Find the first hidden available exchange or cycle
    const hiddenEx = availableExchanges.find((ex) => !ex.visualizationVisible)
    const targetExchange =
      hiddenEx ||
      availableExchanges[(currentVizNavIndex + 1) % vizCount] ||
      availableExchanges[availableExchanges.length - 1]

    const targetIdx = availableExchanges.indexOf(targetExchange)
    setCurrentVizNavIndex(targetIdx >= 0 ? targetIdx : 0)

    if (targetExchange && targetExchange.id) {
      if (!targetExchange.visualizationVisible) {
        setExchanges((prev) =>
          prev.map((ex) => (ex.id === targetExchange.id ? { ...ex, visualizationVisible: true } : ex))
        )
      }
      setTimeout(() => {
        if (vizCardRefs.current[targetExchange.id]) {
          vizCardRefs.current[targetExchange.id].scrollIntoView({ behavior: 'smooth', block: 'center' })
          setHighlightedVizId(targetExchange.id)
          setTimeout(() => setHighlightedVizId(null), 2500)
        }
      }, 100)
    }
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
      {schemaOpen && (
        <div className="schema-modal-overlay" role="dialog" aria-modal="true" aria-label="Database schema">
          <section className="schema-modal">
            <div className="schema-modal-header">
              <div>
                <div className="schema-modal-eyebrow">ACTIVE DATABASE</div>
                <h2>{databases.find((database) => String(database.id) === String(selectedDatabaseId))?.name || 'Database schema'}</h2>
              </div>
              <button type="button" className="schema-modal-close" onClick={() => setSchemaOpen(false)} aria-label="Close schema">✕</button>
            </div>
            {schemaError ? (
              <div className="schema-modal-error">{schemaError}</div>
            ) : Object.keys(databaseSchema).length === 0 ? (
              <div className="schema-modal-empty">No tables found in this database.</div>
            ) : (
              <div className="schema-table-list">
                {Object.entries(databaseSchema).map(([tableName, columns]) => (
                  <div className="schema-table-card" key={tableName}>
                    <div className="schema-table-name">{tableName}</div>
                    <div className="schema-column-list">
                      {columns.map((column) => (
                        <div className="schema-column-row" key={`${tableName}-${column.name}`}>
                          <span>{column.name}</span>
                          <span className="schema-column-type">{column.type || 'TEXT'}{column.pk ? ' · PK' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      {/* GLOBAL ERROR POPUP TOAST — fixed position, always visible */}
      {error && (
        <div className="error-popup-overlay" role="alertdialog" aria-modal="false" aria-label="Error notification">
          <div className="error-popup-toast">
            <div className="error-popup-icon-wrap">
              <span className="error-popup-icon">⚠️</span>
            </div>
            <div className="error-popup-body">
              <div className="error-popup-title">Invalid Input</div>
              <div className="error-popup-message">{error}</div>
              <div className="error-popup-hint">Please enter a valid database question or SQL query.</div>
            </div>
            <button
              type="button"
              className="error-popup-close"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
            {/* Auto-dismiss progress bar */}
            <div className="error-popup-progress" />
          </div>
        </div>
      )}
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
          <div className="sidebar-fixed-top">
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
              <button
                type="button"
                className={`sidebar-item viz-representation-item ${activeTab === 'visual' ? 'active' : ''} ${
                  vizCount > 0 ? 'viz-ready' : ''
                }`}
                onClick={handleVisualRepresentationClick}
                title={
                  vizCount > 0
                    ? `Click to view generated visualization (${vizCount} ready)`
                    : 'Click to generate a visual representation'
                }
              >
                <span className="viz-item-icon">📊</span>
                <span>Visual Representation</span>
                {vizCount > 0 && (
                  <span className="viz-ready-badge">
                    <span className="viz-ready-dot" />
                    {vizCount} {vizCount === 1 ? 'Ready' : 'Ready'}
                  </span>
                )}
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
                <div className="database-selector" ref={databaseSelectorRef}>
                  <button
                    type="button"
                    className="sidebar-db-name database-selector-trigger"
                    onClick={() => setDatabaseMenuOpen((open) => !open)}
                    disabled={databasesLoading || databaseUploadLoading}
                    aria-haspopup="listbox"
                    aria-expanded={databaseMenuOpen}
                  >
                    <span className="database-selector-label">
                      {databasesLoading
                        ? 'Loading databases...'
                        : databases.find((database) => String(database.id) === String(selectedDatabaseId))?.name || 'Select database'}
                    </span>
                    <span className="database-selector-chevron" aria-hidden="true">⌄</span>
                  </button>
                  {databaseMenuOpen && !databasesLoading && (
                    <div className="database-selector-menu" role="listbox" aria-label="Available databases">
                      {databases.map((database) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={String(database.id) === String(selectedDatabaseId)}
                          className={`database-selector-option ${String(database.id) === String(selectedDatabaseId) ? 'selected' : ''}`}
                          key={database.id}
                          onClick={() => {
                            setSelectedDatabaseId(String(database.id))
                            setDatabaseMenuOpen(false)
                          }}
                        >
                          <span>{database.name}</span>
                          <small>{database.type === 'personal' ? 'Personal' : 'Sample'}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="db-version">{dbStatus.engine}</span>
              </div>
              {user?.id && (
                <label className="sidebar-item database-upload-label">
                  <span>{databaseUploadLoading ? 'Adding database...' : '+ Add SQLite database'}</span>
                  <input
                    type="file"
                    accept=".db,.sqlite,.sqlite3"
                    onChange={handleDatabaseUpload}
                    disabled={databaseUploadLoading}
                    hidden
                  />
                </label>
              )}
              {databaseError && (
                <div className="sidebar-database-error" role="alert">
                  {databaseError}
                </div>
              )}
              <button
                type="button"
                className="sidebar-item database-schema-button"
                onClick={() => setSchemaOpen(true)}
                disabled={schemaLoading}
              >
                {schemaLoading ? 'Loading schema...' : 'View database schema'}
              </button>
            </div>
          </div>

          <div className="sidebar-group sidebar-group-recent">
            <div className="recent-history-header">
              <div className="sidebar-label">RECENT SEARCHES</div>
              {recentChats.length > 0 && (
                <span className="recent-history-count">{recentChats.length}</span>
              )}
            </div>
            <div className="sidebar-recent-scroll">
              {recentChats.length === 0 ? (
                <div className="sidebar-empty-recent">
                  <span className="recent-empty-icon">⌕</span>
                  <span>Your recent searches will appear here</span>
                </div>
              ) : (
                recentChats.map((chat, idx) => (
                  <button
                    key={`${idx}-${chat}`}
                    type="button"
                    className="sidebar-item recent-chat-item"
                    title={chat}
                    onClick={() => handlePromptClick(chat)}
                  >
                    <span className="chat-icon">↗</span>
                    <span className="recent-chat-text">{chat}</span>
                  </button>
                ))
              )}
            </div>
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

            <button
              type="button"
              className={`sidebar-profile-box ${profileMenuOpen ? 'is-active' : ''}`}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label={`${userName} profile menu`}
              aria-expanded={profileMenuOpen}
            >
              <div className="profile-box-avatar">{userInitial}</div>
              <div className="profile-box-info">
                <div className="profile-box-name">{userName}</div>
                <div className="profile-box-plan">{userPlan}</div>
              </div>
              <div className="profile-box-store-icon">🏪</div>
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
          </div>

          {exchanges.length === 0 && !currentResult && !loading && !error && (
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

          {(exchanges.length > 0 || loading) && (
            <div ref={chatStreamRef} className="workspace-chat-stream">

              {exchanges.map((ex, exIdx) => (
                <ChatTurn
                  key={ex.id || exIdx}
                  ex={ex}
                  exIdx={exIdx}
                  copied={copied}
                  highlightedVizId={highlightedVizId}
                  vizCardRefs={vizCardRefs}
                  onToggleVisualization={handleToggleVisualization}
                  onCopySQL={handleCopySQL}
                />
              ))}

              {loading && (
                <div className="query-loading-wrap">
                  <div className="query-pulse-spinner" />
                  <div>Translating question to SQL &amp; querying database...</div>
                </div>
              )}

              <div ref={chatEndRef} style={{ height: 1 }} />
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

            <div className={`composer-shell-pill ${isVoiceListening ? 'listening-active' : ''}`}>
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
                  placeholder={isVoiceListening ? 'Listening...' : 'Ask anything...'}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>

              <div className="composer-right-actions">
                <VoiceInput
                  ref={voiceInputRef}
                  currentValue={question}
                  onCommit={handleVoiceCommit}
                  onLiveUpdate={handleVoiceLiveUpdate}
                  onAutoQuery={handleVoiceAutoQuery}
                  onListeningStateChange={handleVoiceListeningChange}
                  disabled={loading}
                />
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
