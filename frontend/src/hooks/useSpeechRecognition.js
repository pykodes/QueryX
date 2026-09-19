import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom React hook for Web Speech API SpeechRecognition
 * Optimized for zero re-render lag, instant start/stop, and single instance lifecycle.
 */
export function useSpeechRecognition({ defaultLang = 'en-IN' } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'listening' | 'processing' | 'error'
  const [error, setError] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const isRecordingRef = useRef(false)
  const langRef = useRef(defaultLang)

  const initialPrefixRef = useRef('')
  const finalTranscriptRef = useRef('')
  const interimTranscriptRef = useRef('')

  const onFinalCallbackRef = useRef(null)
  const onInterimCallbackRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      setError('Speech recognition is not supported in this browser.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = langRef.current

      recognition.onstart = () => {
        if (isRecordingRef.current) {
          setIsListening(true)
          setStatus('listening')
        }
      }

      recognition.onresult = (event) => {
        // Use event.resultIndex: only process NEW results, not the entire list.
        // This is critical — iterating from 0 on every speech event is O(n²).
        let newFinalFragment = ''
        let currentInterim = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i]
          if (result.isFinal) {
            newFinalFragment += result[0].transcript + ' '
          } else {
            currentInterim += result[0].transcript
          }
        }

        // Append confirmed final text; update interim (replace, not append)
        if (newFinalFragment) {
          finalTranscriptRef.current = (
            finalTranscriptRef.current + ' ' + newFinalFragment
          ).replace(/\s+/g, ' ').trim()
        }
        interimTranscriptRef.current = currentInterim.replace(/\s+/g, ' ').trim()

        const prefix = initialPrefixRef.current ? initialPrefixRef.current.trim() + ' ' : ''
        const fullCombined = (
          prefix +
          (finalTranscriptRef.current ? finalTranscriptRef.current + ' ' : '') +
          interimTranscriptRef.current
        ).replace(/\s+/g, ' ').trim()

        // onInterim: lightweight, for mic UI live preview ONLY — never writes to setQuestion
        if (onInterimCallbackRef.current) {
          onInterimCallbackRef.current(interimTranscriptRef.current, fullCombined)
        }

        // onFinal: only fires on newly confirmed fragment, for VoiceInput local preview only
        if (newFinalFragment && onFinalCallbackRef.current) {
          const fullFinal = (prefix + finalTranscriptRef.current).replace(/\s+/g, ' ').trim()
          onFinalCallbackRef.current(fullFinal)
        }
      }

      recognition.onerror = (event) => {
        // Ignore aborted error if user intentionally stopped
        if (event.error === 'aborted' && !isRecordingRef.current) {
          return
        }

        isRecordingRef.current = false
        setIsListening(false)
        setStatus('error')

        let errorMessage = 'Voice recognition error.'
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          errorMessage = 'Microphone access unavailable. Please check your browser permissions.'
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try speaking again.'
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Microphone not detected or muted.'
        } else if (event.error === 'network') {
          errorMessage = 'Network error during voice recognition.'
        }

        setError(errorMessage)
      }

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // Restart controlled recognition if user is still actively recording
          try {
            recognition.start()
          } catch {
            isRecordingRef.current = false
            setIsListening(false)
            setStatus('idle')
          }
        } else {
          setIsListening(false)
          setStatus((prev) => (prev === 'error' ? 'error' : 'idle'))
        }
      }

      recognitionRef.current = recognition
    } catch {
      setIsSupported(false)
      setError('Failed to initialize speech recognition.')
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    const wasRecording = isRecordingRef.current
    isRecordingRef.current = false
    setIsListening(false)

    if (recognitionRef.current && wasRecording) {
      setStatus('processing')
      try {
        recognitionRef.current.stop()
      } catch {}
    }

    const prefix = initialPrefixRef.current ? initialPrefixRef.current.trim() + ' ' : ''
    const cleanFinal = finalTranscriptRef.current ? finalTranscriptRef.current.trim() : ''
    const cleanInterim = interimTranscriptRef.current ? interimTranscriptRef.current.trim() : ''
    const totalText = (prefix + (cleanFinal ? cleanFinal + ' ' : '') + cleanInterim).trim()

    // rAF instead of artificial 100ms delay — status resets on next paint
    requestAnimationFrame(() => setStatus('idle'))

    return totalText
  }, [])

  const startListening = useCallback(
    ({ lang = defaultLang, initialText = '', onFinal, onInterim } = {}) => {
      if (!recognitionRef.current) {
        setError('Speech recognition is unavailable.')
        return
      }

      if (isRecordingRef.current) {
        stopListening()
        return
      }

      setError(null)
      initialPrefixRef.current = initialText ? initialText.trim() + ' ' : ''
      finalTranscriptRef.current = ''
      interimTranscriptRef.current = ''

      onFinalCallbackRef.current = onFinal
      onInterimCallbackRef.current = onInterim

      if (lang) {
        recognitionRef.current.lang = lang
      }

      isRecordingRef.current = true
      setIsListening(true)
      setStatus('listening')

      try {
        recognitionRef.current.start()
      } catch (err) {
        if (err.name !== 'InvalidStateError') {
          isRecordingRef.current = false
          setIsListening(false)
          setStatus('error')
          setError('Failed to start microphone.')
        }
      }
    },
    [defaultLang, stopListening]
  )

  return {
    isSupported,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    setError,
  }
}
