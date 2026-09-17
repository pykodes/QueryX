const rows = [
  ['C-1021', 'Northwind', '$18,240', 'Complete'],
  ['C-2098', 'Apex Labs', '$13,560', 'In review'],
  ['C-5521', 'Beacon', '$27,840', 'Complete'],
  ['C-7600', 'Summit', '$9,180', 'Queued'],
]

function DataTable() {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Recent records</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Customer</th>
            <th style={styles.th}>Account</th>
            <th style={styles.th}>Revenue</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              <td style={styles.td}>{row[0]}</td>
              <td style={styles.td}>{row[1]}</td>
              <td style={styles.td}>{row[2]}</td>
              <td style={styles.td}>
                <span style={{ ...styles.status, ...(row[3] === 'Complete' ? styles.complete : styles.neutral) }}>
                  {row[3]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  title: { margin: '0 0 16px', color: '#f8fafc', fontSize: '1.08rem' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: '#e2e8f0',
    fontSize: '0.9rem',
  },
  th: {
    textAlign: 'left',
    padding: '12px 10px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
    color: '#94a3b8',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.7rem',
  },
  td: {
    padding: '13px 10px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
    color: '#e2e8f0',
  },
  status: { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: '999px', fontSize: '0.7rem' },
  complete: { background: 'rgba(52, 211, 153, 0.12)', color: '#bbf7d0', border: '1px solid rgba(52,211,153,0.22)' },
  neutral: { background: 'rgba(148,163,184,0.12)', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.2)' },
}

export default DataTable
