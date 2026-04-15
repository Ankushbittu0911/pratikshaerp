import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productionAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge, FileList, Spinner, Modal } from '../../components/common'
import { fmtDate, fmtDateTime, FABRICATION_STATUSES, POWDER_COATING_STATUSES, ELECTRICAL_STATUSES } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STAGE_COLOR = {
  NOT_STARTED: 'bg-slate-300', IN_PROGRESS: 'bg-blue-500', MOUNTING_PLATE_READY: 'bg-yellow-500',
  MOUNTING_PLATE_SENT_TO_POWDER_COATING: 'bg-orange-500', PANEL_READY: 'bg-yellow-500', PANEL_SENT_FOR_POWDER_COATING: 'bg-orange-500', RECEIVED: 'bg-teal-500',
  COMPLETED: 'bg-green-500', READY_TO_START: 'bg-blue-300', TESTING: 'bg-purple-500',
  READY_FOR_DISPATCH: 'bg-green-600', DISPATCHED: 'bg-slate-600',
}

export default function ProductionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { can, user } = useAuth()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isFab = user?.role === 'FABRICATION_ADMIN'
  const isElec = user?.role === 'ELECTRICAL_ADMIN'
  const isSuper = user?.role === 'SUPER_ADMIN'
  const isPurchase = user?.role === 'PURCHASE_ADMIN'

  const load = async () => {
    try {
      const { data } = await productionAPI.get(id)
      setJob(data.data)
    } catch { toast.error('Failed to load job') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const updateFabrication = async () => {
    setSaving(true)
    try {
      await productionAPI.updateFabrication(id, { status: form.status })
      toast.success('Fabrication status updated')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const updatePowderCoating = async () => {
    setSaving(true)
    try {
      await productionAPI.updatePowderCoating(id, { status: form.status })
      toast.success('Panel powder coating status updated')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const updateMountingPlatePowderCoating = async () => {
    setSaving(true)
    try {
      await productionAPI.updateMountingPlatePowderCoating(id, { status: form.status })
      toast.success('Mounting plate powder coating status updated')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const updateElectrical = async () => {
    setSaving(true)
    try {
      await productionAPI.updateElectrical(id, { status: form.status })
      toast.success('Electrical status updated')
      setModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const addWorkLog = async () => {
    if (!form.workDone) return toast.error('Work done is required')
    setSaving(true)
    try {
      const dept = isFab ? 'FABRICATION' : isElec ? 'ELECTRICAL' : form.department
      await productionAPI.addWorkLog(id, { workDone: form.workDone, issues: form.issues, department: dept })
      toast.success('Work log added')
      setModal(null)
      setForm({})
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const renderTimestamp = (label, date) => {
    if (!date) return null
    return <p className="text-xs text-slate-500">{label} {fmtDateTime(date)}</p>
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await productionAPI.delete(id)
      toast.success('Production job deleted')
      navigate('/production')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!job) return null

  const canUpdateFab = can('SUPER_ADMIN', 'FABRICATION_ADMIN')
  const canUpdateElec = can('SUPER_ADMIN', 'ELECTRICAL_ADMIN')
  const canUpdatePC = can('SUPER_ADMIN', 'ELECTRICAL_ADMIN')
  const canAddLog = can('SUPER_ADMIN', 'FABRICATION_ADMIN', 'ELECTRICAL_ADMIN')

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button className="text-sm text-slate-400 hover:text-slate-600" onClick={() => navigate('/production')}>← Production</button>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-mono">{job.jobNumber}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{job.enquiryId?.companyName || 'Production Job'}</h1>
          <div className="flex gap-2 mt-1">
            <StatusBadge status={job.overallStatus} />
            <span className="text-xs text-slate-400">{job.enquiryId?.enquiryNumber}</span>
          </div>
        </div>
        {canAddLog && (
          <button className="btn-secondary btn" onClick={() => { setForm({ department: isFab ? 'FABRICATION' : isElec ? 'ELECTRICAL' : '' }); setModal('log') }}>
            + Add Work Log
          </button>
        )}
        {can('SUPER_ADMIN') && (
          <button className="btn-danger btn btn-sm" onClick={() => setModal('delete-job')}>🗑 Delete Job</button>
        )}
      </div>

      {/* Status Pipeline — 4 stages */}
      <div className="grid grid-cols-4 gap-4">
        {/* Fabrication */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">🔧 Fabrication</h2>
            {canUpdateFab && (
              <button className="btn-ghost btn btn-sm" onClick={() => { setForm({ status: job.fabricationStatus }); setModal('fab') }}>Update</button>
            )}
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${STAGE_COLOR[job.fabricationStatus]}`} />
              <span className="text-sm font-medium">{job.fabricationStatus?.replace(/_/g, ' ')}</span>
            </div>
            <div className="space-y-1">
              {renderTimestamp('Fabrication started:', job.fabricationStartedAt)}
              {renderTimestamp('Panel ready:', job.panelReadyAt)}
              {renderTimestamp('Panel sent to powder coating:', job.panelSentToPowderCoatingAt)}
              {renderTimestamp('Mounting plate ready:', job.mountingPlateReadyAt)}
              {renderTimestamp('Mounting plate sent to powder coating:', job.mountingPlateSentToPowderCoatingAt)}
              {FABRICATION_STATUSES.map(s => (
                <div key={s} className={`flex items-center gap-2 text-xs ${s === job.fabricationStatus ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s === job.fabricationStatus ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  {s.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Powder Coating Panel */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">🎨 Powder Coating Panel</h2>
            {canUpdatePC && (job.fabricationStatus === 'PANEL_SENT_FOR_POWDER_COATING' || job.fabricationStatus === 'SENT_TO_POWDER_COATING') && (
              <button className="btn-ghost btn btn-sm" onClick={() => { setForm({ status: job.powderCoatingStatus }); setModal('pc') }}>Update</button>
            )}
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${STAGE_COLOR[job.powderCoatingStatus]}`} />
              <span className="text-sm font-medium">{job.powderCoatingStatus?.replace(/_/g, ' ')}</span>
            </div>
            <div className="space-y-1">
              {renderTimestamp('Started:', job.powderCoatingPanelStartedAt)}
              {renderTimestamp('Received:', job.powderCoatingPanelReceivedAt)}
              {POWDER_COATING_STATUSES.map(s => (
                <div key={s} className={`flex items-center gap-2 text-xs ${s === job.powderCoatingStatus ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s === job.powderCoatingStatus ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  {s.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Powder Coating Mounting Plate */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">🔩 Powder Coating Mounting Plate</h2>
            {canUpdatePC && job.fabricationStatus === 'MOUNTING_PLATE_SENT_TO_POWDER_COATING' && (
              <button className="btn-ghost btn btn-sm" onClick={() => { setForm({ status: job.mountingPlatePowderCoatingStatus }); setModal('mountingPlatePc') }}>Update</button>
            )}
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${STAGE_COLOR[job.mountingPlatePowderCoatingStatus]}`} />
              <span className="text-sm font-medium">{job.mountingPlatePowderCoatingStatus?.replace(/_/g, ' ')}</span>
            </div>
            <div className="space-y-1">
              {renderTimestamp('Started:', job.powderCoatingMountingPlateStartedAt)}
              {renderTimestamp('Received:', job.powderCoatingMountingPlateReceivedAt)}
              {POWDER_COATING_STATUSES.map(s => (
                <div key={s} className={`flex items-center gap-2 text-xs ${s === job.mountingPlatePowderCoatingStatus ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s === job.mountingPlatePowderCoatingStatus ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  {s.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Electrical */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">⚡ Electrical</h2>
            {canUpdateElec && (
              <button className="btn-ghost btn btn-sm" onClick={() => { setForm({ status: job.electricalStatus }); setModal('elec') }}>Update</button>
            )}
          </div>
          <div className="card-body">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${STAGE_COLOR[job.electricalStatus]}`} />
              <span className="text-sm font-medium">{job.electricalStatus?.replace(/_/g, ' ')}</span>
            </div>
            <div className="space-y-1 mb-3">
              {renderTimestamp('Electrical started:', job.electricalStartedAt)}
              {renderTimestamp('Testing started:', job.electricalTestingAt)}
              {renderTimestamp('Ready for dispatch:', job.electricalReadyForDispatchAt)}
              {renderTimestamp('Dispatched:', job.electricalDispatchedAt || job.dispatchDate)}
            </div>
            {(job.powderCoatingStatus !== 'RECEIVED' || job.mountingPlatePowderCoatingStatus !== 'RECEIVED') && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1 mb-2">
                ⚠ Awaiting both panel and mounting plate received from powder coating
              </p>
            )}
            <div className="space-y-1">
              {ELECTRICAL_STATUSES.map(s => (
                <div key={s} className={`flex items-center gap-2 text-xs ${s === job.electricalStatus ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${s === job.electricalStatus ? 'bg-brand-500' : 'bg-slate-200'}`} />
                  {s.replace(/_/g, ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">BOM Files</h2></div>
          <div className="card-body"><FileList files={job.bomFiles} /></div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="text-sm font-semibold text-slate-700">Drawing Files</h2></div>
          <div className="card-body"><FileList files={job.drawingFiles} /></div>
        </div>
      </div>

      {/* Work Logs */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Work Logs ({job.workLogs?.length || 0})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {job.workLogs?.length === 0 && <p className="text-sm text-slate-400 p-4">No work logs yet</p>}
          {[...(job.workLogs || [])].reverse().map((log, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.department === 'FABRICATION' ? 'bg-blue-100 text-blue-700' : log.department === 'ELECTRICAL' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {log.department}
                  </span>
                  <span className="text-xs text-slate-400">{log.updatedBy?.name || 'Unknown'}</span>
                </div>
                <span className="text-xs text-slate-400">{fmtDateTime(log.date)}</span>
              </div>
              <p className="text-sm text-slate-700">{log.workDone}</p>
              {log.issues && <p className="text-xs text-red-600 mt-1">⚠ Issue: {log.issues}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Fabrication Status Modal */}
      <Modal open={modal === 'fab'} onClose={() => setModal(null)} title="Update Fabrication Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {FABRICATION_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.status === 'MOUNTING_PLATE_SENT_TO_POWDER_COATING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              ⚠ This will automatically set Mounting Plate Powder Coating to IN_PROGRESS
            </div>
          )}
          {form.status === 'PANEL_SENT_FOR_POWDER_COATING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
              ⚠ This will automatically set Panel Powder Coating to IN_PROGRESS
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={updateFabrication} disabled={saving}>{saving ? '...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Powder Coating Status Modal */}
      <Modal open={modal === 'pc'} onClose={() => setModal(null)} title="Update Powder Coating Panel Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {POWDER_COATING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.status === 'RECEIVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
              ✓ Marking received will notify electrical and allow electrical work once both panel and mounting plate are received
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={updatePowderCoating} disabled={saving}>{saving ? '...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'mountingPlatePc'} onClose={() => setModal(null)} title="Update Mounting Plate Powder Coating Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {POWDER_COATING_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {form.status === 'RECEIVED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
              ✓ Mounting plate coating received. Once both panel and mounting plate are received, electrical can begin.
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={updateMountingPlatePowderCoating} disabled={saving}>{saving ? '...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Electrical Status Modal */}
      <Modal open={modal === 'elec'} onClose={() => setModal(null)} title="Update Electrical Status">
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Status</label>
            <select className="input" value={form.status || ''} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              {ELECTRICAL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(job.powderCoatingStatus !== 'RECEIVED' || job.mountingPlatePowderCoatingStatus !== 'RECEIVED') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ⚠ Both panel and mounting plate must be received from powder coating before electrical work
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={updateElectrical} disabled={saving}>{saving ? '...' : 'Update'}</button>
          </div>
        </div>
      </Modal>

      {/* Work Log Modal */}
      <Modal open={modal === 'log'} onClose={() => setModal(null)} title="Add Work Log">
        <div className="space-y-4">
          {isSuper && (
            <div className="form-group">
              <label className="label">Department</label>
              <select className="input" value={form.department || ''} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                <option value="">Select...</option>
                <option value="FABRICATION">FABRICATION</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="POWDER_COATING">POWDER_COATING</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="label">Work Done *</label>
            <textarea className="input" rows={3} value={form.workDone || ''}
              onChange={e => setForm(p => ({ ...p, workDone: e.target.value }))}
              placeholder="Describe what was done today..." />
          </div>
          <div className="form-group">
            <label className="label">Issues / Blockers</label>
            <textarea className="input" rows={2} value={form.issues || ''}
              onChange={e => setForm(p => ({ ...p, issues: e.target.value }))}
              placeholder="Any issues or blockers?" />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={addWorkLog} disabled={saving}>{saving ? 'Saving...' : 'Add Log'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Job Modal */}
      <Modal open={modal === 'delete-job'} onClose={() => setModal(null)} title="Delete Production Job" size="sm">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">⚠ This cannot be undone</p>
            <p className="text-xs text-red-700 mt-1">
              Deleting job <strong>{job.jobNumber}</strong> will permanently remove all production data, work logs and status history.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-danger btn" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : '🗑 Delete Job'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}