import { useEffect, useState } from 'react'

function LandingPage({ user, onNavigateToSignIn, onNavigateToWorkspace, onLogout, theme, onToggleTheme }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const userInitial = user?.initials || user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'Q'

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12 },
    )

    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-page">
      <header className="topbar">
        <nav className="nav container" aria-label="Main navigation">
          <a href="#home" className="brand" aria-label="QueryX home">
            <span className="brand-mark">Q</span>
            <span className="brand-text">QueryX</span>
          </a>

          <div className={`nav-panel ${mobileNavOpen ? 'is-open' : ''}`}>
            <div className="nav-links">
              <a href="#home" className="nav-link active">Product</a>
              <a href="#features" className="nav-link">Features</a>
              <a href="#architecture" className="nav-link">Architecture</a>
              <a href="#docs" className="nav-link">Docs</a>
              <a href="#enterprise" className="nav-link">Enterprise</a>
            </div>

            <div className="nav-actions">
              <div className="theme-switcher" role="group" aria-label="Color theme switcher">
                <button type="button" className={`theme-option ${theme === 'light' ? 'active' : ''}`} onClick={() => theme !== 'light' && onToggleTheme()} aria-pressed={theme === 'light'}>
                  Light
                </button>
                <button type="button" className={`theme-option ${theme === 'dark' ? 'active' : ''}`} onClick={() => theme !== 'dark' && onToggleTheme()} aria-pressed={theme === 'dark'}>
                  Dark
                </button>
              </div>

              {user ? (
                <div className={`nav-user-wrapper ${menuOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="nav-user-avatar"
                    aria-label={`Signed in as ${user.fullName}`}
                    title={user.fullName}
                    aria-expanded={menuOpen}
                    aria-controls="user-menu"
                    onClick={() => setMenuOpen((open) => !open)}
                  >
                    {userInitial}
                  </button>

                  {menuOpen && (
                    <div id="user-menu" className="nav-user-menu" role="menu" aria-label="User menu">
                      <button type="button" className="nav-user-menu-item" onClick={() => setMenuOpen(false)}>Profile</button>
                      <button type="button" className="nav-user-menu-item" onClick={() => setMenuOpen(false)}>Work</button>
                      <button
                        type="button"
                        className="nav-user-menu-item danger"
                        onClick={() => {
                          setMenuOpen(false)
                          onLogout()
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button type="button" className="nav-signin" onClick={onNavigateToSignIn}>Log In</button>
                  <button type="button" className="button primary small" onClick={onNavigateToSignIn}>Get Started</button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            className="nav-toggle"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </header>

      <main>
        <section id="home" className="hero-section reveal">
          <div className="container hero-wrap">
            <div className="hero-badge">• • Introducing QueryX 3.0 • Autonomous Database Reasoning</div>
            <h1 className="hero-title">Ask Your Database Anything.<br />In Plain English.</h1>
            <p className="hero-copy">
              Connect any SQL or NoSQL database in seconds. Ask questions naturally and receive verified SQL<br />queries, interactive visual charts, schema insights, and verifiable enterprise explanations.
            </p>

            <div className="hero-actions">
              <button type="button" className="button primary hero-button" onClick={onNavigateToWorkspace}>Start Asking Free <span>→</span></button>
              <button type="button" className="button secondary hero-button">Connect Database</button>
            </div>

            <div className="hero-trust-row">
              <span>Zero training on private customer data</span>
              <span className="dot-sep">•</span>
              <span>SOC2 Type II Certified</span>
              <span className="dot-sep">•</span>
              <span>Read-only Safety Mode default</span>
            </div>

            <div className="dashboard-window">
              <div className="window-bar">
                <div className="traffic-lights">
                  <span className="red" />
                  <span className="yellow" />
                  <span className="green" />
                </div>
                <div className="window-title">production_analytics_db • PostgreSQL 16 (SSL)</div>
                <div className="window-status">
                  <span className="status-dot" />
                  <span>Connected • 12ms latency</span>
                  <span className="status-pill">Safe Mode: Read Only</span>
                </div>
              </div>

              <div className="workspace-body">
                <aside className="schema-panel">
                  <div className="schema-title">SCHEMA TREE</div>
                  <ul>
                    <li className="root">public</li>
                    <li className="child active">subscriptions</li>
                    <li className="leaf">id</li>
                    <li className="leaf">customer_id</li>
                    <li className="leaf">amount_cents</li>
                    <li className="leaf">status</li>
                    <li className="leaf">created_at</li>
                    <li className="root">orders</li>
                    <li className="root">customers</li>
                    <li className="root">event_logs</li>
                    <li className="root">mrr_snapshots</li>
                  </ul>
                </aside>

                <div className="editor-panel">
                  <div className="editor-header">
                    <div className="file-label">query_mrr_cohorts.sql</div>
                    <div className="file-meta">Generated by AI</div>
                    <div className="editor-actions">
                      <button type="button">Run</button>
                      <button type="button">Format</button>
                    </div>
                  </div>

                  <pre className="sql-code">{`SELECT DATE_TRUNC('month', created_at) AS billing_month,
       SUM(amount_cents) / 100.0 AS mrr,
       COUNT(DISTINCT customer_id) AS active_subscribers
FROM subscriptions
WHERE status = 'active'
GROUP BY 1
ORDER BY 1 DESC;`}</pre>

                  <div className="editor-footer">
                    <span>Execution: 34ms</span>
                    <span>Rows: 24</span>
                    <span>Scanned: 4.2 MB</span>
                    <span className="safe-pass">Safety Check: PASS</span>
                  </div>

                  <table className="result-table">
                    <thead>
                      <tr>
                        <th>billing_month</th>
                        <th>mrr ($)</th>
                        <th>active_subscribers</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2025-03-01 00:00:00</td>
                        <td>$128,450.00</td>
                        <td>1,420</td>
                      </tr>
                      <tr>
                        <td>2025-02-01 00:00:00</td>
                        <td>$114,200.00</td>
                        <td>1,289</td>
                      </tr>
                      <tr>
                        <td>2025-01-01 00:00:00</td>
                        <td>$98,750.00</td>
                        <td>1,104</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <aside className="analyst-panel">
                  <div className="analyst-header">
                    <div>Autonomous Co-Analyst</div>
                    <span>99.8% Confident</span>
                  </div>

                  <div className="prompt-block">
                    <div className="small-label">USER PROMPT</div>
                    <div className="prompt-text">“Show monthly MRR growth for Q3 and explain churn drivers by tier.”</div>
                  </div>

                  <div className="reasoning-block">
                    <div className="small-label">Reasoning Trace</div>
                    <ul>
                      <li>Filtered active recurring tiers</li>
                      <li>Excluded non-renewing trial credits</li>
                      <li>Normalized currency to USD base</li>
                    </ul>
                  </div>

                  <div className="visual-block">
                    <div className="small-label">INSTANT OUTPUT VISUAL</div>
                    <div className="mini-chart">
                      <span className="bar one" />
                      <span className="bar two" />
                      <span className="bar three" />
                    </div>
                  </div>

                  <div className="chat-input">
                    <span>Ask QueryX anything about this schema...</span>
                    <button type="button">→</button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal" id="features">
          <div className="container feature-shell feature-shell-top">
            <div className="feature-badge">01 / SYNTACTIC REASONING</div>
            <h2>Turn natural thought into optimal queries</h2>
            <p>
              Eliminate syntactical roadblocks. Transform conversational product inquiries into dialect-optimized,<br />index-aware SQL queries across your warehouse.
            </p>

            <div className="selector-pills">
              <span className="pill active">Natural Query</span>
              <span className="pill">Query Optimizer</span>
              <span className="pill">Dialect Translator</span>
            </div>

            <div className="demo-row">
              <div className="prompt-card">
                <div className="demo-label">CONVERSATIONAL PROMPT</div>
                <div className="prompt-quote">“Show customers who upgraded to Enterprise last month and spent over $5,000 in usage tokens.”</div>
                <div className="flash-row"><span>⚡</span> Optimized join path detected (3 tables)</div>
              </div>

              <div className="sql-card">
                <div className="demo-label">OPTIMIZED SQL OUTPUT (POSTGRES / SNOWFLAKE)</div>
                <pre>{`SELECT c.id, c.company_name, SUM(u.cost_usd) AS spend
FROM customers c
JOIN subscriptions s ON c.id = s.customer_id
JOIN usage_records u ON s.id = u.subscription_id
WHERE s.tier = 'enterprise'
  AND s.upgraded_at > NOW() - INTERVAL '1 month'
GROUP BY 1, 2
HAVING SUM(u.cost_usd) > 5000;`}</pre>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal" id="architecture">
          <div className="container split-feature">
            <div className="split-copy">
              <div className="feature-badge">02 / CONTEXTUAL MEMORY</div>
              <h2>Conversational intelligence that knows your entire schema</h2>
              <p>QueryX retains multi-turn thread context. Ask follow-up questions without re-stating filters, tables, or temporal definitions.</p>
              <ul className="check-list">
                <li>Deep relational entity graph mapping with cross-table awareness</li>
                <li>Dynamic session memory preserving cohort filters</li>
              </ul>
            </div>

            <div className="memory-card">
              <div className="memory-row">Prompt 1: “Which 5 cohorts have highest churn?”</div>
              <div className="memory-row muted">QueryX: “Identified Q1 Startup tier accounts (18.4% churn rate).”</div>
              <div className="memory-row">Follow-up Prompt: “Break those down by geographic region and primary database engine.”</div>
              <div className="memory-output">System: Auto-inherited cohort filter<br />[status='churned', tier='startup', quarter='Q1']<br />Generated JOIN customers ON region_id with zero user boilerplate.</div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container feature-shell feature-shell-verify">
            <div className="feature-badge">03 / VERIFIABILITY</div>
            <h2>Every query explained. No black boxes.</h2>
            <p>Engineers and compliance leads can audit precisely how each query was formulated, with step-by-step business logic breakdowns.</p>

            <div className="verify-cards">
              <div className="verify-card">
                <div className="verify-icon">◫</div>
                <h3>Line-by-Line Breakdown</h3>
                <p>Translates dense CTEs and window partition functions back into plain executive logic.</p>
              </div>
              <div className="verify-card">
                <div className="verify-icon">≌</div>
                <h3>Business Logic Verification</h3>
                <p>Flags edge conditions, zero division catches, and null value replacements explicitly.</p>
              </div>
              <div className="verify-card">
                <div className="verify-icon">⌁</div>
                <h3>Schema Lineage Trace</h3>
                <p>Trace downstream impacts and source table integrity in unified visual logs.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container visual-feature">
            <div className="chart-graphic">
              <div className="card-heading">
                <span>Live Charting Engine</span>
                <span>Direct SVG Rendering</span>
              </div>
              <div className="bars">
                <span style={{ height: '62%' }} />
                <span style={{ height: '84%' }} />
                <span style={{ height: '94%' }} />
                <span style={{ height: '76%' }} />
              </div>
              <div className="chart-footer">
                <span>Aggregated 42,910 rows in 18ms</span>
                <span>Export CSV / PNG</span>
              </div>
            </div>

            <div className="visual-copy">
              <div className="feature-badge">04 / VISUAL SYNTHESIS</div>
              <h2>Instant visualization without BI pipeline lag</h2>
              <p>Do not wait for engineering tickets to construct dashboards. QueryX automatically infers appropriate chart structures directly from returned schema types.</p>
              <div className="tag-row">
                <span>Area Charts</span>
                <span>Bar Trends</span>
                <span>Funnel Analysis</span>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container feature-shell feature-shell-security">
            <div className="feature-badge">05 / PERMISSION SHIELD</div>
            <h2>Strict guardrails against destructive queries &amp; data leaks</h2>
            <p>Operate with complete confidence. Multi-layer safety filters prevent write operations, mask PII, and restrict execution scopes.</p>
            <div className="security-alert">
              <div className="security-head">
                <div className="shield">🛡</div>
                <span>DESTRUCTIVE COMMAND INTERCEPTED</span>
                <span className="security-status">Action Blocked • Reason: Read-only Policy</span>
              </div>
              <div className="sql-strip">DROP TABLE customers CASCADE; // BLOCKED by Kernel Policy #SEC-402</div>
              <div className="security-grid">
                <div><strong>Read-Only Defaults</strong><p>Mutating operations rejected before database connection pool.</p></div>
                <div><strong>PII Masking</strong><p>Dynamic redaction on emails, credit tokens, and SSNs.</p></div>
                <div><strong>Audit Logs</strong><p>Complete immutable audit trail exported to your Datadog or S3.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal" id="docs">
          <div className="container health-layout">
            <div className="health-copy">
              <div className="feature-badge">06 / HEALTH MONITORING</div>
              <h2>Continuous schema health and anomaly detection</h2>
              <p>Identify corrupt records, unexpected NULL spikes, and foreign key drift before they contaminate downstream applications.</p>
              <ul className="bullet-list">
                <li>Foreign key orphan count: 0 (Validated)</li>
                <li>Schema migration sanity checks active</li>
              </ul>
            </div>

            <div className="monitor-card">
              <div className="monitor-item warning">
                <span>⚠</span>
                <div>Spike in NULL values detected in table event_logs.user_ip</div>
                <strong>+14.2% today</strong>
              </div>
              <div className="monitor-item success">
                <span>✓</span>
                <div>Duplicate primary key index scan completed</div>
                <strong>0 duplicates</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container feature-shell feature-shell-schema">
            <div className="feature-badge">07 / SCHEMA REASONING</div>
            <h2>Automated semantic dictionary and relationship mapping</h2>
            <p>Never decipher cryptic legacy column names alone. QueryX maps foreign relations and catalogs business terminology automatically.</p>

            <div className="schema-cards">
              <div className="mini-schema-card">
                <div className="small-label">TABLE: users</div>
                <div className="mini-row">PK: id (UUID)</div>
                <div className="mini-row">Mapped Relations:<br />→ orders (1:N)<br />→ subscriptions (1:1)</div>
              </div>
              <div className="mini-schema-card">
                <div className="small-label">TABLE: subscriptions</div>
                <div className="mini-row">FK: customer_id (UUID)</div>
                <div className="mini-row">Semantic Rule:<br />amount_cents represents gross value</div>
              </div>
              <div className="mini-schema-card">
                <div className="small-label">TABLE: billing_events</div>
                <div className="mini-row">FK: sub_id (UUID)</div>
                <div className="mini-row">Auto-indexed timestamp for cohort joins</div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container compatibility-shell">
            <div className="feature-badge">08 / UNIVERSAL COMPATIBILITY</div>
            <h2>One unified conversational interface for every engine</h2>
            <p>Native protocol adapters optimized for relational engines, high-scale analytical warehouses, and document databases.</p>

            <div className="compatibility-grid">
              <span className="engine-pill">PostgreSQL</span>
              <span className="engine-pill">Snowflake</span>
              <span className="engine-pill">MySQL</span>
              <span className="engine-pill">BigQuery</span>
              <span className="engine-pill">ClickHouse</span>
              <span className="engine-pill">MongoDB</span>
              <span className="engine-pill">Redis</span>
              <span className="engine-pill">SQL Server</span>
            </div>
          </div>
        </section>

        <section className="feature-block reveal" id="enterprise">
          <div className="container enterprise-shell">
            <h2>Engineered for Zero-Trust Enterprise<br />Environments</h2>
            <p>The architecture is designed specifically so your private schema records never leave your control.</p>

            <div className="enterprise-grid">
              <div className="enterprise-card">
                <div className="icon-bubble">◎</div>
                <h3>Trusted by Design</h3>
                <p>Deterministic AST query generation checks. 100% explainable reasoning steps before any query hits warehouse execution pools.</p>
                <ul>
                  <li>Zero hallucinated table joins</li>
                  <li>Isolated sandbox execution limits</li>
                  <li>Complete immutable audit trail</li>
                </ul>
              </div>

              <div className="enterprise-card">
                <div className="icon-bubble">✦</div>
                <h3>Works Across Your Stack</h3>
                <p>Connects in 60 seconds with VPC peering, read-only replica credentials, or hybrid on-prem Kubernetes proxy agents.</p>
                <ul>
                  <li>30+ native enterprise connectors</li>
                  <li>On-premises Docker container agent</li>
                  <li>TailScale / WireGuard VPC peering</li>
                </ul>
              </div>

              <div className="enterprise-card">
                <div className="icon-bubble">◌</div>
                <h3>Enterprise Security</h3>
                <p>Strict isolation guarantees. Zero customer rows are ever utilized for LLM fine-tuning or foundational weight training.</p>
                <ul>
                  <li>SOC2 Type II &amp; HIPAA compliant</li>
                  <li>In-flight dynamic PII obfuscation</li>
                  <li>SAML / Okta SSO integration</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container verification-shell">
            <h2>Autonomous Execution Verification Engine</h2>
            <p>Every generated query runs through our real-time 5-point verification pipeline.</p>

            <div className="pipeline-box">
              <div className="pipeline-head">
                <div className="pipeline-tag">PIPELINE #8491</div>
                <div className="pipeline-question">Question: “What is our customer acquisition cost by channel for last quarter?”</div>
                <div className="pipeline-badges">
                  <span>99.9% Confidence</span>
                  <span>PII Safe</span>
                </div>
              </div>
              <div className="pipeline-grid">
                <div className="pipeline-item"><h4>1. AST Validation</h4><p>Syntactically sound<br />Snowflake dialect</p></div>
                <div className="pipeline-item"><h4>2. Schema Bounds</h4><p>Tables: ad_spend, attribution (Verified)</p></div>
                <div className="pipeline-item"><h4>3. Cost Governor</h4><p>Estimated scanned bytes: &lt; 15 MB</p></div>
                <div className="pipeline-item"><h4>4. Read Only Lock</h4><p>Mutation safety confirmed</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-block reveal">
          <div className="container testimonials-shell">
            <h2>Trusted by Engineering &amp; Data Leaders</h2>
            <p>Empowering data teams to democratize insights without risking query sanity.</p>

            <div className="testimonial-grid">
              <article className="testimonial-card-lg">
                <p>“QueryX eliminated 70% of mundane ad-hoc query requests sent to our data engineering team. Product managers now self-serve answers with verified SQL backing every chart.”</p>
                <div className="person-name">Marcus Vance</div>
                <div className="person-role">VP of Engineering at ScaleOps</div>
              </article>

              <article className="testimonial-card-lg">
                <p>“The read-only guarantees and SOC2 compliance made security approvals effortless. We deployed inside our AWS VPC in an afternoon, and it immediately mapped our complex billing tables.”</p>
                <div className="person-name">Elena Rostova</div>
                <div className="person-role">Head of Data at FinMetrics</div>
              </article>

              <article className="testimonial-card-lg">
                <p>“Unlike other AI chat tools that make up non-existent columns, QueryX's schema reasoning verifies against foreign keys. The step-by-step logic trace is genuinely useful.”</p>
                <div className="person-name">David K. Chen</div>
                <div className="person-role">Principal Architect at CloudFleet</div>
              </article>
            </div>
          </div>
        </section>

        <section className="feature-block faq-shell reveal">
          <div className="container faq-wrap">
            <h2>Frequently Asked Questions</h2>
            <p>Clear technical answers to common database security and implementation questions.</p>

            <div className="faq-list">
              <div className="faq-item"><div className="faq-question">Does QueryX train on our database contents or sensitive records?</div><span>⌄</span></div>
              <div className="faq-item"><div className="faq-question">Can QueryX accidentally run destructive write or drop operations?</div><span>⌄</span></div>
              <div className="faq-item"><div className="faq-question">How does QueryX resolve complex ambiguous business logic?</div><span>⌄</span></div>
              <div className="faq-item"><div className="faq-question">Can we deploy QueryX self-hosted inside our own AWS/GCP VPC?</div><span>⌄</span></div>
              <div className="faq-item"><div className="faq-question">What database dialects and versions are supported out of the box?</div><span>⌄</span></div>
            </div>
          </div>
        </section>

        <section className="cta-section reveal">
          <div className="container cta-panel">
            <h2>Your Database. Your Questions. No SQL<br />Required.</h2>
            <p>Connect in less than 60 seconds with read-only credentials. Free forever for developers and small teams.</p>
            <div className="cta-actions">
              <button type="button" className="button primary large" onClick={onNavigateToSignIn}>Start Exploring Free</button>
              <button type="button" className="button secondary dark large">Book Enterprise Architecture Demo</button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer reveal">
        <div className="container footer-row">
          <div className="footer-brand">QueryX</div>
          <div className="footer-meta">© 2025 QueryX, Inc. High-craft database intelligence systems. All rights reserved.</div>
          <div className="footer-links-inline">
            <a href="#">Documentation</a>
            <a href="#">Changelog</a>
            <a href="#">Security &amp; Compliance</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
