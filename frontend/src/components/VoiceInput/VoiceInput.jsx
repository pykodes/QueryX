import {
  useEffect,
  useRef,
  useImperativeHandle,
  useCallback,
  forwardRef,
} from 'react';

import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import './VoiceInput.css';

const VoiceInput = forwardRef(function VoiceInput(
  {
    onCommit,
    onLiveUpdate,
    onAutoQuery,
    currentValue = '',
    disabled = false,
    lang = 'en-IN',
    onListeningStateChange,
  },
  ref
) {
  // --------------------------------------------------
  // Refs
  // --------------------------------------------------

  const pauseTimerRef = useRef(null);

  // Prevent the same voice query from being submitted twice
  const hasSubmittedRef = useRef(false);

  // Prevent submission while another submission is already happening
  const submittingRef = useRef(false);

  // Keep the latest accumulated transcript
  const accumulatedTextRef = useRef('');

  // --------------------------------------------------
  // Speech recognition
  // --------------------------------------------------

  const {
    isSupported,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    setError,
  } = useSpeechRecognition({
    defaultLang: lang,
  });

  // --------------------------------------------------
  // Clear pause timer
  // --------------------------------------------------

  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  // --------------------------------------------------
  // SINGLE SUBMISSION PIPELINE
  // --------------------------------------------------

  const submitOnce = useCallback(
    (text) => {
      const cleanedText = (text || '').trim();

      // Nothing to submit
      if (!cleanedText) {
        return false;
      }

      // Already submitted this recording
      if (hasSubmittedRef.current) {
        console.log('[VoiceInput] Duplicate submission blocked:', cleanedText);
        return false;
      }

      // Submission already in progress
      if (submittingRef.current) {
        console.log('[VoiceInput] Submission already in progress');
        return false;
      }

      // ------------------------------------------------
      // LOCK BEFORE calling parent
      // ------------------------------------------------

      hasSubmittedRef.current = true;
      submittingRef.current = true;

      clearPauseTimer();

      console.log('[VoiceInput] SUBMIT ONCE:', cleanedText);

      try {
        // Use ONE submission callback.
        //
        // Prefer onAutoQuery if it is responsible for sending
        // the query to the LLM.
        if (onAutoQuery) {
          onAutoQuery(cleanedText);
        } else if (onCommit) {
          onCommit(cleanedText);
        }
      } finally {
        submittingRef.current = false;
      }

      return true;
    },
    [onAutoQuery, onCommit, clearPauseTimer]
  );

  // --------------------------------------------------
  // Stop listening
  // --------------------------------------------------

  const handleStop = useCallback(() => {
    clearPauseTimer();

    const finalText = stopListening();

    console.log('[VoiceInput] stopListening returned:', finalText);

    /*
     * IMPORTANT:
     *
     * Do NOT call onCommit() here separately if the speech
     * recognition hook already fires onFinal.
     *
     * We use the returned text only as a fallback.
     */

    if (finalText) {
      accumulatedTextRef.current = finalText;
    }

    return finalText;
  }, [stopListening, clearPauseTimer]);

  // --------------------------------------------------
  // Expose stop() to parent
  // --------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      stop: handleStop,
    }),
    [handleStop]
  );

  // --------------------------------------------------
  // Listening state notification
  // --------------------------------------------------

  useEffect(() => {
    if (onListeningStateChange) {
      onListeningStateChange(isListening);
    }
  }, [isListening, onListeningStateChange]);

  // --------------------------------------------------
  // Automatically stop when disabled
  // --------------------------------------------------

  useEffect(() => {
    if (disabled && isListening) {
      handleStop();
    }
  }, [disabled, isListening, handleStop]);

  // --------------------------------------------------
  // Clear speech recognition error
  // --------------------------------------------------

  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [error, setError]);

  // --------------------------------------------------
  // Microphone click
  // --------------------------------------------------

  const handleMicClick = useCallback(() => {
    if (disabled) {
      return;
    }

    // -----------------------------------------------
    // STOP RECORDING
    // -----------------------------------------------

    if (isListening) {
      clearPauseTimer();

      const finalText = handleStop();

      /*
       * If the recognition hook does NOT fire onFinal when
       * manually stopped, use the returned text as fallback.
       *
       * submitOnce() protects us from duplicate submission.
       */

      const textToSend = (
        finalText ||
        accumulatedTextRef.current ||
        currentValue ||
        ''
      ).trim();

      if (textToSend) {
        submitOnce(textToSend);
      }

      return;
    }

    // -----------------------------------------------
    // START RECORDING
    // -----------------------------------------------

    clearPauseTimer();

    // New recording = allow one new submission
    hasSubmittedRef.current = false;
    submittingRef.current = false;

    accumulatedTextRef.current = currentValue || '';

    console.log('[VoiceInput] Starting new recording');

    startListening({
      lang,
      initialText: currentValue,

      // ---------------------------------------------
      // FINAL SPEECH
      // ---------------------------------------------

      onFinal: (accumulatedText) => {
        const finalText = (accumulatedText || '').trim();

        accumulatedTextRef.current = finalText;

        console.log('[VoiceInput] FINAL:', finalText);

        /*
         * IMPORTANT:
         *
         * There is now ONLY ONE place where automatic
         * pause submission happens.
         */

        clearPauseTimer();

        if (!finalText) {
          return;
        }

        pauseTimerRef.current = setTimeout(() => {
          pauseTimerRef.current = null;

          console.log(
            '[VoiceInput] Pause detected. Auto submitting:',
            finalText
          );

          submitOnce(finalText);
        }, 2500);
      },

      // ---------------------------------------------
      // INTERIM SPEECH
      // ---------------------------------------------

      onInterim: (interimFragment, fullCombined) => {
        const liveText = (fullCombined || interimFragment || '').trim();

        accumulatedTextRef.current = liveText;

        if (onLiveUpdate) {
          onLiveUpdate(liveText);
        }

        /*
         * User is speaking again.
         * Cancel the previous pause timer.
         */

        clearPauseTimer();
      },
    });
  }, [
    disabled,
    isListening,
    currentValue,
    lang,
    startListening,
    handleStop,
    submitOnce,
    clearPauseTimer,
    onLiveUpdate,
  ]);

  // --------------------------------------------------
  // Unsupported browser
  // --------------------------------------------------

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
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="voice-input-container">

      {error && (
        <div
          className="voice-error-toast"
          role="alert"
          onClick={() => setError(null)}
        >
          <span className="toast-icon">⚠</span>

          <span className="toast-text">
            {error}
          </span>

          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        className={`mic-btn ${isListening ? 'listening' : ''
          } ${status === 'processing' ? 'processing' : ''
          }`}
        onClick={handleMicClick}
        disabled={disabled || status === 'processing'}
        title={
          isListening
            ? 'Listening... Click to stop recording'
            : status === 'processing'
              ? 'Processing speech...'
              : 'Click for voice input (en-IN)'
        }
        aria-label={
          isListening
            ? 'Stop voice recording'
            : 'Start voice recording'
        }
      >
        {isListening && (
          <span className="rec-badge" />
        )}

        {status === 'processing' ? (
          <span className="proc-spinner" />
        ) : (
          <span className="mic-icon">🎙️</span>
        )}
      </button>
    </div>
  );
});

export default VoiceInput; 