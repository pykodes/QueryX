function SignupPage() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>Q</span>
          <span style={styles.brandText}>QueryX</span>
        </div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Start building with connected data pipelines and AI insight workflows.</p>

        <form style={styles.form}>
          <input style={styles.input} placeholder="Full name" />
          <input style={styles.input} placeholder="Email address" />
          <input style={styles.input} type="password" placeholder="Password" />
          <button style={styles.submit} type="submit">Sign up</button>
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
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    color: '#f8fafc',
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    letterSpacing: '-0.04em',
    fontWeight: 700,
  },
  brandMark: {
    width: '28px',
    height: '28px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.82rem',
    boxShadow: '0 12px 24px rgba(124, 58, 237, 0.22)',
  },
  brandText: {
    fontSize: '1.1rem',
    fontFamily: 'Inter, "Segoe UI", sans-serif',
    fontWeight: 700,
  },
  title: { margin: 0, fontSize: '2rem', color: '#f8fafc', fontFamily: 'Inter, "Segoe UI", sans-serif' },
  subtitle: { color: '#cbd5e1', lineHeight: 1.6, margin: '10px 0 24px', fontFamily: 'Inter, "Segoe UI", sans-serif' },
  form: { display: 'grid', gap: '14px' },
  input: {
    borderRadius: '12px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15, 23, 42, 0.7)',
    color: '#f8fafc',
    padding: '14px 16px',
    fontSize: '0.98rem',
    fontFamily: 'Inter, "Segoe UI", sans-serif',
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
    fontFamily: 'Inter, "Segoe UI", sans-serif',
  },
}

export default SignupPage
