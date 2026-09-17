function ChartCard() {
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.label}>Performance</div>
          <h3 style={styles.title}>Pipeline efficiency</h3>
        </div>
        <div style={styles.pill}>+18.2%</div>
      </div>

      <div style={styles.chart}>
        {[38, 52, 46, 58, 68, 64, 80, 90].map((height, index) => (
          <span key={index} style={{ ...styles.bar, height: `${height}%` }} />
        ))}
      </div>
    </div>
  )
}

const styles = {
  card: {
    padding: '20px',
    borderRadius: '22px',
    background: 'rgba(15, 23, 42, 0.76)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' },
  label: { color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { margin: '6px 0 0', color: '#f8fafc', fontSize: '1.12rem' },
  pill: {
    borderRadius: '999px',
    padding: '7px 10px',
    background: 'rgba(134, 239, 172, 0.12)',
    color: '#bbf7d0',
    border: '1px solid rgba(134,239,172,0.26)',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  chart: {
    height: '180px',
    display: 'flex',
    alignItems: 'end',
    gap: '10px',
    paddingTop: '10px',
  },
  bar: {
    flex: 1,
    borderRadius: '12px 12px 0 0',
    background: 'linear-gradient(180deg, #7dd3fc 0%, #a78bfa 100%)',
    boxShadow: '0 10px 18px rgba(125, 211, 252, 0.12)',
  },
}

export default ChartCard
