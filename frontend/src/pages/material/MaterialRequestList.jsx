import { useState, useEffect } from 'react'
import { materialRequestAPI, materialAPI, productionAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatusBadge, Pagination, EmptyState, Spinner, Modal } from '../../components/common'
import { fmtDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function MaterialRequestList() {
  const { can, user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ materialName: '', quantity: '', unit: '', department: '', reason: '', productionJobId: '' })
  const [actionModal, setActionModal] = useState(null)
  const [actionForm, setActionForm] = useState({ status: '', rejectionReason: '' })
  const [jobs, setJobs] = useState([])
  const [saving, setSaving] = useState(false)

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await materialRequestAPI.list({ status, page })
      setItems(data.data)
      setPagination(data.pagination || { page: 1, pages: 1 })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [status])

  const openCreate = async () => {
    const dept = user?.role === 'FABRICATION_ADMIN' ? 'FABRICATION' : user?.role === 'ELECTRICAL_ADMIN' ? 'ELECTRICAL' : ''
    setForm({ materialName: '', quantity: '', unit: '', department: dept, reason: '', productionJobId: '' })
    try {
      const { data } = await productionAPI.list({ limit: 50 })
      setJobs(data.data)
    } catch (e) { console.error(e) }
    setModal('create')
  }

  const handleCreate = async () => {
    if (!form.materialName || !form.quantity || !form.department || !form.reason)
      return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await materialRequestAPI.create({ ...form, quantity: Number(form.quantity) })
      toast.success('Material request submitted')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const openAction = (item) => {
    setActionModal(item)
    setActionForm({ status: '', rejectionReason: '' })
  }

  const handleAction = async () => {
    if (!actionForm.status) return toast.error('Select action')
    if (actionForm.status === 'REJECTED' && !actionForm.rejectionReason) return toast.error('Rejection reason required')
    setSaving(true)
    try {
      await materialRequestAPI.updateStatus(actionModal._id, actionForm)
      toast.success(`Request ${actionForm.status.toLowerCase()}`)
      setActionModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))


  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material request? This cannot be undone.')) return
    try {
      await materialRequestAPI.delete(id)
      toast.success('Request deleted')
      load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Material Requests"
        subtitle="Request missing materials for production jobs"
        action={can('SUPER_ADMIN', 'FABRICATION_ADMIN', 'ELECTRICAL_ADMIN') && (
          <button className="btn-primary btn" onClick={openCreate}>+ New Request</button>
        )}
      />

      <div className="flex gap-3 mb-5">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No material requests" icon="📝" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Material</th>
                <th>Qty</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Date</th>
                {can('SUPER_ADMIN', 'PURCHASE_ADMIN') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r._id}>
                  <td><span className="font-mono text-xs text-brand-600">{r.requestNumber}</span></td>
                  <td className="font-medium">{r.materialName}</td>
                  <td>{r.quantity} {r.unit || ''}</td>
                  <td>
                    <span className={r.department === 'FABRICATION' ? 'badge-blue' : 'badge-purple'}>
                      {r.department}
                    </span>
                  </td>
                  <td className="text-slate-500 max-w-xs truncate">{r.reason}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-slate-500">{r.requestedBy?.name || '-'}</td>
                  <td className="text-slate-500 text-xs">{fmtDateTime(r.createdAt)}</td>
                  {can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
                    <td>
                      <div className="flex gap-1">
                        {r.status === 'PENDING' && (
                          <button className="btn-ghost btn btn-sm" onClick={() => openAction(r)}>Review</button>
                        )}
                        {can('SUPER_ADMIN') && (
                          <button className="btn-danger btn btn-sm" onClick={() => handleDelete(r._id)}>🗑</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />

      {/* Create Modal */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="New Material Request">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Production Job (optional)</label>
            <select className="input" value={form.productionJobId} onChange={e => set('productionJobId', e.target.value)}>
              <option value="">Select job...</option>
              {jobs.map(j => (
                <option key={j._id} value={j._id}>{j.jobNumber} — {j.enquiryId?.companyName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="label">Material Name *</label>
              <input className="input" value={form.materialName} onChange={e => set('materialName', e.target.value)} placeholder="e.g. MCB 16A Schneider" />
            </div>
            <div className="form-group">
              <label className="label">Quantity *</label>
              <input className="input" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs / kg" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Department *</label>
            <select className="input" value={form.department} onChange={e => set('department', e.target.value)}>
              <option value="">Select department</option>
              <option value="FABRICATION">FABRICATION</option>
              <option value="ELECTRICAL">ELECTRICAL</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Reason *</label>
            <textarea className="input" rows={2} value={form.reason} onChange={e => set('reason', e.target.value)}
              placeholder="Why is this material needed?" />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleCreate} disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </div>
      </Modal>

      {/* Action Modal */}
      <Modal open={!!actionModal} onClose={() => setActionModal(null)} title="Review Material Request">
        {actionModal && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Material</span>
                <span className="font-medium">{actionModal.materialName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Quantity</span>
                <span>{actionModal.quantity} {actionModal.unit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Department</span>
                <span>{actionModal.department}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Reason</span>
                <span className="text-right max-w-xs">{actionModal.reason}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Action *</label>
              <select className="input" value={actionForm.status} onChange={e => setActionForm(p => ({ ...p, status: e.target.value }))}>
                <option value="">Select action...</option>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>
            </div>
            {actionForm.status === 'REJECTED' && (
              <div className="form-group">
                <label className="label">Rejection Reason *</label>
                <textarea className="input" rows={2}
                  value={actionForm.rejectionReason}
                  onChange={e => setActionForm(p => ({ ...p, rejectionReason: e.target.value }))} />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={actionForm.status === 'REJECTED' ? 'btn-danger btn' : 'btn-primary btn'}
                onClick={handleAction} disabled={saving}
              >{saving ? 'Saving...' : 'Confirm'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
