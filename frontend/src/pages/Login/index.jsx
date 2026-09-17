function LoginPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>QueryX</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Sign in to continue your workflows and dashboards.</p>

        <form style={styles.form}>
          <input style={styles.input} placeholder="Email address" />
          <input style={styles.input} type="password" placeholder="Password" />
          <button style={styles.submit} type="submit">Log in</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: 'radial-gradient(circle at top, rgba(125,211,252,0.12), transparent 24%), #020817',
    padding: '32px 20px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '32px 28px',
    borderRadius: '24px',
    background: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(148,163,184,0.18)',
    boxShadow: '0 18px 48px rgba(15,23,42,0.3)',
  },
  brand: { fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' },
  title: { margin: 0, fontSize: '2rem', color: '#f8fafc' },
  subtitle: { color: '#cbd5e1', lineHeight: 1.6, margin: '10px 0 24px' },
  form: { display: 'grid', gap: '14px' },
  input: {
    borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15, 23, 42, 0.7)',
    color: '#f8fafc',
    padding: '14px 16px',
    fontSize: '0.98rem',
  },
  submit: {
    marginTop: '8px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8ec5ff, #a7f3d0)',
    color: '#0f172a',
    fontWeight: 800,
    padding: '14px 16px',
    cursor: 'pointer',
  },
}

export default LoginPage
