import { Link } from 'react-router-dom'
import { Card, PageHeader, EmptyState } from '../ui'

// There is no application record in the backend yet, so this page never requests or invents statuses.
// Once an applications API exists, load the student's own records here.
export default function Applications() {
  return <div className="ui-stack">
    <PageHeader
      eyebrow="Your workspace"
      title="My applications"
      description="University and visa applications that VN Group submits for you will be listed here with their current status."
    />
    <Card>
      <EmptyState icon="documents" title="No applications to show">
        Application tracking is not yet connected to your account, so nothing is listed here. Your counsellor will update you about any application in <Link to="/messages">Messages</Link>. Meanwhile, you can build your <Link to="/study-plan">study plan</Link>.
      </EmptyState>
    </Card>
  </div>
}
