import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { quotationAPI } from '../../api'
import { PageHeader, StatusBadge, Pagination, EmptyState, Spinner } from '../../components/common'
import { fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function QuotationList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [salesStatus, setSalesStatus] = useState('')
  const [adminStatus, setAdminStatus] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await quotationAPI.list({ salesStatus, quotationAdminStatus: adminStatus, page })
      setItems(data.data)
      setPagination(data.pagination)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [salesStatus, adminStatus])


  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this quotation? This cannot be undone.')) return
    try {
      await quotationAPI.delete(id)
      toast.success('Quotation deleted')
      load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader title="Quotations" subtitle="Track quotation status from preparation to approval" />

      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input w-auto" value={adminStatus} onChange={e => setAdminStatus(e.target.value)}>
          <option value="">All Admin Status</option>
          {['QUOTE_RECEIVED','IN_PROGRESS','COMPLETED'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={salesStatus} onChange={e => setSalesStatus(e.target.value)}>
          <option value="">All Sales Status</option>
          {['PENDING','SENT_TO_CLIENT','NEGOTIATION','APPROVED','REJECTED'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No quotations found" icon="📄" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Client / Company</th>
                <th>Admin Status</th>
                <th>Sales Status</th>
                <th>Value</th>
                <th>Date</th>
                {can('SUPER_ADMIN') && <th>Delete</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(q => (
                <tr key={q._id} className="cursor-pointer" onClick={() => navigate(`/quotations/${q._id}`)}>
                  <td><span className="font-mono text-xs text-brand-600 font-medium">{q.quotationNumber}</span></td>
                  <td>
                    <p className="font-medium text-slate-800">{q.enquiryId?.companyName || '-'}</p>
                    <p className="text-xs text-slate-400">{q.enquiryId?.clientName}</p>
                  </td>
                  <td><StatusBadge status={q.quotationAdminStatus} /></td>
                  <td><StatusBadge status={q.salesStatus} /></td>
                  <td className="text-slate-600">
                    {q.quotationValue ? `₹${Number(q.quotationValue).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="text-slate-500">{fmtDate(q.createdAt)}</td>
                  {can('SUPER_ADMIN') && (
                    <td onClick={ev => ev.stopPropagation()}>
                      <button className="btn-danger btn btn-sm" onClick={ev => handleDelete(ev, q._id)}>🗑</button>
                    </td>
                  )}
                  <td>
                    <button className="btn-ghost btn btn-sm" onClick={ev => { ev.stopPropagation(); navigate(`/quotations/${q._id}`) }}>View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />
    </div>
  )
}
