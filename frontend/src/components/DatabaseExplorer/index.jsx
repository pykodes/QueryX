const databases = [
  { name: 'CRM', type: 'PostgreSQL', status: 'Connected' },
  { name: 'Analytics', type: 'BigQuery', status: 'Syncing' },
  { name: 'Revenue', type: 'MySQL', status: 'Connected' },
]

function DatabaseExplorer() {
  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>Database Explorer</h3>
        <button style={styles.button} type="button">Add source</button>
      </div>

      <div style={styles.list}>
        {databases.map((db) => (
          <div key={db.name} style={styles.row}>
            <div style={styles.rowLeft}>
              <div style={styles.icon}>{db.name.slice(0, 1)}</div>
              <div>
                <div style={styles.dbName}>{db.name}</div>
                <div style={styles.dbType}>{db.type}</div>
              </div>
            </div>
            <span style={{ ...styles.status, ...(db.status === 'Syncing' ? styles.syncing : styles.connected) }}>
              {db.status}
            </span>
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
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' },
  title: { margin: 0, fontSize: '1.08rem', color: '#f8fafc' },
  button: {
    border: '1px solid rgba(125, 211, 252, 0.24)',
    borderRadius: '10px',
    background: 'rgba(125, 211, 252, 0.09)',
    color: '#e0f2fe',
    padding: '8px 12px',
    cursor: 'pointer',
  },
  list: { display: 'grid', gap: '12px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  rowLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  icon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(135deg, #7dd3fc, #93c5fd)',
    color: '#0f172a',
    fontWeight: 800,
  },
  dbName: { color: '#f8fafc', fontWeight: 700 },
  dbType: { color: '#94a3b8', fontSize: '0.75rem' },
  status: { fontSize: '0.72rem', padding: '6px 10px', borderRadius: '999px', fontWeight: 700 },
  connected: { background: 'rgba(134, 239, 172, 0.12)', color: '#bbf7d0', border: '1px solid rgba(134, 239, 172, 0.26)' },
  syncing: { background: 'rgba(125, 211, 252, 0.12)', color: '#bae6fd', border: '1px solid rgba(125, 211, 252, 0.26)' },
}

export default DatabaseExplorer
