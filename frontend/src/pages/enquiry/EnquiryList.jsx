import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { enquiryAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, StatusBadge, SearchInput, Pagination, EmptyState, Spinner } from '../../components/common'
import { fmtDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const STATUSES = ['', 'OPEN', 'IN_QUOTATION', 'APPROVED', 'REJECTED', 'CLOSED']

export default function EnquiryList() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await enquiryAPI.list({ search, status, page, limit: 20 })
      setEnquiries(data.data)
      setPagination(data.pagination)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [search, status])


  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this enquiry? This cannot be undone.')) return
    try {
      await enquiryAPI.delete(id)
      toast.success('Enquiry deleted')
      load(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        subtitle="Manage client enquiries and requirements"
        action={can('SUPER_ADMIN', 'SALES_ADMIN') && (
          <button className="btn-primary btn" onClick={() => navigate('/enquiries/new')}>+ New Enquiry</button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search enquiries..." />
        <select className="input w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : enquiries.length === 0 ? (
        <EmptyState title="No enquiries found" icon="📋"
          action={can('SUPER_ADMIN', 'SALES_ADMIN') && (
            <button className="btn-primary btn" onClick={() => navigate('/enquiries/new')}>Create First Enquiry</button>
          )}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Enquiry #</th>
                <th>Company / Client</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th>Created By</th>
                {can('SUPER_ADMIN') && <th>Delete</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(e => (
                <tr key={e._id} className="cursor-pointer" onClick={() => navigate(`/enquiries/${e._id}`)}>
                  <td><span className="font-mono text-xs text-brand-600 font-medium">{e.enquiryNumber}</span></td>
                  <td>
                    <p className="font-medium text-slate-800">{e.companyName}</p>
                    <p className="text-xs text-slate-400">{e.clientName}</p>
                  </td>
                  <td>
                    <p className="text-slate-600">{e.email}</p>
                    <p className="text-xs text-slate-400">{e.phone}</p>
                  </td>
                  <td><StatusBadge status={e.status} /></td>
                  <td className="text-slate-500">{fmtDate(e.createdAt)}</td>
                  <td className="text-slate-500">{e.createdBy?.name || '-'}</td>
                  {can('SUPER_ADMIN') && (
                    <td onClick={ev => ev.stopPropagation()}>
                      <button className="btn-danger btn btn-sm" onClick={(ev) => handleDelete(ev, e._id)}>🗑</button>
                    </td>
                  )}
                  <td>
                    <button className="btn-ghost btn btn-sm" onClick={(ev) => { ev.stopPropagation(); navigate(`/enquiries/${e._id}`) }}>View →</button>
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
