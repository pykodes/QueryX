const menuItems = ['Overview', 'Workspaces', 'Connections', 'Models', 'Automation']

function Sidebar() {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>Workspace</div>
      <ul style={styles.list}>
        {menuItems.map((item, index) => (
          <li key={item} style={{ ...styles.item, ...(index === 0 ? styles.activeItem : {}) }}>
            <span style={styles.dot} />
            {item}
          </li>
        ))}
      </ul>

      <div style={styles.card}>
        <div style={styles.cardLabel}>Usage</div>
        <strong style={styles.cardValue}>84%</strong>
        <div style={styles.progressTrack}>
          <div style={styles.progressFill} />
        </div>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '260px',
    padding: '20px 18px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#e2e8f0',
  },
  header: { fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '18px' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 12px',
    borderRadius: '12px',
    fontWeight: 600,
    color: '#cbd5e1',
    background: 'transparent',
  },
  activeItem: {
    background: 'rgba(125, 211, 252, 0.12)',
    border: '1px solid rgba(125, 211, 252, 0.2)',
    color: '#f8fafc',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7dd3fc, #c4b5fd)',
    boxShadow: '0 0 14px rgba(125,211,252,.8)',
  },
  card: {
    marginTop: '24px',
    padding: '16px 14px',
    borderRadius: '16px',
    background: 'rgba(15, 118, 110, 0.14)',
    border: '1px solid rgba(45, 212, 191, 0.25)',
  },
  cardLabel: { fontSize: '0.72rem', color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: '0.12em' },
  cardValue: { display: 'block', margin: '10px 0 12px', fontSize: '1.7rem', color: '#f8fafc' },
  progressTrack: { height: '8px', background: 'rgba(148,163,184,0.2)', borderRadius: '999px', overflow: 'hidden' },
  progressFill: { width: '84%', height: '100%', borderRadius: 'inherit', background: 'linear-gradient(90deg, #67e8f9, #a7f3d0)' },
}

export default Sidebar
