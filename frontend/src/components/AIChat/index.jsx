import { useState } from 'react'
import { uploadDataset } from '../../services/api'

function AIChat() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  return (
    <div style={styles.chatPanel}>
      <div style={styles.header}>AI Assistant</div>
      <div style={styles.bubble}>I reviewed your latest query and found 2 anomalies in the sales cohort.</div>
      <div style={styles.reply}>Would you like me to generate a deeper breakdown?</div>
      <div style={styles.uploadRow}>
  <input
    type="file"
    accept=".csv,.xml,.xls,.xlsx"
    onChange={(event) => {
      const file = event.target.files?.[0] || null
      setSelectedFile(file)
      setUploadStatus('')
    }}
  />

  <button
  type="button"
  style={styles.uploadButton}
  disabled={!selectedFile || isUploading}
  onClick={async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadStatus('Uploading dataset...')

    try {
      const result = await uploadDataset(selectedFile)

      setUploadStatus(
        `✓ Dataset uploaded successfully. ${result.row_count} rows imported.`
      )
    } catch (error) {
      setUploadStatus(`✗ Upload failed: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }}
>
  {isUploading ? 'Uploading...' : 'Upload dataset'}
</button>
</div>

{uploadStatus && (
  <div style={styles.uploadStatus}>
    {uploadStatus}
  </div>
)}
      <div style={styles.inputRow}>
        <input style={styles.input} placeholder="Ask QueryX..." />
        <button style={styles.sendButton} type="button">Send</button>
      </div>
    </div>
  )
}

const styles = {
  chatPanel: {
    padding: '20px',
    borderRadius: '22px',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(15, 23, 42, 0.76)',
  },
  header: { marginBottom: '18px', fontWeight: 700, color: '#f8fafc' },
  bubble: {
    background: 'rgba(125, 211, 252, 0.12)',
    border: '1px solid rgba(125, 211, 252, 0.15)',
    color: '#e0f2fe',
    padding: '12px 14px',
    borderRadius: '14px 14px 14px 0',
    marginBottom: '12px',
  },
  reply: {
    background: 'rgba(52, 211, 153, 0.12)',
    border: '1px solid rgba(52, 211, 153, 0.18)',
    color: '#d1fae5',
    padding: '12px 14px',
    borderRadius: '14px 14px 0 14px',
    marginLeft: 'auto',
    maxWidth: '80%',
    marginBottom: '18px',
  },
  uploadRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },

  uploadButton: {
    border: 'none',
    borderRadius: '10px',
    background: '#334155',
    color: '#f8fafc',
    fontWeight: 600,
    padding: '10px 14px',
    cursor: 'pointer',
  },

  uploadStatus: {
    marginBottom: '14px',
    color: '#cbd5e1',
    fontSize: '14px',
  },
  inputRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  input: {
    flex: 1,
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    background: 'rgba(15, 23, 42, 0.9)',
    color: '#e2e8f0',
    padding: '12px 14px',
  },
  sendButton: {
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #8ec5ff, #a7f3d0)',
    color: '#0f172a',
    fontWeight: 700,
    padding: '12px 16px',
    cursor: 'pointer',
  },
}

export default AIChat
