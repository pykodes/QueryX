const navItems = ['Overview', 'Collections', 'Queries', 'Insights']

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.brandWrap}>
        <div style={styles.brandMark}>Q</div>
        <div>
          <div style={styles.brandName}>QueryX</div>
          <div style={styles.brandSub}>data workspace</div>
        </div>
      </div>

      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <button key={item} style={styles.navButton} type="button">
            {item}
          </button>
        ))}
      </div>

      <div style={styles.navActions}>
        <button style={styles.ghostButton} type="button">Docs</button>
        <button style={styles.primaryButton} type="button">Launch app</button>
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '18px 28px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '22px',
    background: 'rgba(15, 23, 42, 0.72)',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 10px 35px rgba(15, 23, 42, 0.22)',
  },
  brandWrap: { display: 'flex', alignItems: 'center', gap: '12px' },
  brandMark: {
    width: '40px',
    height: '40px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #7dd3fc, #c4b5fd)',
    color: '#0f172a',
    fontWeight: 800,
  },
  brandName: { fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' },
  brandSub: { fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' },
  navLinks: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  navButton: {
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'transparent',
    color: '#cbd5e1',
    borderRadius: '999px',
    padding: '8px 14px',
    cursor: 'pointer',
  },
  navActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  ghostButton: {
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent',
    color: '#e2e8f0',
    borderRadius: '12px',
    padding: '10px 14px',
    cursor: 'pointer',
  },
  primaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #8ec5ff, #a7f3d0)',
    color: '#0f172a',
    borderRadius: '12px',
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
}

export default Navbar
