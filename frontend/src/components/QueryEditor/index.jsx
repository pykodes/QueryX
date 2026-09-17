function QueryEditor() {
  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>Query Editor</h3>
        <div style={styles.badges}>
          <span style={styles.badge}>SQL</span>
          <button style={styles.button} type="button">Run query</button>
        </div>
      </div>

      <pre style={styles.code}>
{`SELECT
  customer_id,
  SUM(total_amount) AS revenue,
  COUNT(*) AS orders
FROM sales_orders
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY customer_id
ORDER BY revenue DESC;`}
      </pre>
    </div>
  )
}

const styles = {
  panel: {
    padding: '18px',
    borderRadius: '22px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' },
  title: { margin: 0, fontSize: '1.1rem', color: '#f8fafc' },
  badges: { display: 'flex', alignItems: 'center', gap: '10px' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    background: 'rgba(147, 197, 253, 0.12)',
    color: '#bfdbfe',
    border: '1px solid rgba(147, 197, 253, 0.22)',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  button: {
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7dd3fc, #a7f3d0)',
    color: '#0f172a',
    padding: '9px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  code: {
    margin: 0,
    padding: '16px',
    borderRadius: '14px',
    background: '#020817',
    color: '#dbeafe',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    fontSize: '0.85rem',
    lineHeight: 1.7,
    overflowX: 'auto',
  },
}

export default QueryEditor
