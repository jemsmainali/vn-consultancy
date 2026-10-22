export default function ListSkeleton({ label = 'Loading items' }) {
  return <div className="list-skeleton" role="status" aria-label={label}>
    {[0, 1, 2].map((item) => <div className="list-skeleton-card" key={item} aria-hidden="true">
      <span className="list-skeleton-mark" />
      <span className="list-skeleton-lines"><i /><i /><i /></span>
    </div>)}
  </div>
}
