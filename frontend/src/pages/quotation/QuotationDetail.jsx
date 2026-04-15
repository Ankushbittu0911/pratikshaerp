import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quotationAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, Modal, FileList, Spinner } from '../../components/common'
import { fmtDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function QuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const [q, setQ] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'admin-status' | 'sales-status' | 'upload-files'
  const [form, setForm] = useState({})
  const [file, setFile] = useState(null)
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try { const { data } = await quotationAPI.get(id); setQ(data.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleAdminStatus = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('status', form.status)
      if (form.remarks) fd.append('remarks', form.remarks)
      if (file) fd.append('file', file)
      await quotationAPI.updateAdminStatus(id, fd)
      toast.success('Status updated')
      setModal(null); setFile(null); setForm({})
      load()
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleSalesStatus = async () => {
    if (form.salesStatus === 'REJECTED' && !form.rejectionReason) return toast.error('Rejection reason required')
    setSaving(true)
    try {
      await quotationAPI.updateSalesStatus(id, {
        status: form.salesStatus,
        rejectionReason: form.rejectionReason,
        remarks: form.remarks,
        quotationValue: form.quotationValue
      })
      toast.success('Status updated')
      setModal(null); setForm({})
      load()
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleFileUpload = async () => {
    if (!files.length) return toast.error('Select files')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('fileType', form.fileType)
      files.forEach(f => fd.append('files', f))
      await quotationAPI.uploadFiles(id, fd)
      toast.success('Files uploaded')
      setModal(null); setFiles([]); setForm({})
      load()
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }


  const handleDelete = async () => {
    setDeleting(true)
    try {
      await quotationAPI.delete(id)
      toast.success('Quotation deleted')
      navigate('/quotations')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!q) return null

  const history = q.statusHistory || []

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button className="text-sm text-slate-400 hover:text-slate-600" onClick={() => navigate('/quotations')}>← Quotations</button>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-mono text-slate-600">{q.quotationNumber}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{q.enquiryId?.companyName || 'Quotation'}</h1>
          <div className="flex gap-2 mt-1">
            <StatusBadge status={q.quotationAdminStatus} />
            <StatusBadge status={q.salesStatus} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {can('SUPER_ADMIN', 'QUOTATION_ADMIN') && (
            <button className="btn-secondary btn btn-sm" onClick={() => { setForm({ status: q.quotationAdminStatus }); setModal('admin-status') }}>
              Update Admin Status
            </button>
          )}
          {can('SUPER_ADMIN', 'SALES_ADMIN') && q.quotationAdminStatus === 'COMPLETED' && (
            <button className="btn-primary btn btn-sm" onClick={() => { setForm({ salesStatus: q.salesStatus }); setModal('sales-status') }}>
              Update Sales Status
            </button>
          )}
          {can('SUPER_ADMIN', 'SALES_ADMIN') && q.salesStatus === 'APPROVED' && (
            <button className="btn-secondary btn btn-sm" onClick={() => { setForm({ fileType: 'bom' }); setModal('upload-files') }}>
              Upload BOM/Drawings
            </button>
          )}
          {can('SUPER_ADMIN') && (
            <button className="btn-danger btn btn-sm" onClick={() => setModal('delete')}>🗑 Delete</button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Enquiry info */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Enquiry Info</h2></div>
          <div className="card-body space-y-3">
            {[
              ['Enquiry #', q.enquiryId?.enquiryNumber],
              ['Company', q.enquiryId?.companyName],
              ['Client', q.enquiryId?.clientName],
              ['Email', q.enquiryId?.email],
              ['Phone', q.enquiryId?.phone],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-slate-400">{l}</span>
                <span className="text-slate-700 font-medium">{v || '-'}</span>
              </div>
            ))}
            <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate(`/enquiries/${q.enquiryId?._id}`)}>
              View Enquiry →
            </button>
          </div>
        </div>

        {/* Quotation details */}
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Quotation Details</h2></div>
          <div className="card-body space-y-3">
            {[
              ['Admin Status', <StatusBadge status={q.quotationAdminStatus} />],
              ['Sales Status', <StatusBadge status={q.salesStatus} />],
              ['Value', q.quotationValue ? `₹${Number(q.quotationValue).toLocaleString('en-IN')}` : '-'],
              ['Created', fmtDateTime(q.createdAt)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm items-center">
                <span className="text-slate-400">{l}</span>
                <span className="text-slate-700">{v}</span>
              </div>
            ))}
            {q.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2">
                <p className="text-xs font-medium text-red-600 mb-0.5">Rejection Reason</p>
                <p className="text-sm text-red-700">{q.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Quotation PDF', file: q.quotationPdf ? [q.quotationPdf] : [] },
          { label: 'BOM File', file: q.bomFile ? [q.bomFile] : [] },
          { label: 'Drawing Files', file: q.drawingFiles || [] },
        ].map(({ label, file }) => (
          <div className="card" key={label}>
            <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">{label}</h2></div>
            <div className="card-body"><FileList files={file} /></div>
          </div>
        ))}
      </div>

      {/* Status Timeline */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Status History</h2></div>
          <div className="card-body">
            <div className="space-y-0">
              {history.map((h, i) => (
                <div key={i} className="timeline-item">
                  {i < history.length - 1 && <div className="timeline-line" />}
                  <div className={`timeline-dot ${i === 0 ? 'bg-brand-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{h.status?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{fmtDateTime(h.changedAt)} {h.changedBy?.name ? `· ${h.changedBy.name}` : ''}</p>
                    {h.remarks && <p className="text-xs text-slate-500 mt-0.5">"{h.remarks}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Status Modal */}
      <Modal open={modal === 'admin-status'} onClose={() => setModal(null)} title="Update Admin Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {['QUOTE_RECEIVED','IN_PROGRESS','COMPLETED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.status === 'COMPLETED' && (
            <div className="form-group">
              <label className="label">Upload Quotation PDF</label>
              <input type="file" accept=".pdf" className="input" onChange={e => setFile(e.target.files[0])} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks || ''} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleAdminStatus} disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Sales Status Modal */}
      <Modal open={modal === 'sales-status'} onClose={() => setModal(null)} title="Update Sales Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.salesStatus || ''} onChange={e => setForm(p => ({ ...p, salesStatus: e.target.value }))}>
              {['PENDING','SENT_TO_CLIENT','NEGOTIATION','APPROVED','REJECTED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Quotation Value (₹)</label>
            <input type="number" className="input" value={form.quotationValue || ''} onChange={e => setForm(p => ({ ...p, quotationValue: e.target.value }))} placeholder="0" />
          </div>
          {form.salesStatus === 'REJECTED' && (
            <div className="form-group">
              <label className="label">Rejection Reason *</label>
              <textarea className="input" rows={2} value={form.rejectionReason || ''} onChange={e => setForm(p => ({ ...p, rejectionReason: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks || ''} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleSalesStatus} disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Upload Files Modal */}
      <Modal open={modal === 'upload-files'} onClose={() => setModal(null)} title="Upload BOM / Drawings">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">File Type</label>
            <select className="input" value={form.fileType || 'bom'} onChange={e => setForm(p => ({ ...p, fileType: e.target.value }))}>
              <option value="bom">BOM File</option>
              <option value="drawing">Drawing Files</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Select Files</label>
            <input type="file" multiple className="input" onChange={e => setFiles(Array.from(e.target.files))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleFileUpload} disabled={saving}>{saving ? 'Uploading...' : 'Upload'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Quotation" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">⚠ This cannot be undone</p>
            <p className="text-xs text-red-700 mt-1">
              Deleting <strong>{q.quotationNumber}</strong> will permanently remove this quotation and all uploaded files.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-danger btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : '🗑 Delete Quotation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
