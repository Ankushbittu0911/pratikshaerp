import { useState, useEffect } from 'react'
import { reportsAPI } from '../../api'
import { PageHeader, Spinner, StatusBadge } from '../../components/common'
import { fmtDate } from '../../utils/helpers'

const TABS = ['Enquiry', 'Quotation', 'Purchase', 'Materials', 'Production']

export default function ReportsPage() {
  const [tab, setTab] = useState('Enquiry')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = async () => {
    setLoading(true)
    setData(null)
    try {
      let res
      const params = { from, to }
      if (tab === 'Enquiry') res = await reportsAPI.enquiry(params)
      else if (tab === 'Quotation') res = await reportsAPI.quotation(params)
      else if (tab === 'Purchase') res = await reportsAPI.purchase()
      else if (tab === 'Materials') res = await reportsAPI.material()
      else if (tab === 'Production') res = await reportsAPI.production()
      setData(res?.data?.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [tab])

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Business insights and analytics" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >{t}</button>
        ))}
      </div>

      {/* Date filters */}
      {['Enquiry', 'Quotation'].includes(tab) && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">From</label>
            <input type="date" className="input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">To</label>
            <input type="date" className="input w-auto" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button className="btn-primary btn btn-sm" onClick={load}>Apply</button>
        </div>
      )}

      {loading && <div className="flex justify-center py-16"><Spinner /></div>}

      {!loading && data && (
        <>
          {tab === 'Enquiry' && <EnquiryReport data={data} />}
          {tab === 'Quotation' && <QuotationReport data={data} />}
          {tab === 'Purchase' && <PurchaseReport data={data} />}
          {tab === 'Materials' && <MaterialReport data={data} />}
          {tab === 'Production' && <ProductionReport data={data} />}
        </>
      )}
    </div>
  )
}

