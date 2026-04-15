import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { enquiryAPI, quotationAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, FileList, Spinner, Modal } from '../../components/common'
import { fmtDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function EnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const [enquiry, setEnquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const load = async () => {
    try {
      const { data } = await enquiryAPI.get(id)
      setEnquiry(data.data)
    } catch { toast.error('Failed to load enquiry') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const createQuotation = async () => {
    setCreating(true)
    try {
      const { data } = await quotationAPI.create({ enquiryId: id })
      toast.success('Quotation created!')
      navigate(`/quotations/${data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quotation')
    } finally { setCreating(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await enquiryAPI.delete(id)
      toast.success('Enquiry deleted')
      navigate('/enquiries')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!enquiry) return <p className="text-slate-500">Enquiry not found</p>

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button className="text-sm text-slate-400 hover:text-slate-600" onClick={() => navigate('/enquiries')}>
              ← Enquiries
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm text-slate-600 font-mono">{enquiry.enquiryNumber}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{enquiry.companyName}</h1>
          <div className="mt-1"><StatusBadge status={enquiry.status} /></div>
        </div>
        <div className="flex gap-2">
          {can('SUPER_ADMIN', 'QUOTATION_ADMIN', 'SALES_ADMIN') && enquiry.status === 'OPEN' && (
            <button className="btn-primary btn" onClick={createQuotation} disabled={creating}>
              {creating ? 'Creating...' : '+ Create Quotation'}
            </button>
          )}
          {can('SUPER_ADMIN') && (
            <button className="btn-danger btn" onClick={() => setShowDelete(true)}>🗑 Delete</button>
          )}
        </div>
      </div>

      {/* Client info */}
      <div className="card">
        <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Client Information</h2></div>
        <div className="card-body grid grid-cols-2 gap-4">
          {[
            ['Client Name', enquiry.clientName],
            ['Company', enquiry.companyName],
            ['Email', enquiry.email],
            ['Phone', enquiry.phone],
            ['Created By', enquiry.createdBy?.name || '-'],
            ['Created At', fmtDateTime(enquiry.createdAt)],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{l}</p>
              <p className="text-sm text-slate-700 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="card">
        <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Requirement Details</h2></div>
        <div className="card-body">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{enquiry.requirementDetails}</p>
          {enquiry.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Internal Notes</p>
              <p className="text-sm text-slate-600">{enquiry.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      {enquiry.attachments?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-slate-700">Attachments ({enquiry.attachments.length})</h2>
          </div>
          <div className="card-body">
            <FileList files={enquiry.attachments} />
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Enquiry" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">⚠ This cannot be undone</p>
            <p className="text-xs text-red-700 mt-1">
              Deleting <strong>{enquiry.enquiryNumber}</strong> — {enquiry.companyName} will permanently remove
              this enquiry and all its attachments.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setShowDelete(false)}>Cancel</button>
            <button className="btn-danger btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : '🗑 Delete Enquiry'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
