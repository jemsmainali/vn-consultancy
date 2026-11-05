import { Link, useLocation } from 'react-router-dom'

// Link to the homepage. Already on "/": replace the entry (drops any #hash) and
// ScrollManager smooth-scrolls to the top instead of adding a history step.
export default function HomeLink(props) {
  const { pathname } = useLocation()
  return <Link to="/" replace={pathname === '/'} {...props} />
}
