function Floating3D() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.orbit} />
      <div style={{ ...styles.core, ...styles.coreOuter }} />
      <div style={{ ...styles.core, ...styles.coreInner }} />
      <div style={{ ...styles.core, ...styles.coreDot }} />
      {[...Array(8)].map((_, index) => (
        <span
          key={index}
          style={{
            ...styles.node,
            left: `${50 + Math.cos((index / 8) * Math.PI * 2) * 38}%`,
            top: `${50 + Math.sin((index / 8) * Math.PI * 2) * 38}%`,
          }}
        />
      ))}
    </div>
  )
}

const styles = {
  wrapper: {
    position: 'relative',
    width: '420px',
    height: '420px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(125,211,252,0.15), rgba(15,23,42,0.1) 55%, transparent 70%)',
  },
  orbit: {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    border: '1px solid rgba(125,211,252,0.2)',
    boxShadow: '0 0 35px rgba(125,211,252,0.12)',
  },
  core: { position: 'absolute', borderRadius: '50%' },
  coreOuter: {
    width: '180px',
    height: '180px',
    border: '1px solid rgba(191,219,254,0.22)',
  },
  coreInner: {
    width: '116px',
    height: '116px',
    border: '1px solid rgba(167,243,208,0.22)',
  },
  coreDot: {
    width: '24px',
    height: '24px',
    background: 'linear-gradient(135deg, #dbeafe, #a7f3d0)',
    boxShadow: '0 0 30px rgba(167,243,208,0.5)',
  },
  node: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 35% 35%, #f0f9ff, #7dd3fc, #1d4ed8 100%)',
    boxShadow: '0 0 20px rgba(125,211,252,0.7)',
  },
}

export default Floating3D
