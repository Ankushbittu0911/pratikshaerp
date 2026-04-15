import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { purchaseAPI, productionAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, FileList, Spinner, Modal } from '../../components/common'
import { fmtDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function PurchaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can } = useAuth()
  const [po, setPO] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [addItemForm, setAddItemForm] = useState({ materialName: '', quantity: '', unit: '', remarks: '' })

  const load = async () => {
    try { const { data } = await purchaseAPI.get(id); setPO(data.data) }
    catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleApprove = async (action) => {
    setSaving(true)
    try {
      await purchaseAPI.approve(id, { action, remarks: form.remarks })
      toast.success(`PO ${action.toLowerCase()}`)
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleMarkReady = async () => {
    setSaving(true)
    try {
      await purchaseAPI.markReady(id)
      toast.success('PO marked as Ready for Production!')
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleItemUpdate = async (item) => {
    setSaving(true)
    try {
      await purchaseAPI.updateItem(id, item._id, item)
      toast.success('Material updated')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleAddItem = async () => {
    if (!addItemForm.materialName || !addItemForm.quantity) return toast.error('Fill required fields')
    setSaving(true)
    try {
      await purchaseAPI.addItem(id, { ...addItemForm, quantity: Number(addItemForm.quantity) })
      toast.success('Item added')
      setModal(null); setAddItemForm({ materialName: '', quantity: '', unit: '', remarks: '' })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await purchaseAPI.delete(id)
      toast.success('Purchase Order deleted')
      navigate('/purchase')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete') }
    finally { setSaving(false) }
  }

  const createProductionJob = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('quotationId', po.quotationId?._id || po.quotationId)
      fd.append('enquiryId', po.enquiryId?._id || po.enquiryId)
      fd.append('purchaseOrderId', id)
      const { data } = await productionAPI.create(fd)
      toast.success(`Job ${data.data.jobNumber} created!`)
      navigate(`/production/${data.data._id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create job') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!po) return null

  const allReceived = po.materialTracking?.length > 0 && po.materialTracking.every(m => !m.isPending)
  const canEditMaterials = can('SUPER_ADMIN', 'PURCHASE_ADMIN') && ['APPROVED', 'MATERIALS_RECEIVING'].includes(po.status)
  const canMarkReady = can('SUPER_ADMIN', 'PURCHASE_ADMIN') && ['APPROVED', 'MATERIALS_RECEIVING'].includes(po.status)

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button className="text-sm text-slate-400 hover:text-slate-600" onClick={() => navigate('/purchase')}>
              ← Purchase Orders
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-mono">{po.poNumber}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{po.enquiryId?.companyName || 'Purchase Order'}</h1>
          <div className="mt-1"><StatusBadge status={po.status} /></div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {can('SUPER_ADMIN') && po.status === 'PENDING_APPROVAL' && (
            <>
              <button className="btn-primary btn btn-sm" onClick={() => { setForm({}); setModal('approve') }}>
                ✓ Approve PO
              </button>
              <button className="btn-danger btn btn-sm" onClick={() => { setForm({}); setModal('reject') }}>
                ✕ Reject
              </button>
            </>
          )}

          {canEditMaterials && (
            <button className="btn-secondary btn btn-sm" onClick={() => setModal('add-item')}>
              + Add Material
            </button>
          )}

          {/* KEY FIX: Manual "Mark Ready for Production" */}
          {canMarkReady && (
            <button
              className="btn btn-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-lg px-3 py-1.5"
              onClick={() => setModal('mark-ready')}
            >
              🏁 Mark Ready for Production
            </button>
          )}

          {po.status === 'READY_FOR_PRODUCTION' && can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
            <button className="btn-primary btn btn-sm" onClick={createProductionJob} disabled={saving}>
              {saving ? 'Creating...' : '🏭 Create Production Job'}
            </button>
          )}

          {can('SUPER_ADMIN') && (
            <button className="btn-danger btn btn-sm" onClick={() => setModal('delete')}>
              🗑 Delete
            </button>
          )}
        </div>
      </div>

      {/* Ready for Production call-to-action banner */}
      {po.status === 'READY_FOR_PRODUCTION' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Ready for Production</p>
              <p className="text-sm text-green-600">
                All materials are accounted for. Click the button to create a Production Job and start manufacturing.
              </p>
            </div>
          </div>
          {can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
            <button
              className="btn-primary btn flex-shrink-0"
              onClick={createProductionJob}
              disabled={saving}
            >
              {saving ? 'Creating...' : '🏭 Create Production Job'}
            </button>
          )}
        </div>
      )}

      {/* PO info cards */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">PO Details</h2></div>
          <div className="card-body space-y-2.5">
            {[
              ['PO Number', po.poNumber],
              ['Quotation', po.quotationId?.quotationNumber || '-'],
              ['Company', po.enquiryId?.companyName || '-'],
              ['Enquiry', po.enquiryId?.enquiryNumber || '-'],
              ['Status', <StatusBadge status={po.status} />],
              ['Created', fmtDateTime(po.createdAt)],
              ['Remarks', po.remarks || '-'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm items-center">
                <span className="text-slate-400">{l}</span>
                <span className="text-slate-700 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Super Admin Approval</h2></div>
          <div className="card-body space-y-2.5">
            {[
              ['Approval Status', <StatusBadge status={po.superAdminApproval?.status || 'PENDING'} />],
              ['Approved By', po.superAdminApproval?.approvedBy?.name || '-'],
              ['Date', po.superAdminApproval?.approvedAt ? fmtDateTime(po.superAdminApproval.approvedAt) : '-'],
              ['Remarks', po.superAdminApproval?.remarks || '-'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm items-center">
                <span className="text-slate-400">{l}</span>
                <span className="text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOM File */}
      {po.bomFile && (
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">BOM File</h2></div>
          <div className="card-body"><FileList files={[po.bomFile]} /></div>
        </div>
      )}

      {/* Material Tracking */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Material Tracking</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {po.materialTracking?.length || 0} items · {po.materialTracking?.filter(m => !m.isPending).length || 0} received · {po.materialTracking?.filter(m => m.isPending).length || 0} pending
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allReceived && po.materialTracking?.length > 0 && (
              <span className="badge-green">✓ All Received</span>
            )}
          </div>
        </div>

        <div className="card-body p-0">
          {!po.materialTracking?.length ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-slate-500 text-sm">No materials tracked yet.</p>
              <p className="text-xs text-slate-400">
                Add individual material items using "+ Add Material", or use{' '}
                <span className="font-medium text-green-600">"Mark Ready for Production"</span>{' '}
                to proceed directly without material tracking.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Required Qty</th>
                  <th>Received Qty</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  {canEditMaterials && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {po.materialTracking?.map((m, i) => (
                  <MaterialRow
                    key={m._id || i}
                    item={m}
                    onUpdate={handleItemUpdate}
                    canEdit={canEditMaterials}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      <Modal open={modal === 'approve'} onClose={() => setModal(null)} title="Approve Purchase Order">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Approving <strong>{po.poNumber}</strong> allows the Purchase team to begin material procurement.
          </p>
          <div className="form-group">
            <label className="label">Remarks (optional)</label>
            <textarea className="input" rows={2} value={form.remarks || ''} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={() => handleApprove('APPROVED')} disabled={saving}>
              {saving ? '...' : '✓ Approve'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'reject'} onClose={() => setModal(null)} title="Reject Purchase Order">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Rejection Reason *</label>
            <textarea className="input" rows={2} value={form.remarks || ''} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-danger btn" onClick={() => handleApprove('REJECTED')} disabled={saving}>
              {saving ? '...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'mark-ready'} onClose={() => setModal(null)} title="Mark Ready for Production" size="sm">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">⚠ Manual Override</p>
            <p className="text-xs text-amber-700">
              This marks the PO as <strong>Ready for Production</strong> regardless of material receipt status.
              Use this when materials are sourced outside the system or tracking is not needed.
            </p>
          </div>
          <p className="text-sm text-slate-600">
            Once ready, you can create a Production Job for <strong>{po.enquiryId?.companyName}</strong>.
          </p>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn btn-sm font-medium bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg"
              onClick={handleMarkReady}
              disabled={saving}
            >
              {saving ? 'Updating...' : '🏁 Confirm — Mark Ready'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'add-item'} onClose={() => setModal(null)} title="Add Material Item">
        <div className="space-y-4">
          {[
            { key: 'materialName', label: 'Material Name *', type: 'text', placeholder: 'e.g. MS Sheet 2mm' },
            { key: 'quantity', label: 'Required Quantity *', type: 'number', placeholder: '0' },
            { key: 'unit', label: 'Unit', type: 'text', placeholder: 'pcs / kg / meter' },
            { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'Optional notes' },
          ].map(f => (
            <div className="form-group" key={f.key}>
              <label className="label">{f.label}</label>
              <input className="input" type={f.type} placeholder={f.placeholder}
                value={addItemForm[f.key]}
                onChange={e => setAddItemForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleAddItem} disabled={saving}>
              {saving ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Purchase Order" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">⚠ This cannot be undone</p>
            <p className="text-xs text-red-700 mt-1">
              Deleting <strong>{po.poNumber}</strong> will permanently remove this PO and all material tracking data.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-danger btn" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : '🗑 Delete PO'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function MaterialRow({ item, onUpdate, canEdit }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({ ...item })

  const save = () => { onUpdate(local); setEditing(false) }
  const cancel = () => { setLocal({ ...item }); setEditing(false) }

  const isFullyReceived = (local.receivedQuantity || 0) >= local.quantity

  return (
    <tr>
      <td className="font-medium text-slate-800">{item.materialName}</td>
      <td className="text-slate-600">{item.quantity} {item.unit}</td>
      <td>
        {editing ? (
          <input
            type="number"
            className="input w-24 py-1 text-sm"
            value={local.receivedQuantity || 0}
            min={0}
            onChange={e => setLocal(p => ({ ...p, receivedQuantity: Number(e.target.value) }))}
          />
        ) : (
          <span className={isFullyReceived ? 'text-green-600 font-semibold' : 'text-slate-600'}>
            {item.receivedQuantity || 0} {item.unit}
          </span>
        )}
      </td>
      <td>
        {item.isPending === false || (item.receivedQuantity || 0) >= item.quantity
          ? <span className="badge-green">✓ Received</span>
          : <span className="badge-yellow">Pending</span>}
      </td>
      <td className="text-slate-400 text-xs max-w-xs truncate">{item.remarks || '-'}</td>
      {canEdit && (
        <td>
          {editing ? (
            <div className="flex gap-1">
              <button className="btn-primary btn btn-sm" onClick={save}>Save</button>
              <button className="btn-secondary btn btn-sm" onClick={cancel}>✕</button>
            </div>
          ) : (
            <button className="btn-ghost btn btn-sm" onClick={() => setEditing(true)}>Edit</button>
          )}
        </td>
      )}
    </tr>
  )
}
