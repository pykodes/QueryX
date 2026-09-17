function ConnectionCard() {
  return (
    <div style={styles.card}>
      <div style={styles.header}>Connection health</div>
      <div style={styles.metric}>99.8%</div>
      <div style={styles.badge}>Stable</div>
      <div style={styles.subtitle}>Latency 240ms · 3 regions online</div>
    </div>
  )
}

const styles = {
  card: {
    padding: '20px 18px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(168, 85, 247, 0.12))',
    border: '1px solid rgba(125, 211, 252, 0.22)',
  },
  header: { fontSize: '0.7rem', color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: '0.12em' },
  metric: { fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginTop: '12px' },
  badge: {
    display: 'inline-block',
    marginTop: '10px',
    borderRadius: '999px',
    padding: '6px 10px',
    background: 'rgba(134, 239, 172, 0.12)',
    color: '#bbf7d0',
    border: '1px solid rgba(134, 239, 172, 0.2)',
    fontWeight: 700,
    fontSize: '0.72rem',
  },
  subtitle: { marginTop: '14px', color: '#cbd5e1', fontSize: '0.82rem' },
}

export default ConnectionCard
