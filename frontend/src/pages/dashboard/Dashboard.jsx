import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { reportsAPI } from '../../api'
import { StatCard, Spinner } from '../../components/common'
import { fmtDate, statusColors } from '../../utils/helpers'
import { StatusBadge } from '../../components/common'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsAPI.dashboard().then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Spinner /></div>
  )

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-semibold">{greet()}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-brand-200 text-sm mt-0.5">{user?.role?.replace(/_/g, ' ')} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats grid */}
      {data && (
        <>
          {/* Show full stats for non-production roles */}
          {!['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(user?.role) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Enquiries" value={data.enquiries?.total ?? 0} icon="📋" color="blue" onClick={() => navigate('/enquiries')} />
              <StatCard label="Open Enquiries" value={data.enquiries?.open ?? 0} icon="🔓" color="yellow" onClick={() => navigate('/enquiries?status=OPEN')} />
              <StatCard label="Approved" value={data.enquiries?.approved ?? 0} icon="✅" color="green" onClick={() => navigate('/enquiries?status=APPROVED')} />
              <StatCard label="Pending Quotations" value={data.quotations?.pending ?? 0} icon="📄" color="orange" onClick={() => navigate('/quotations')} />
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Show Active POs and Low Stock for non-production roles */}
            {!['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(user?.role) && (
              <>
                <StatCard label="Active POs" value={data.purchase?.active ?? 0} icon="🛒" color="blue" onClick={() => navigate('/purchase')} />
                <StatCard label="Low Stock Items" value={data.materials?.lowStock ?? 0} icon="⚠️" color="red" onClick={() => navigate('/materials')} />
              </>
            )}

            {/* Always show Ready for Production and Active Jobs */}
            <StatCard label="Ready for Production" value={data.purchase?.readyForProduction ?? 0} icon="🏭" color="green" onClick={() => navigate('/production')} />
            <StatCard label="Active Jobs" value={data.production?.active ?? 0} icon="⚙️" color="yellow" onClick={() => navigate('/production')} />
            <StatCard label="Completed Production" value={data.production?.completed ?? 0} icon="✅" color="blue" onClick={() => navigate('/production')} />

            {/* Fill empty spaces for production admins */}
            {['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(user?.role) && (
              <>
                <div></div>
              </>
            )}
          </div>
        </>
      )}

      {/* Recent tables */}
      <div className={`grid grid-cols-1 ${!['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(user?.role) ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Recent enquiries - hide for production admins */}
        {!['FABRICATION_ADMIN', 'ELECTRICAL_ADMIN'].includes(user?.role) && (
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Recent Enquiries</h2>
              <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate('/enquiries')}>View all →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.recentEnquiries?.length === 0 && (
                <p className="text-sm text-slate-400 p-4">No enquiries yet</p>
              )}
              {data?.recentEnquiries?.map(e => (
                <div key={e._id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/enquiries/${e._id}`)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{e.companyName}</p>
                      <p className="text-xs text-slate-400">{e.enquiryNumber} · {e.clientName}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={e.status} />
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDate(e.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent production jobs */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Active Production Jobs</h2>
            <button className="text-xs text-brand-600 hover:underline" onClick={() => navigate('/production')}>View all →</button>
          </div>
          <div className="divide-y divide-slate-100">
            {data?.recentJobs?.length === 0 && (
              <p className="text-sm text-slate-400 p-4">No active jobs</p>
            )}
            {data?.recentJobs?.map(j => (
              <div key={j._id} className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/production/${j._id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{j.enquiryId?.companyName || 'N/A'}</p>
                    <p className="text-xs text-slate-400">{j.jobNumber}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={j.overallStatus} />
                    <p className="text-xs text-slate-400 mt-0.5">Fab: {j.fabricationStatus?.replace(/_/g,' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
