import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { productionAPI } from '../../api'
import { PageHeader, StatusBadge, Pagination, EmptyState, Spinner, StatCard } from '../../components/common'
import { fmtDate } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const STAGE_COLOR = {
  NOT_STARTED: 'bg-slate-200',
  IN_PROGRESS: 'bg-blue-400',
  MOUNTING_PLATE_READY: 'bg-yellow-400',
  MOUNTING_PLATE_SENT_TO_POWDER_COATING: 'bg-orange-400',
  PANEL_READY: 'bg-yellow-400',
  PANEL_SENT_FOR_POWDER_COATING: 'bg-orange-400',
  RECEIVED: 'bg-teal-400',
  COMPLETED: 'bg-green-500',
  READY_TO_START: 'bg-blue-300',
  TESTING: 'bg-purple-400',
  READY_FOR_DISPATCH: 'bg-green-500',
  DISPATCHED: 'bg-slate-500',
}

export default function ProductionList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [overallStatus, setOverallStatus] = useState('ACTIVE')
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })

  const load = async (page = 1) => {
    setLoading(true)
    try {
      let queryParams = { page };
      if (overallStatus === 'ACTIVE') {
        // Show IN_PRODUCTION and READY_FOR_DISPATCH jobs
        queryParams.overallStatus = 'IN_PRODUCTION,READY_FOR_DISPATCH';
      } else if (overallStatus === 'COMPLETED') {
        // Show only DISPATCHED jobs (COMPLETED is UI label for DISPATCHED status)
        queryParams.overallStatus = 'DISPATCHED';
      } else if (overallStatus !== '') {
        // Pass through individual statuses: IN_PRODUCTION, READY_FOR_DISPATCH, DISPATCHED
        queryParams.overallStatus = overallStatus;
      }
      const [listRes, statsRes] = await Promise.all([
        productionAPI.list(queryParams),
        productionAPI.stats()
      ])
      setItems(listRes.data.data)
      setPagination(listRes.data.pagination || { page: 1, pages: 1 })
      setStats(statsRes.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [overallStatus])

  const getStatCount = (statsArr, key) => statsArr?.find(s => s._id === key)?.count || 0


  const handleDelete = async (e, jobId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this production job? This cannot be undone.')) return
    try {
      await productionAPI.delete(jobId)
      toast.success('Job deleted')
      load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Production Jobs" subtitle="Track fabrication, powder coating and electrical workflow" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="In Production" value={getStatCount(stats.overallStats, 'IN_PRODUCTION')} icon="⚙️" color="blue" />
          <StatCard label="Ready for Dispatch" value={getStatCount(stats.overallStats, 'READY_FOR_DISPATCH')} icon="📦" color="green" />
          <StatCard label="Dispatched" value={getStatCount(stats.overallStats, 'DISPATCHED')} icon="🚚" color="purple" />
          <StatCard label="Electrical Ready" value={getStatCount(stats.electricalStats, 'READY_TO_START')} icon="⚡" color="yellow" />
        </div>
      )}

      <div className="flex gap-3">
        <select className="input w-auto" value={overallStatus} onChange={e => setOverallStatus(e.target.value)}>
          <option value="ACTIVE">Active Jobs</option>
          <option value="COMPLETED">Completed Jobs</option>
          <option value="IN_PRODUCTION">In Production Only</option>
          <option value="READY_FOR_DISPATCH">Ready for Dispatch Only</option>
          <option value="DISPATCHED">Dispatched Only</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No production jobs" icon="🏭" subtitle="Jobs are created from approved Purchase Orders" />
      ) : (
        <div className="space-y-3">
          {items.map(job => (
            <div
              key={job._id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/production/${job._id}`)}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-brand-600 font-semibold">{job.jobNumber}</span>
                      <StatusBadge status={job.overallStatus} />
                    </div>
                    <h3 className="font-semibold text-slate-800">{job.enquiryId?.companyName || 'N/A'}</h3>
                    <p className="text-xs text-slate-400">{job.enquiryId?.enquiryNumber} · Created {fmtDate(job.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === 'SUPER_ADMIN' && (
                      <button className="btn-danger btn btn-sm" onClick={e => handleDelete(e, job._id)}>🗑</button>
                    )}
                    <button className="btn-ghost btn btn-sm">View →</button>
                  </div>
                </div>

                {/* Progress pipeline */}
                <div className="grid grid-cols-4 gap-3">
                  <StageBlock label="Fabrication" status={job.fabricationStatus} />
                  <StageBlock label="Powder Coating Panel" status={job.powderCoatingStatus} />
                  <StageBlock label="Powder Coating Mounting Plate" status={job.mountingPlatePowderCoatingStatus} />
                  <StageBlock label="Electrical" status={job.electricalStatus} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />
    </div>
  )
}

function StageBlock({ label, status }) {
  const color = STAGE_COLOR[status] || 'bg-slate-200'
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
        <span className="text-xs text-slate-600">{status?.replace(/_/g, ' ')}</span>
      </div>
    </div>
  )
}
