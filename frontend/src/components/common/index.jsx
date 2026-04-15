// Modal component
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizes[size]} w-full`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// Confirm modal
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary btn" onClick={onClose}>Cancel</button>
        <button className={danger ? 'btn-danger btn' : 'btn-primary btn'} onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  )
}

// Status badge
export function StatusBadge({ status }) {
  const map = {
    OPEN: 'badge-blue', IN_QUOTATION: 'badge-yellow', APPROVED: 'badge-green',
    REJECTED: 'badge-red', CLOSED: 'badge-gray', QUOTE_RECEIVED: 'badge-blue',
    IN_PROGRESS: 'badge-yellow', COMPLETED: 'badge-green', PENDING: 'badge-gray',
    SENT_TO_CLIENT: 'badge-blue', NEGOTIATION: 'badge-orange', DRAFT: 'badge-gray',
    PENDING_APPROVAL: 'badge-yellow', MATERIALS_RECEIVING: 'badge-blue',
    READY_FOR_PRODUCTION: 'badge-green', NOT_STARTED: 'badge-gray',
    MOUNTING_PLATE_READY: 'badge-yellow', SENT_TO_POWDER_COATING: 'badge-orange', MOUNTING_PLATE_SENT_TO_POWDER_COATING: 'badge-orange', PANEL_READY: 'badge-yellow', PANEL_SENT_FOR_POWDER_COATING: 'badge-orange', RECEIVED: 'badge-teal',
    READY_TO_START: 'badge-blue', TESTING: 'badge-purple',
    READY_FOR_DISPATCH: 'badge-green', DISPATCHED: 'badge-purple',
    IN_PRODUCTION: 'badge-blue',
  }
  const cls = map[status] || 'badge-gray'
  return <span className={cls}>{status?.replace(/_/g, ' ')}</span>
}

// Loading spinner
export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sz[size]} border-2 border-brand-600 border-t-transparent rounded-full animate-spin`} />
  )
}

// Empty state
export function EmptyState({ title = 'No data found', subtitle, icon = '📭', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-medium text-slate-700">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Page header
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Stat card
export function StatCard({ label, value, icon, color = 'blue', onClick }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className={`stat-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// File list display
export function FileList({ files, baseUrl = '' }) {
  if (!files?.length) return <p className="text-sm text-slate-400">No files</p>
  return (
    <div className="space-y-1.5">
      {files.map((f, i) => (
        <a
          key={i}
          href={f.path}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 hover:underline"
        >
          <span>📎</span>
          <span className="truncate">{f.originalName}</span>
        </a>
      ))}
    </div>
  )
}

// Search input
export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
      <input
        type="text"
        className="input pl-9 w-64"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// Pagination
export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button className="btn-secondary btn btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className="text-sm text-slate-500">Page {page} of {pages}</span>
      <button className="btn-secondary btn btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  )
}
