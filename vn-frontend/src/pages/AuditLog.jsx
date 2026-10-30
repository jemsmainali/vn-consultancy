import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { Card, Input, Err, Icon, PageHeader, StatusBadge, EmptyState, Avatar } from '../ui'
import ListSkeleton from '../components/ui/ListSkeleton'

const label = (s) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

function actionTone(action) {
  if (/delete|deactivat|reject|remov/.test(action)) return 'danger'
  if (/approv|reactivat|creat|register|verif/.test(action)) return 'success'
  if (/updat|replac|status|upload/.test(action)) return 'info'
  if (/login|logout|password/.test(action)) return 'indigo'
  return 'neutral'
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api('/audit-logs').then(setLogs).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((l) => [l.actor_name, label(l.action), l.detail].some((v) => v?.toLowerCase().includes(q)))
  }, [logs, query])

  return (
    <div className="ui-stack">
      <PageHeader
        eyebrow="Staff tools"
        title="Audit log"
        description="The most recent 100 actions across the system, newest first."
      />
      <Err msg={err} />

      {loading ? <ListSkeleton label="Loading audit log" /> : (
        <Card className="overflow-hidden">
          <div className="audit-toolbar">
            <label className="ui-search">
              <span className="sr-only">Filter activity</span>
              <Icon name="search" />
              <Input type="search" placeholder="Filter by person, action or detail" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <span className="text-sm text-navy/60" aria-live="polite">{visible.length} of {logs.length} entries</span>
          </div>
          {visible.length === 0 ? (
            <EmptyState icon="audit" title={logs.length ? 'No matching activity' : 'No activity recorded yet'}>
              {logs.length ? 'Try a different search term.' : null}
            </EmptyState>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table ui-table--stack">
                <thead>
                  <tr>{['When', 'Who', 'Action', 'Detail'].map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {visible.map((l, i) => {
                    const when = new Date(l.timestamp)
                    return (
                      <tr key={l.id} style={{ '--i': i }}>
                        <td data-label="When" className="audit-when">
                          <span>
                            <span className="ui-cell-primary">{when.toLocaleDateString()}</span>
                            <span className="ui-cell-secondary">{when.toLocaleTimeString()}</span>
                          </span>
                        </td>
                        <td data-label="Who">
                          <span className="ui-cell-person"><Avatar name={l.actor_name} size="sm" /><span className="font-medium">{l.actor_name}</span></span>
                        </td>
                        <td data-label="Action"><StatusBadge tone={actionTone(l.action)}>{label(l.action)}</StatusBadge></td>
                        <td data-label="Detail" className="text-navy/70"><span className="break-words">{l.detail || '—'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
