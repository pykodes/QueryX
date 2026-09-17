import Navbar from '../../components/Navbar'
import Floating3D from '../../components/Floating3D'

function LandingPage({ onNavigate }) {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <Navbar />

        <section style={styles.hero}>
          <div style={styles.heroText}>
            <span style={styles.kicker}>Data intelligence platform</span>
            <h1 style={styles.title}>Turn every dataset into a decision engine.</h1>
            <p style={styles.subtitle}>
              Query, model, and automate your operations inside one connected workspace built for product, finance, and analytics teams.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryButton} type="button" onClick={() => onNavigate('signup')}>Get started</button>
              <button style={styles.secondaryButton} type="button" onClick={() => onNavigate('login')}>Book demo</button>
            </div>

            <div style={styles.statsRow}>
              <div>
                <strong style={styles.statValue}>3.2x</strong>
                <span style={styles.statLabel}>faster insights</span>
              </div>
              <div>
                <strong style={styles.statValue}>42k</strong>
                <span style={styles.statLabel}>queries/day</span>
              </div>
              <div>
                <strong style={styles.statValue}>99.98%</strong>
                <span style={styles.statLabel}>uptime</span>
              </div>
            </div>
          </div>

          <div style={styles.visualWrap}>
            <Floating3D />
          </div>
        </section>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, rgba(125,211,252,0.12), transparent 25%), #020817',
    color: '#e2e8f0',
    padding: '32px 24px 60px',
  },
  shell: { maxWidth: '1280px', margin: '0 auto', display: 'grid', gap: '32px' },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    alignItems: 'center',
    gap: '30px',
    padding: '24px 6px 0',
  },
  heroText: { display: 'grid', gap: '18px' },
  kicker: {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '8px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(125,211,252,0.2)',
    background: 'rgba(125,211,252,0.08)',
    color: '#bae6fd',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  title: { margin: 0, fontSize: 'clamp(2.8rem, 5vw, 5rem)', lineHeight: 1.05, color: '#f8fafc' },
  subtitle: { margin: 0, maxWidth: '640px', fontSize: '1.08rem', lineHeight: 1.7, color: '#cbd5e1' },
  ctaRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  primaryButton: {
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #7dd3fc, #a7f3d0)',
    color: '#0f172a',
    fontWeight: 800,
    padding: '14px 22px',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '12px',
    background: 'transparent',
    color: '#f8fafc',
    fontWeight: 700,
    padding: '14px 22px',
    cursor: 'pointer',
  },
  statsRow: {
    display: 'flex',
    gap: '28px',
    flexWrap: 'wrap',
    paddingTop: '8px',
  },
  statValue: { display: 'block', fontSize: '1.5rem', color: '#f8fafc' },
  statLabel: { display: 'block', marginTop: '4px', color: '#94a3b8', fontSize: '0.8rem' },
  visualWrap: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
}

export default LandingPage
