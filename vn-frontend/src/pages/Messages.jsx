import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { Card, Input, Select, Btn, Err } from '../ui'

const ROLE = { student: 'Student', principal: 'Principal', parent: 'Parent/Guardian', other: 'Other', consultancy_staff: 'VN Group' }

export default function Messages() {
  const { user } = useAuth()
  const staff = user.role === 'consultancy_staff'
  const [params] = useSearchParams()
  const [people, setPeople] = useState([])
  const [other, setOther] = useState(params.get('to') || '')
  const [msgs, setMsgs] = useState([])
  const [body, setBody] = useState('')
  const [err, setErr] = useState('')

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

  const load = () => other && api('/messages/thread/' + other).then(setMsgs).catch((e) => setErr(e.message))
  useEffect(() => {
    setMsgs([])
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [other])

  const send = async (e) => {
    e.preventDefault(); setErr('')
    try { await api('/messages', { method: 'POST', json: { receiver_id: other, body } }); setBody(''); load() }
    catch (x) { setErr(x.message) }
  }

  const known = people.some((p) => p.id === other)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-sans text-3xl font-bold">Messages</h1>
      <Card className="p-4">
        <Select value={other} onChange={(e) => setOther(e.target.value)}>
          {people.length === 0 && !other && <option value="">No conversations yet</option>}
          {other && !known && <option value={other}>New conversation</option>}
          {people.map((p) => <option key={p.id} value={p.id}>{p.full_name} ({ROLE[p.role]})</option>)}
        </Select>
      </Card>
      <Err msg={err} />
      <Card className="flex h-96 flex-col gap-2 overflow-y-auto p-4">
        {!other && (
          <p className="m-auto text-center text-sm text-navy/60">
            {staff ? 'Open a document and click "Message sender" to start a conversation.' : 'No one from VN Group is available to message yet.'}
          </p>
        )}
        {other && msgs.length === 0 && <p className="m-auto text-sm text-navy/60">No messages yet. Write the first one below.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === user.id
          return (
            <div key={m.id} className={'max-w-[80%] rounded-xl px-3 py-2 text-sm ' + (mine ? 'ml-auto bg-navy text-cream' : 'bg-cream-deep')}>
              {m.body}
              <div className={'mt-1 text-[11px] ' + (mine ? 'text-cream/60' : 'text-navy/50')}>{new Date(m.sent_at).toLocaleString()}</div>
            </div>
          )
        })}
      </Card>
      <form onSubmit={send} className="flex gap-2">
        <Input required disabled={!other} placeholder="Write a message" value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} />
        <Btn disabled={!other}>Send</Btn>
      </form>
    </div>
  )
}