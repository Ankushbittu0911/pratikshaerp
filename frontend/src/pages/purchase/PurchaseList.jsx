import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { purchaseAPI, quotationAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatusBadge, Pagination, EmptyState, Spinner, Modal } from '../../components/common'
import { fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function PurchaseList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [modal, setModal] = useState(false)
  const [quotations, setQuotations] = useState([])
  const [form, setForm] = useState({ quotationId: '', enquiryId: '', remarks: '' })
  const [bomFile, setBomFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await purchaseAPI.list({ status, page })
      setItems(data.data); setPagination(data.pagination)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const loadQuotations = async () => {
    try {
      const { data } = await quotationAPI.list({ salesStatus: 'APPROVED', limit: 100 })
      setQuotations(data.data)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { load(1) }, [status])

  const openModal = async () => {
    await loadQuotations()
    setModal(true)
  }

  const handleCreate = async () => {
    if (!form.quotationId) return toast.error('Select a quotation')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      if (bomFile) fd.append('file', bomFile)
      const { data } = await purchaseAPI.create(fd)
      toast.success(`PO ${data.data.poNumber} created`)
      setModal(false); setForm({ quotationId: '', enquiryId: '', remarks: '' }); setBomFile(null)
      load()
    } catch(err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const selectQuotation = (qId) => {
    const q = quotations.find(x => x._id === qId)
    setForm(p => ({ ...p, quotationId: qId, enquiryId: q?.enquiryId?._id || '' }))
  }


  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this Purchase Order? This cannot be undone.')) return
    try {
      await purchaseAPI.delete(id)
      toast.success('Purchase Order deleted')
      load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage material procurement for approved quotations"
        action={can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
          <button className="btn-primary btn" onClick={openModal}>+ New PO</button>
        )}
      />

      <div className="flex gap-3 mb-5">
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['DRAFT','PENDING_APPROVAL','APPROVED','REJECTED','MATERIALS_RECEIVING','READY_FOR_PRODUCTION','IN_PRODUCTION'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner /></div>
      : items.length === 0 ? <EmptyState title="No purchase orders" icon="🛒" />
      : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>PO #</th><th>Company</th><th>Quotation</th><th>Status</th><th>Created</th>{can('SUPER_ADMIN') && <th>Delete</th>}<th></th></tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p._id} className="cursor-pointer" onClick={() => navigate(`/purchase/${p._id}`)}>
                  <td><span className="font-mono text-xs text-brand-600 font-medium">{p.poNumber}</span></td>
                  <td>
                    <p className="font-medium">{p.enquiryId?.companyName || '-'}</p>
                    <p className="text-xs text-slate-400">{p.enquiryId?.enquiryNumber}</p>
                  </td>
                  <td className="text-xs text-slate-500">{p.quotationId?.quotationNumber || '-'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-slate-500 text-sm">{fmtDate(p.createdAt)}</td>
                  {can('SUPER_ADMIN') && (<td onClick={ev => ev.stopPropagation()}><button className="btn-danger btn btn-sm" onClick={ev => handleDelete(ev, p._id)}>🗑</button></td>)}
                  <td><button className="btn-ghost btn btn-sm" onClick={ev => { ev.stopPropagation(); navigate(`/purchase/${p._id}`) }}>View →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />

      <Modal open={modal} onClose={() => setModal(false)} title="Create Purchase Order">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Approved Quotation *</label>
            <select className="input" value={form.quotationId} onChange={e => selectQuotation(e.target.value)}>
              <option value="">Select quotation...</option>
              {quotations.map(q => (
                <option key={q._id} value={q._id}>{q.quotationNumber} — {q.enquiryId?.companyName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">BOM File</label>
            <input type="file" className="input" onChange={e => setBomFile(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label className="label">Remarks</label>
            <textarea className="input" rows={2} value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create PO'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
