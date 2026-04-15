import { useState, useEffect } from 'react'
import { usersAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, Spinner, EmptyState, Modal } from '../../components/common'
import { fmtDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ROLES = ['SUPER_ADMIN','SALES_ADMIN','QUOTATION_ADMIN','PURCHASE_ADMIN','FABRICATION_ADMIN','ELECTRICAL_ADMIN']

export default function UsersPage() {
  const { can } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES_ADMIN', phone: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await usersAPI.list()
      setUsers(data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'SALES_ADMIN', phone: '', isActive: true })
    setEditId(null)
    setModal('form')
  }

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', isActive: u.isActive })
    setEditId(u._id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.name || !form.email || (!editId && !form.password)) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      if (editId) {
        await usersAPI.update(editId, { name: form.name, role: form.role, phone: form.phone, isActive: form.isActive })
        toast.success('User updated')
      } else {
        await usersAPI.create(form)
        toast.success('User created')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  if (!can('SUPER_ADMIN')) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-4xl mb-3">🔒</p>
        <p className="text-slate-600 font-medium">Access Denied</p>
        <p className="text-sm text-slate-400 mt-1">Only Super Admin can manage users</p>
      </div>
    </div>
  )

  const ROLE_COLOR = {
    SUPER_ADMIN: 'badge-red', SALES_ADMIN: 'badge-blue', QUOTATION_ADMIN: 'badge-purple',
    PURCHASE_ADMIN: 'badge-orange', FABRICATION_ADMIN: 'badge-yellow', ELECTRICAL_ADMIN: 'badge-green'
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage system users and their roles"
        action={<button className="btn-primary btn" onClick={openCreate}>+ Add User</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" icon="👥" />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-xs">
                        {u.name?.charAt(0)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-slate-500">{u.email}</td>
                  <td><span className={ROLE_COLOR[u.role] || 'badge-gray'}>{u.role?.replace(/_/g, ' ')}</span></td>
                  <td className="text-slate-500">{u.phone || '-'}</td>
                  <td>
                    {u.isActive
                      ? <span className="badge-green">Active</span>
                      : <span className="badge-red">Inactive</span>}
                  </td>
                  <td className="text-slate-400 text-xs">{u.lastLogin ? fmtDateTime(u.lastLogin) : 'Never'}</td>
                  <td>
                    <button className="btn-ghost btn btn-sm" onClick={() => openEdit(u)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={editId ? 'Edit User' : 'Create User'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="label">Full Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group col-span-2">
              <label className="label">Email *</label>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)}
                disabled={!!editId} placeholder="john@pratiksha.com" />
            </div>
            {!editId && (
              <div className="form-group col-span-2">
                <label className="label">Password *</label>
                <input className="input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
              </div>
            )}
            <div className="form-group">
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            {editId && (
              <div className="form-group col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
                  <span className="text-sm font-medium text-slate-700">Active User</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
