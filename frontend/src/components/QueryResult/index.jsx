const metrics = [
  { label: 'Rows', value: '24.8k' },
  { label: 'Latency', value: '84ms' },
  { label: 'Cost', value: '$0.34' },
]

function QueryResult() {
  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>Query Result</h3>
        <button style={styles.button} type="button">Export</button>
      </div>

      <div style={styles.grid}>
        {metrics.map((metric) => (
          <div key={metric.label} style={styles.card}>
            <div style={styles.label}>{metric.label}</div>
            <div style={styles.value}>{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel: {
    padding: '20px',
    borderRadius: '22px',
    background: 'rgba(15, 23, 42, 0.76)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
  title: { margin: 0, fontSize: '1.08rem', color: '#f8fafc' },
  button: {
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '10px',
    background: 'transparent',
    color: '#e2e8f0',
    padding: '8px 12px',
    cursor: 'pointer',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' },
  card: {
    padding: '16px 14px',
    borderRadius: '16px',
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  label: { fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  value: { marginTop: '8px', fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc' },
}

export default QueryResult
