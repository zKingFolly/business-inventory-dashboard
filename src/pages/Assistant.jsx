import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic, MicOff, SquarePen, Volume2, VolumeX } from 'lucide-react'
import { useVoice, voiceSupported } from '../lib/useVoice'
import { isToday, isYesterday, parseISO } from 'date-fns'
import { useChat, useChats, useSendMessage } from '../api/hooks'
import { BusinessSwitcher } from '../components/Layout'
import { ErrorState } from '../components/ui'
import { ASSISTANT_NAME } from '../config'

const SUGGESTIONS = [
  { title: 'Stock', text: 'Which products will run out in the next 30 days?' },
  { title: 'Returns', text: 'Which products were returned the most in the last 10 days?' },
  { title: 'Best sellers', text: 'What are my best sellers in the last 10 days?' },
]

function groupChats(chats) {
  const groups = { Today: [], Yesterday: [], Earlier: [] }
  chats.forEach((c) => {
    const d = parseISO(c.updatedAt)
    groups[isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : 'Earlier'].push(c)
  })
  return Object.entries(groups).filter(([, items]) => items.length)
}

export default function Assistant() {
  const [chatId, setChatId] = useState(null)
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null)
  const bottomRef = useRef(null)

  const { data: chats = [] } = useChats()
  const { data: chat, error: chatError } = useChat(chatId)
  const send = useSendMessage()

  const messages = chat?.messages || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages.length, pending])

  const [readAloud, setReadAloud] = useState(true)
  const submitRef = useRef(null)
  const voice = useVoice({
    onTranscript: setText,
    onFinal: (t) => submitRef.current?.(t, true),
  })

  const submit = async (value, fromVoice = false) => {
    const message = value.trim()
    if (!message || send.isPending) return
    setText('')
    setPending(message)
    try {
      const result = await send.mutateAsync({ chatId, text: message })
      setChatId(result.chatId)
      if (fromVoice && readAloud) voice.speak(result.assistantMessage?.content)
    } catch {
      setText(message)
    } finally {
      setPending(null)
    }
  }

  submitRef.current = submit

  return (
    <div className="page" style={{ height: '100%' }}>
      <div className="page-head">
        <h1 className="page-title">{ASSISTANT_NAME}</h1>
        <div className="page-actions">
          <BusinessSwitcher />
        </div>
      </div>

      <div className="chat-layout">
        <nav className="chat-history" aria-label="Chat history">
          <button className="nav-button" onClick={() => setChatId(null)}>
            <SquarePen size={16} aria-hidden="true" /> New chat
          </button>
          {groupChats(chats).map(([group, items]) => (
            <div key={group}>
              <p className="chat-group">{group}</p>
              {items.map((c) => (
                <button key={c.id} className="chat-item" aria-current={c.id === chatId} onClick={() => setChatId(c.id)} title={c.title}>
                  {c.title}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <section className="chat-panel" aria-label="Conversation">
          <div className="messages" aria-live="polite">
            {chatError && <ErrorState error={chatError} />}
            {!chatId && !pending && (
              <div className="state">
                <p style={{ color: 'var(--text)', fontSize: 18 }}>Ask {ASSISTANT_NAME} about your business</p>
                <p>Sales, stock, returns and best sellers, in plain English.</p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`message ${m.role === 'user' ? 'message-user' : ''}`}>
                {m.content}
              </div>
            ))}
            {pending && (
              <>
                {!messages.some((m) => m.content === pending && m.role === 'user') && (
                  <div className="message message-user">{pending}</div>
                )}
                <div className="message typing">Thinking…</div>
              </>
            )}
            {send.isError && (
              <p className="banner" role="alert">
                {send.error.message}
              </p>
            )}
            {voice.error && (
              <p className="banner" role="alert">
                {voice.error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {!chatId && !pending && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s.title} className="suggestion" onClick={() => submit(s.text)}>
                  <span style={{ fontWeight: 500 }}>{s.title}</span>
                  <span className="label">{s.text}</span>
                </button>
              ))}
            </div>
          )}

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault()
              submit(text)
            }}
          >
            <label className="sr-only" htmlFor="message">Message</label>
            <input
              id="message"
              placeholder={`Message ${ASSISTANT_NAME}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
            {voiceSupported && (
              <>
                <button
                  type="button"
                  className="icon-btn"
                  aria-pressed={readAloud}
                  aria-label={readAloud ? 'Turn off spoken replies' : 'Turn on spoken replies'}
                  title={readAloud ? 'Spoken replies on' : 'Spoken replies off'}
                  onClick={() => {
                    if (readAloud) voice.stopSpeaking()
                    setReadAloud(!readAloud)
                  }}
                >
                  {readAloud ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button
                  type="button"
                  className={`icon-btn ${voice.listening ? 'recording' : ''}`}
                  aria-label={voice.listening ? 'Stop recording' : 'Speak your message'}
                  title={voice.listening ? 'Listening… tap to stop' : 'Speak your message'}
                  disabled={send.isPending}
                  onClick={voice.listening ? voice.stop : voice.start}
                >
                  {voice.listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </>
            )}
            <button className="send" type="submit" disabled={!text.trim() || send.isPending} aria-label="Send message">
              <ArrowUp size={16} />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
