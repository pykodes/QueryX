import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import './VoiceInput.css'

const VoiceInput = forwardRef(function VoiceInput(
  {
    onCommit,
    onLiveUpdate,   // NEW: called on every interim+final update → shows text in input live
    onAutoQuery,    // NEW: called after pause detected → auto-submits to LLM
    currentValue = '',
    disabled = false,
    lang = 'en-IN',
    onListeningStateChange,
  },
  ref
) {
  const [livePreview, setLivePreview] = useState('')
  const pauseTimerRef = useRef(null)   // auto-submit timer

  const {
    isSupported,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    setError,
  } = useSpeechRecognition({ defaultLang: lang })

  const handleStop = useCallback(() => {
    // Clear any pending auto-submit timer
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current)
      pauseTimerRef.current = null
    }
    const finalText = stopListening()
    setLivePreview('')
    if (finalText && onCommit) {
      onCommit(finalText)
    }
  }, [stopListening, onCommit])

  useImperativeHandle(
    ref,
    () => ({
      stop: handleStop,
    }),
    [handleStop]
  )

  // Notify parent of listening state changes only — not on every interim word
  // This prevents WorkspacePage from re-rendering when just the mic preview updates
  useEffect(() => {
    if (onListeningStateChange) {
      onListeningStateChange(isListening)
    }
  }, [isListening, onListeningStateChange])

  // Automatically stop listening if query starts executing / loading
  useEffect(() => {
    if (disabled && isListening) {
      handleStop()
    }
  }, [disabled, isListening, handleStop])

  // Auto-clear error toast after 4.5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 4500)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  const handleMicClick = useCallback(() => {
    if (disabled) return

    if (isListening) {
      handleStop()
    } else {
      setLivePreview(currentValue)
      startListening({
        lang,
        initialText: currentValue,

        // onFinal: confirmed speech fragment received
        // → update local preview, update main input live, start pause timer
        onFinal: (accumulatedText) => {
          setLivePreview(accumulatedText)

          // Push confirmed text to the main input immediately
          if (onLiveUpdate) onLiveUpdate(accumulatedText)

          // Pause detection: 1.5s after last confirmed word → auto-submit
          if (onAutoQuery) {
            if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
            pauseTimerRef.current = setTimeout(() => {
              pauseTimerRef.current = null
              // Stop mic first, then execute with the committed text
              const committed = stopListening()
              setLivePreview('')
              const textToSend = committed || accumulatedText
              if (textToSend) onAutoQuery(textToSend)
            }, 1500)
          }
        },

        // onInterim: partial speech (not yet confirmed) → show live in input
        onInterim: (_interimFragment, fullCombined) => {
          setLivePreview(fullCombined)
          // Update input with partial text so user can see what's being heard
          if (onLiveUpdate) onLiveUpdate(fullCombined)
          // Reset pause timer on new speech activity
          if (pauseTimerRef.current) {
            clearTimeout(pauseTimerRef.current)
            pauseTimerRef.current = null
          }
        },
      })
    }
  }, [disabled, isListening, handleStop, currentValue, lang, startListening, onLiveUpdate, onAutoQuery, stopListening])

  if (!isSupported) {
    return (
      <button
        type="button"
        className="mic-btn mic-btn-disabled"
        title="Voice input is not supported in this browser"
        disabled
      >
        🎙️
      </button>
    )
  }

  return (
    <div className="voice-input-container">
      {error && (
        <div className="voice-error-toast" role="alert" onClick={() => setError(null)}>
          <span className="toast-icon">⚠️</span>
          <span className="toast-text">{error}</span>
          <button type="button" className="toast-dismiss">✕</button>
        </div>
      )}

      <button
        type="button"
        className={`mic-btn ${isListening ? 'listening' : ''} ${status === 'processing' ? 'processing' : ''}`}
        onClick={handleMicClick}
        disabled={disabled}
        title={
          isListening
            ? 'Listening... Click to stop recording'
            : status === 'processing'
            ? 'Processing speech...'
            : 'Click for voice input (en-IN)'
        }
        aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
      >
        {isListening && <span className="rec-badge" />}
        {status === 'processing' ? (
          <span className="proc-spinner" />
        ) : (
          <span className="mic-icon">🎙️</span>
        )}
      </button>
    </div>
  )
})

export default VoiceInput
