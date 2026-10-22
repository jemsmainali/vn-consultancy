import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Err } from '../ui'

const label = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api('/audit-logs').then(setLogs).catch((e) => setErr(e.message))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-3xl font-bold">Audit log</h1>
      <p className="text-sm text-navy/60">The most recent 100 actions across the system, newest first.</p>
      <Err msg={err} />

      <Card className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy/10 bg-cream-deep/60">
            <tr>
              {['When', 'Who', 'Action', 'Detail'].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-navy/60">No activity recorded yet.</td></tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-navy/5 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-navy/70">
                  {new Date(l.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium">{l.actor_name}</td>
                <td className="px-4 py-3">{label(l.action)}</td>
                <td className="px-4 py-3 text-navy/70">{l.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}