function SummaryCards({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {items.map(({ label, value, color = 'blue' }) => {
        const colors = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', red: 'bg-red-50 text-red-700', yellow: 'bg-yellow-50 text-yellow-700', purple: 'bg-purple-50 text-purple-700' }
        return (
          <div key={label} className={`rounded-xl p-4 ${colors[color]}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function EnquiryReport({ data }) {
  const breakdown = data.statusBreakdown || []
  const getCount = (s) => breakdown.find(b => b._id === s)?.count || 0
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label: 'Total Enquiries', value: data.enquiries?.length || 0, color: 'blue' },
        { label: 'Open', value: getCount('OPEN'), color: 'yellow' },
        { label: 'Approved', value: getCount('APPROVED'), color: 'green' },
        { label: 'Rejected', value: getCount('REJECTED'), color: 'red' },
      ]} />
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Enquiry #</th><th>Company</th><th>Client</th><th>Status</th><th>Date</th><th>By</th></tr></thead>
          <tbody>
            {data.enquiries?.map(e => (
              <tr key={e._id}>
                <td className="font-mono text-xs text-brand-600">{e.enquiryNumber}</td>
                <td className="font-medium">{e.companyName}</td>
                <td className="text-slate-500">{e.clientName}</td>
                <td><StatusBadge status={e.status} /></td>
                <td className="text-slate-500">{fmtDate(e.createdAt)}</td>
                <td className="text-slate-500">{e.createdBy?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QuotationReport({ data }) {
  const totalValue = data.totalValue || 0
  const approved = data.conversionRate?.find(c => c._id === 'APPROVED')
  const total = data.quotations?.length || 0
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label: 'Total Quotations', value: total, color: 'blue' },
        { label: 'Approved', value: approved?.count || 0, color: 'green' },
        { label: 'Total Value (₹)', value: `${(totalValue / 100000).toFixed(1)}L`, color: 'purple' },
        { label: 'Conversion Rate', value: total > 0 ? `${Math.round(((approved?.count || 0) / total) * 100)}%` : '0%', color: 'yellow' },
      ]} />
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Quotation #</th><th>Company</th><th>Admin Status</th><th>Sales Status</th><th>Value</th><th>Date</th></tr></thead>
          <tbody>
            {data.quotations?.map(q => (
              <tr key={q._id}>
                <td className="font-mono text-xs text-brand-600">{q.quotationNumber}</td>
                <td className="font-medium">{q.enquiryId?.companyName || '-'}</td>
                <td><StatusBadge status={q.quotationAdminStatus} /></td>
                <td><StatusBadge status={q.salesStatus} /></td>
                <td>{q.quotationValue ? `₹${Number(q.quotationValue).toLocaleString('en-IN')}` : '-'}</td>
                <td className="text-slate-500">{fmtDate(q.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PurchaseReport({ data }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4 mb-5">
        {data.statusBreakdown?.map(s => (
          <div key={s._id} className="bg-slate-50 rounded-xl p-4">
            <p className="text-xl font-bold text-slate-800">{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s._id?.replace(/_/g, ' ')}</p>
          </div>
        ))}
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>PO #</th><th>Company</th><th>Quotation</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {data.pos?.map(p => (
              <tr key={p._id}>
                <td className="font-mono text-xs text-brand-600">{p.poNumber}</td>
                <td className="font-medium">{p.enquiryId?.companyName || '-'}</td>
                <td className="text-slate-500">{p.quotationId?.quotationNumber || '-'}</td>
                <td><StatusBadge status={p.status} /></td>
                <td className="text-slate-500">{fmtDate(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MaterialReport({ data }) {
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label: 'Total Materials', value: data.materials?.length || 0, color: 'blue' },
        { label: 'Low Stock Items', value: data.lowStockCount || 0, color: 'red' },
      ]} />
      {data.lowStockItems?.length > 0 && (
        <div className="card border-red-200">
          <div className="card-header bg-red-50">
            <h3 className="text-sm font-semibold text-red-700">⚠ Low Stock Alert ({data.lowStockItems.length} items)</h3>
          </div>
          <div className="table-wrapper border-0 rounded-none">
            <table className="table">
              <thead><tr><th>Code</th><th>Name</th><th>Stock</th><th>Minimum</th><th>Unit</th></tr></thead>
              <tbody>
                {data.lowStockItems.map(m => (
                  <tr key={m._id}>
                    <td className="font-mono text-xs">{m.code}</td>
                    <td className="font-medium">{m.name}</td>
                    <td className="text-red-600 font-semibold">{m.stockQuantity}</td>
                    <td>{m.minimumStock}</td>
                    <td className="text-slate-500">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Stock</th><th>Min</th><th>Unit</th></tr></thead>
          <tbody>
            {data.materials?.map(m => (
              <tr key={m._id}>
                <td className="font-mono text-xs text-brand-600">{m.code}</td>
                <td className={`font-medium ${m.stockQuantity <= m.minimumStock ? 'text-red-600' : ''}`}>{m.name}</td>
                <td className="text-slate-500">{m.category || '-'}</td>
                <td className={m.stockQuantity <= m.minimumStock ? 'text-red-600 font-semibold' : ''}>{m.stockQuantity}</td>
                <td>{m.minimumStock}</td>
                <td className="text-slate-500">{m.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductionReport({ data }) {
  return (
    <div className="space-y-5">
      <SummaryCards items={[
        { label: 'Total Jobs', value: data.jobs?.length || 0, color: 'blue' },
        { label: 'Dispatched', value: data.completedJobs || 0, color: 'green' },
      ]} />
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-slate-700">Fabrication Breakdown</h3></div>
          <div className="card-body space-y-2">
            {data.fabricationStats?.map(s => (
              <div key={s._id} className="flex justify-between text-sm">
                <span className="text-slate-500">{s._id?.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-700">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-slate-700">Electrical Breakdown</h3></div>
          <div className="card-body space-y-2">
            {data.electricalStats?.map(s => (
              <div key={s._id} className="flex justify-between text-sm">
                <span className="text-slate-500">{s._id?.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-700">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>Job #</th><th>Company</th><th>Fabrication</th><th>Electrical</th><th>Overall</th><th>Date</th></tr></thead>
          <tbody>
            {data.jobs?.map(j => (
              <tr key={j._id}>
                <td className="font-mono text-xs text-brand-600">{j.jobNumber}</td>
                <td className="font-medium">{j.enquiryId?.companyName || '-'}</td>
                <td><StatusBadge status={j.fabricationStatus} /></td>
                <td><StatusBadge status={j.electricalStatus} /></td>
                <td><StatusBadge status={j.overallStatus} /></td>
                <td className="text-slate-500">{fmtDate(j.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
