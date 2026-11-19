import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { faqs } from '../../data/faqs'
import { siteContent, siteContentReady } from '../../data/siteContent'
import '../../chat-widget.css'

// FAQ-only assistant: every answer is an approved entry from data/faqs.js, never generated text.
const STOP_WORDS = new Set('a an the i me my we you your is are am be do does did can could should would will to of in on for from and or with at by it this that what which how when where who why there about any get have has need'.split(' '))
const MIN_SCORE = 2

const tokens = (text) => text.toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9+]+/)
  .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
  .map((word) => word.length > 4 ? word.replace(/(ing|es|s)$/, '') : word)

const INDEX = faqs.map((faq) => ({ faq, question: new Set(tokens(faq.question)), answer: new Set(tokens(faq.answer)) }))

function findAnswer(text) {
  const words = [...new Set(tokens(text))]
  let best = null
  let bestScore = 0
  for (const entry of INDEX) {
    const score = words.reduce((sum, word) => sum + (entry.question.has(word) ? 3 : entry.answer.has(word) ? 1 : 0), 0)
    if (score > bestScore) { best = entry.faq; bestScore = score }
  }
  return bestScore >= MIN_SCORE ? best : null
}

const QUICK_REPLIES = faqs.filter((faq) => faq.featured).slice(0, 5).map((faq) => faq.question)
const GREETING = { from: 'bot', text: 'Hello! I can answer common questions about studying abroad with VN Group. Pick a question below or type your own.' }

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [draft, setDraft] = useState('')
  const launcher = useRef(null)
  const input = useRef(null)
  const log = useRef(null)
  const { whatsappNumber } = siteContent.contact
  const whatsappDigits = siteContentReady(whatsappNumber) ? whatsappNumber.replace(/\D/g, '') : ''

  useEffect(() => { if (open) input.current?.focus() }, [open])
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }) }, [messages])

  const close = () => { setOpen(false); launcher.current?.focus() }

  const ask = (text) => {
    const question = text.trim().slice(0, 300)
    if (!question) return
    const faq = findAnswer(question)
    setMessages((current) => [...current, { from: 'user', text: question }, faq
      ? { from: 'bot', text: faq.answer, title: faq.question }
      : { from: 'bot', text: "Sorry, I don't have a verified answer to that. A VN Group counsellor can help with your exact situation.", fallback: true }])
    setDraft('')
  }

  return (
    <div className="chat-widget">
      {open && (
        <section id="vn-chat" className="chat-panel" role="dialog" aria-label="VN Group help chat" onKeyDown={(e) => e.key === 'Escape' && close()}>
          <header className="chat-head">
            <div><strong>VN Group Help</strong><small>Answers from our FAQ page</small></div>
            <button type="button" onClick={close} aria-label="Close chat">×</button>
          </header>
          <div className="chat-log" ref={log} role="log" aria-live="polite">
            {messages.map((message, i) => (
              <div key={i} className={`chat-msg chat-msg-${message.from}`}>
                {message.title && <strong>{message.title}</strong>}
                <p>{message.text}</p>
                {message.title && <Link to="/faqs" onClick={close}>See all FAQs</Link>}
                {message.fallback && <ContactLinks whatsappDigits={whatsappDigits} onNavigate={close} />}
              </div>
            ))}
          </div>
          <div className="chat-quick" aria-label="Suggested questions">
            {QUICK_REPLIES.map((question) => <button key={question} type="button" onClick={() => ask(question)}>{question}</button>)}
            <Link to="/contact" onClick={close}>Book free counselling</Link>
          </div>
          <form className="chat-form" onSubmit={(e) => { e.preventDefault(); ask(draft) }}>
            <label className="sr-only" htmlFor="vn-chat-input">Type your question</label>
            <input id="vn-chat-input" ref={input} value={draft} maxLength={300} autoComplete="off" placeholder="Ask about IELTS, visas, costs..." onChange={(e) => setDraft(e.target.value)} />
            <button type="submit" disabled={!draft.trim()}>Send</button>
          </form>
          <p className="chat-note">General guidance only. Rules and fees change; your counsellor confirms details from official sources.</p>
        </section>
      )}
      <button ref={launcher} type="button" className="chat-launcher" aria-expanded={open} aria-controls="vn-chat" aria-label={open ? 'Close help chat' : 'Open help chat'} onClick={() => open ? close() : setOpen(true)}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5Z" /></svg>
      </button>
    </div>
  )
}

function ContactLinks({ whatsappDigits, onNavigate }) {
  return (
    <span className="chat-contact">
      <Link to="/contact" onClick={onNavigate}>Send an enquiry</Link>
      {whatsappDigits && <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">WhatsApp us</a>}
    </span>
  )
}
