function WorkspacePage({ onBackHome, theme, onToggleTheme }) {
  return (
    <div className="workspace-page">
      <header className="workspace-topbar">
        <div className="workspace-statusleft">
          <button type="button" className="workspace-back-button" onClick={onBackHome} aria-label="Back to landing page">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 5l-7 7 7 7M7 12h12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="workspace-live-pill">
            <span className="live-dot" />
            <span>Connected</span>
            <span className="pipe">•</span>
            <span>production_demo_db</span>
            <span className="pipe">•</span>
            <span>PostgreSQL 16</span>
            <span className="pipe">•</span>
            <span>12ms</span>
          </div>
        </div>

        <div className="workspace-head-actions">
          <label className="workspace-search" aria-label="Search actions and schema">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search actions & schema..." readOnly />
            <span className="shortcut">⌘K</span>
          </label>

          <button type="button" className="workspace-guard-toggle">
            <span className="guard-mark">✓</span>
            Read-Only Guard
          </button>

          <button type="button" className="workspace-theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="workspace-sidebar">
          <button type="button" className="new-chat-button">+ New Chat</button>

          <div className="sidebar-group">
            <div className="sidebar-label">WORKSPACE</div>
            <button type="button" className="sidebar-item active">Ask Database</button>
            <button type="button" className="sidebar-item">Insights</button>
            <button type="button" className="sidebar-item">Saved Queries</button>
          </div>

          <div className="sidebar-group">
            <div className="sidebar-label">RECENT</div>
            <button type="button" className="sidebar-item">Customer overview</button>
            <button type="button" className="sidebar-item">Revenue trends</button>
            <button type="button" className="sidebar-item">Retention report</button>
          </div>

          <div className="sidebar-footer">
            <div className="footer-db-row">
              <span className="db-dot" />
              <span>Production Demo DB</span>
              <span className="db-version">v16</span>
            </div>
            <button type="button" className="sidebar-item footer-link">Settings</button>
            <button type="button" className="sidebar-item footer-link">Help &amp; Documentation</button>
          </div>
        </aside>

        <main className="workspace-main">
          <div className="workspace-main-header">
            <div className="query-brand-row">
              <div className="query-brand">QUERYX AI DATABASE COPILOT</div>
              <div className="status-badge-mini">
                <span className="mini-dot" />
                Ready
              </div>
            </div>

            <div className="query-mode-row">
              <button type="button" className="mode-tag">Read-only</button>
              <button type="button" className="mode-tag">Schema mode</button>
            </div>
          </div>

          <div className="chat-empty-state">
            <div className="empty-icon">Q</div>
            <h1>Ask your database anything</h1>
            <p>Use natural language to explore tables, metrics, and trends without writing SQL.</p>

            <div className="quick-prompts">
              <button type="button" className="prompt-chip">Show revenue by region</button>
              <button type="button" className="prompt-chip">Find churn by cohort</button>
              <button type="button" className="prompt-chip">Summarize product performance</button>
            </div>
          </div>

          <div className="workspace-composer">
            <div className="composer-shell">
              <button type="button" className="mini-plus">+</button>
              <textarea placeholder="Ask QueryX anything about your database..." rows="1" />
              <button type="button" className="send-button">→</button>
            </div>
            <div className="composer-hint">Press Enter to execute • Shift + Enter for new line</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default WorkspacePage
