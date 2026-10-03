import { useCallback, useEffect, useRef, useState } from 'react'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const voiceSupported = Boolean(Recognition)

export function useVoice({ onTranscript, onFinal }) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const handlers = useRef({ onTranscript, onFinal })
  handlers.current = { onTranscript, onFinal }

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const start = useCallback(() => {
    if (!Recognition || recRef.current) return
    stopSpeaking()
    setError(null)
    const rec = new Recognition()
    rec.lang = navigator.language || 'en-US'
    rec.interimResults = true
    rec.continuous = false
    let finalText = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t
        else interim += t
      }
      handlers.current.onTranscript?.((finalText + interim).trim())
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone access was blocked. Allow it in your browser settings.')
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setError('Voice input failed. Try again.')
      }
    }
    rec.onend = () => {
      recRef.current = null
      setListening(false)
      if (finalText.trim()) handlers.current.onFinal?.(finalText.trim())
    }
    recRef.current = rec
    setListening(true)
    try {
      rec.start()
    } catch {
      recRef.current = null
      setListening(false)
    }
  }, [stopSpeaking])

  const stop = useCallback(() => recRef.current?.stop(), [])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [])

  useEffect(
    () => () => {
      recRef.current?.abort()
      window.speechSynthesis?.cancel()
    },
    [],
  )

  return { listening, speaking, error, start, stop, speak, stopSpeaking }
}
