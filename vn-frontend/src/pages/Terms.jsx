import { Link } from 'react-router-dom'
import { Card } from '../ui'

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card className="p-6">
        <h1 className="mb-4 font-sans text-2xl font-bold">Terms and Conditions</h1>
        <div className="space-y-3 text-sm leading-relaxed text-navy/80">
          <p>
            Replace this placeholder with VN Group's actual terms before accepting real
            registrations. At minimum, this should cover what documents you collect, how long you
            keep them, who within VN Group can view them, how a person can request their data
            be deleted, and how to contact you with concerns.
          </p>
          <p>
            By registering, the account holder confirms the details provided are accurate and
            consents to VN Group processing them to assist with the college/university
            application and admissions process.
          </p>
        </div>
        <Link to="/register" className="mt-6 inline-block font-semibold text-navy underline">Back to registration</Link>
      </Card>
    </div>
  )
}