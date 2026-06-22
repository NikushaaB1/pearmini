import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function PageBreadcrumb({ to = '/dashboard', label = 'დაფა' }) {
  return (
    <Link to={to} className="page-breadcrumb">
      <ChevronLeft size={16} strokeWidth={2} />
      <span>{label}</span>
    </Link>
  )
}
