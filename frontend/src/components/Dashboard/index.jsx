import ChartCard from '../ChartCard'
import QueryEditor from '../QueryEditor'
import QueryResult from '../QueryResult'
import DataTable from '../DataTable'
import AIChat from '../AIChat'

const statCards = [
  { label: 'Active queries', value: '1,284', delta: '+12.4%' },
  { label: 'Avg. response', value: '142ms', delta: '-9.1%' },
  { label: 'Data quality', value: '98.7%', delta: '+2.3%' },
]

function Dashboard() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.statGrid}>
        {statCards.map((card) => (
          <div key={card.label} style={styles.statCard}>
            <div style={styles.label}>{card.label}</div>
            <div style={styles.value}>{card.value}</div>
            <div style={styles.delta}>{card.delta}</div>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.leftColumn}>
          <ChartCard />
          <QueryEditor />
        </div>
        <div style={styles.rightColumn}>
          <QueryResult />
          <AIChat />
        </div>
      </div>

      <div style={styles.tableWrap}>
        <DataTable />
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'grid', gap: '18px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' },
  statCard: {
    padding: '18px',
    borderRadius: '20px',
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  label: { fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' },
  value: { marginTop: '10px', fontSize: '2rem', fontWeight: 800, color: '#f8fafc' },
  delta: { marginTop: '8px', color: '#86efac', fontWeight: 700 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: '18px' },
  leftColumn: { display: 'grid', gap: '18px' },
  rightColumn: { display: 'grid', gap: '18px' },
  tableWrap: { marginTop: '4px' },
}

export default Dashboard
