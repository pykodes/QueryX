import Sidebar from '../../components/Sidebar'
import DatabaseExplorer from '../../components/DatabaseExplorer'
import ConnectionCard from '../../components/ConnectionCard'
import QueryEditor from '../../components/QueryEditor'
import DataTable from '../../components/DataTable'

function WorkspacePage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <Sidebar />

        <div style={styles.content}>
          <header style={styles.header}>
            <div>
              <div style={styles.kicker}>Workspace</div>
              <h1 style={styles.title}>Customer intelligence</h1>
            </div>
            <button style={styles.primaryButton} type="button">Sync data</button>
          </header>

          <div style={styles.topGrid}>
            <DatabaseExplorer />
            <ConnectionCard />
          </div>

          <QueryEditor />
          <DataTable />
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, rgba(125,211,252,0.12), transparent 20%), #020817',
    color: '#e2e8f0',
    padding: '28px 20px',
  },
  shell: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    gap: '22px',
  },
  content: { display: 'grid', gap: '18px' },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '18px 22px',
    borderRadius: '20px',
    background: 'rgba(15, 23, 42, 0.74)',
    border: '1px solid rgba(148,163,184,0.16)',
  },
  kicker: { color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em' },
  title: { margin: '6px 0 0', fontSize: '2rem', color: '#f8fafc' },
  primaryButton: {
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8ec5ff, #a7f3d0)',
    color: '#0f172a',
    fontWeight: 800,
    padding: '12px 18px',
    cursor: 'pointer',
  },
  topGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.6fr',
    gap: '18px',
  },
}

export default WorkspacePage
