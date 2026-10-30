import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { Card, Select, Btn, Err, Icon, PageHeader, EmptyState, Avatar } from '../ui'

const ROLE = { student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'VN Group' }
const dayLabel = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const timeLabel = (value) => new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

export default function Messages() {
  const { user } = useAuth()
  const staff = user.role === 'consultancy_staff'
  const [params] = useSearchParams()
  const [people, setPeople] = useState([])
  const [other, setOther] = useState(params.get('to') || '')
  const [msgs, setMsgs] = useState([])
  const [body, setBody] = useState('')
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const logRef = useRef(null)
  const composerRef = useRef(null)
  const stickToBottom = useRef(true)
  const marking = useRef(new Set())

  // People you can talk to: past conversations, plus VN Group staff for students and principals.
  useEffect(() => {
    const loads = [api('/messages/contacts')]
    if (!staff) loads.push(api('/auth/staff'))
    Promise.all(loads)
      .then(([contacts, team = []]) => {
        const map = new Map()
        team.forEach((s) => map.set(s.id, { id: s.id, full_name: s.full_name, role: 'consultancy_staff' }))
        contacts.forEach((c) => map.set(c.id, c))
        const list = [...map.values()]
        setPeople(list)
        setOther((cur) => cur || list[0]?.id || '')
      })
      .catch((e) => setErr(e.message))
  }, [])

  // Ignore responses for a conversation that is no longer open.
  const openThread = useRef(other)
  const load = () => {
    if (!other) return Promise.resolve()
    const id = other
    return api('/messages/thread/' + id)
      .then((list) => { if (openThread.current === id) setMsgs(list) })
      .catch((e) => setErr(e.message))
  }
  useEffect(() => {
    openThread.current = other
    stickToBottom.current = true
    setMsgs([])
    if (!other) return undefined
    setLoadingThread(true)
    load().finally(() => { if (openThread.current === other) setLoadingThread(false) })
    // Poll while the tab is visible, and catch up as soon as it becomes visible again.
    const t = setInterval(() => { if (!document.hidden) load() }, 10000)
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [other])

  // Mark incoming messages as read once they are on screen.
  useEffect(() => {
    if (document.hidden) return
    msgs
      .filter((m) => m.receiver_id === user.id && !m.read && !marking.current.has(m.id))
      .forEach((m) => {
        marking.current.add(m.id)
        api(`/messages/${m.id}/read`, { method: 'PATCH' })
          .then((updated) => setMsgs((list) => list.map((item) => (item.id === updated.id ? updated : item))))
          .catch(() => {}) // the next poll shows the message as unread again; no need to interrupt the reader
          .finally(() => marking.current.delete(m.id))
      })
  }, [msgs, user.id])

  // Follow new messages only when the reader is already at the bottom, so scrolling back through history is not interrupted.
  const onScroll = () => {
    const el = logRef.current
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }
  useEffect(() => {
    if (logRef.current && stickToBottom.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [msgs.length, other])

  const resizeComposer = () => {
    const el = composerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  useEffect(resizeComposer, [body])

  const text = body.trim()
  const send = async (e) => {
    e?.preventDefault()
    if (!other || !text || sending) return
    setErr(''); setSending(true)
    try {
      await api('/messages', { method: 'POST', json: { receiver_id: other, body: text } })
      setBody('')
      stickToBottom.current = true
      await load()
    } catch (x) { setErr(x.message) }
    setSending(false)
    composerRef.current?.focus()
  }
  // Enter sends; Shift+Enter starts a new line.
  const onComposerKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
  }
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === user.id)

  const known = people.some((p) => p.id === other)
  const current = people.find((p) => p.id === other)
  const contacts = other && !known ? [{ id: other, full_name: 'New conversation', role: null }, ...people] : people

  return (
    <div className="ui-stack">
      <PageHeader
        eyebrow={staff ? 'Staff workspace' : 'Your workspace'}
        title="Messages"
        description={staff ? 'Conversations with students, principals and families.' : 'Talk directly with the VN Group team about your application.'}
      />
      <Err msg={err} />

      <Card className="chat">
        <aside className="chat-contacts" aria-label="Conversations">
          <p className="chat-contacts-head">Conversations</p>
          <div className="chat-contacts-list">
            {contacts.length === 0 && <p className="px-3 py-2 text-sm text-navy/60">No conversations yet</p>}
            {contacts.map((p) => (
              <button key={p.id} type="button" className="chat-contact" aria-current={p.id === other} onClick={() => setOther(p.id)}>
                <Avatar name={p.full_name} size="md" />
                <span className="chat-contact-text">
                  <span className="chat-contact-name">{p.full_name}</span>
                  {p.role && <span className="chat-contact-role">{ROLE[p.role]}</span>}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="chat-thread" aria-label="Conversation">
          <div className="chat-contact-select">
            <Select aria-label="Choose a conversation" value={other} onChange={(e) => setOther(e.target.value)}>
              {people.length === 0 && !other && <option value="">No conversations yet</option>}
              {other && !known && <option value={other}>New conversation</option>}
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({ROLE[p.role]})</option>)}
            </Select>
          </div>

          {other && (
            <div className="chat-thread-head">
              <Avatar name={current?.full_name || 'New'} size="md" />
              <div>
                <h2 className="chat-thread-name">{current?.full_name || 'New conversation'}</h2>
                <span className="chat-thread-role">{current ? ROLE[current.role] : 'Send a message to start the conversation'}</span>
              </div>
            </div>
          )}

          <div ref={logRef} className="chat-log" role="log" aria-live="polite" aria-label="Messages" aria-busy={loadingThread} onScroll={onScroll}>
            {!other && (
              <EmptyState icon="messages" title="No conversation selected">
                {staff ? 'Open a document and choose "Message" to start a conversation.' : 'No one from VN Group is available to message yet.'}
              </EmptyState>
            )}
            {other && loadingThread && msgs.length === 0 && (
              <p className="chat-loading" role="status"><span className="ui-spin" aria-hidden="true" />Loading messages…</p>
            )}
            {other && !loadingThread && msgs.length === 0 && (
              <div className="chat-empty"><EmptyState icon="messages" title="No messages yet">Write the first one below.</EmptyState></div>
            )}
            {msgs.map((m, i) => {
              const mine = m.sender_id === user.id
              const day = dayLabel(m.sent_at)
              const newDay = i === 0 || dayLabel(msgs[i - 1].sent_at) !== day
              return (
                <div key={m.id} className="contents">
                  {newDay && <span className="chat-day">{day}</span>}
                  <div className={`chat-bubble ${mine ? 'chat-bubble--mine' : 'chat-bubble--theirs'}`}>
                    {m.body}
                    <span className="chat-meta">
                      <time className="chat-time" dateTime={m.sent_at} title={new Date(m.sent_at).toLocaleString()}>{timeLabel(m.sent_at)}</time>
                      {m.id === lastMine?.id && <span className="chat-receipt">{m.read ? 'Seen' : 'Sent'}</span>}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <form onSubmit={send} className="chat-composer">
            <div className="chat-composer-field">
              <textarea
                ref={composerRef}
                rows={1}
                aria-label="Message"
                aria-describedby="chat-composer-hint"
                className="ui-input chat-composer-input"
                disabled={!other}
                placeholder={other ? 'Write a message…' : 'Choose a conversation first'}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={onComposerKey}
                maxLength={4000}
              />
              <span id="chat-composer-hint" className="chat-composer-hint">
                Enter to send, Shift+Enter for a new line{body.length > 3500 && <> · <strong>{4000 - body.length}</strong> characters left</>}
              </span>
            </div>
            <Btn disabled={!other || !text || sending}>
              {sending ? <span className="ui-spin" aria-hidden="true" /> : <Icon name="send" />}
              <span className="hidden sm:inline">Send</span>
              <span className="sr-only sm:hidden">Send</span>
            </Btn>
          </form>
        </section>
      </Card>
    </div>
  )
}
