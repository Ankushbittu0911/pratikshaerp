import { format, formatDistanceToNow } from 'date-fns'

export const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '-'
export const fmtDateTime = (d) => d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '-'
export const timeAgo = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '-'

export const statusColors = {
  // Enquiry
  OPEN: 'badge-blue', IN_QUOTATION: 'badge-yellow', APPROVED: 'badge-green',
  REJECTED: 'badge-red', CLOSED: 'badge-gray',
  // Quotation admin
  QUOTE_RECEIVED: 'badge-blue', IN_PROGRESS: 'badge-yellow', COMPLETED: 'badge-green',
  // Sales
  PENDING: 'badge-gray', SENT_TO_CLIENT: 'badge-blue', NEGOTIATION: 'badge-yellow',
  // PO
  DRAFT: 'badge-gray', PENDING_APPROVAL: 'badge-yellow', MATERIALS_RECEIVING: 'badge-blue',
  READY_FOR_PRODUCTION: 'badge-green',
  // Production
  NOT_STARTED: 'badge-gray', IN_PRODUCTION: 'badge-blue', READY_FOR_DISPATCH: 'badge-green',
  DISPATCHED: 'badge-purple', MOUNTING_PLATE_READY: 'badge-yellow',
  SENT_TO_POWDER_COATING: 'badge-orange', MOUNTING_PLATE_SENT_TO_POWDER_COATING: 'badge-orange', PANEL_READY: 'badge-yellow', PANEL_SENT_FOR_POWDER_COATING: 'badge-orange',
  RECEIVED: 'badge-teal', READY_TO_START: 'badge-blue',
  TESTING: 'badge-purple',
  // Material request
  // PENDING already defined
}

export const statusLabel = (s) => s?.replace(/_/g, ' ') ?? '-'

export const getStatusBadge = (status) => statusColors[status] || 'badge-gray'

export const FABRICATION_STATUSES = ['NOT_STARTED','IN_PROGRESS','MOUNTING_PLATE_READY','MOUNTING_PLATE_SENT_TO_POWDER_COATING','PANEL_READY','PANEL_SENT_FOR_POWDER_COATING']
export const POWDER_COATING_STATUSES = ['NOT_STARTED','IN_PROGRESS','RECEIVED']
export const ELECTRICAL_STATUSES = ['NOT_STARTED','READY_TO_START','IN_PROGRESS','TESTING','READY_FOR_DISPATCH','DISPATCHED']

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export const rolePermissions = {
  SUPER_ADMIN: ['dashboard','enquiries','quotations','purchase','materials','production','material-requests','reports','users','notifications'],
  SALES_ADMIN: ['dashboard','enquiries','quotations','notifications'],
  QUOTATION_ADMIN: ['dashboard','quotations','notifications'],
  PURCHASE_ADMIN: ['dashboard','purchase','materials','material-requests','notifications'],
  FABRICATION_ADMIN: ['dashboard','production','material-requests','notifications'],
  ELECTRICAL_ADMIN: ['dashboard','production','material-requests','notifications'],
}

export const hasAccess = (role, module) => rolePermissions[role]?.includes(module) ?? false
