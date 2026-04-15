import { useState, useEffect } from 'react'
import { materialAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { PageHeader, SearchInput, Pagination, EmptyState, Spinner, Modal } from '../../components/common'
import toast from 'react-hot-toast'

export default function MaterialList() {
  const { can } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pages: 1 })
  const [modal, setModal] = useState(null) // 'create' | 'edit' | 'bulk'
  const [form, setForm] = useState({ name: '', code: '', unit: '', stockQuantity: 0, minimumStock: 0, category: '' })
  const [editId, setEditId] = useState(null)
  const [bulkFile, setBulkFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const { data } = await materialAPI.list({ search, lowStock: lowStock ? 'true' : '', page })
      setItems(data.data)
      setPagination(data.pagination || { page: 1, pages: 1 })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(1) }, [search, lowStock])

  const openCreate = () => {
    setForm({ name: '', code: '', unit: '', stockQuantity: 0, minimumStock: 0, category: '' })
    setEditId(null)
    setModal('create')
  }

  const openEdit = (m) => {
    setForm({ name: m.name, code: m.code, unit: m.unit, stockQuantity: m.stockQuantity, minimumStock: m.minimumStock, category: m.category || '' })
    setEditId(m._id)
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name || !form.code || !form.unit) return toast.error('Name, Code and Unit are required')
    setSaving(true)
    try {
      if (editId) {
        await materialAPI.update(editId, form)
        toast.success('Material updated')
      } else {
        await materialAPI.create(form)
        toast.success('Material created')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleBulkUpload = async () => {
    if (!bulkFile) return toast.error('Select an Excel file')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', bulkFile)
      const { data } = await materialAPI.bulkUpload(fd)
      toast.success(`Created: ${data.data.created}, Updated: ${data.data.updated}`)
      if (data.data.errors?.length > 0) toast.error(`${data.data.errors.length} rows had errors`)
      setModal(null)
      setBulkFile(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally { setSaving(false) }
  }

  const downloadTemplate = async () => {
    try {
      const { data } = await materialAPI.template()
      const url = URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'material_template.xlsx'; a.click()
    } catch { toast.error('Failed to download template') }
  }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Material Master"
        subtitle="Manage material inventory and stock levels"
        action={can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
          <div className="flex gap-2">
            <button className="btn-secondary btn" onClick={() => setModal('bulk')}>⬆ Bulk Upload</button>
            <button className="btn-primary btn" onClick={openCreate}>+ Add Material</button>
          </div>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search materials..." />
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="rounded" />
          Show low stock only
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No materials found" icon="📦"
          action={can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
            <button className="btn-primary btn" onClick={openCreate}>Add First Material</button>
          )}
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Stock Qty</th>
                <th>Min Stock</th>
                <th>Status</th>
                {can('SUPER_ADMIN', 'PURCHASE_ADMIN') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(m => {
                const isLow = m.stockQuantity <= m.minimumStock
                return (
                  <tr key={m._id}>
                    <td><span className="font-mono text-xs text-brand-600 font-medium">{m.code}</span></td>
                    <td className="font-medium text-slate-800">{m.name}</td>
                    <td className="text-slate-500">{m.category || '-'}</td>
                    <td className="text-slate-500">{m.unit}</td>
                    <td className={`font-semibold ${isLow ? 'text-red-600' : 'text-slate-700'}`}>{m.stockQuantity}</td>
                    <td className="text-slate-500">{m.minimumStock}</td>
                    <td>
                      {isLow
                        ? <span className="badge-red">⚠ Low Stock</span>
                        : <span className="badge-green">OK</span>}
                    </td>
                    {can('SUPER_ADMIN', 'PURCHASE_ADMIN') && (
                      <td>
                        <button className="btn-ghost btn btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} onPage={load} />

      {/* Create / Edit Modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)}
        title={editId ? 'Edit Material' : 'Add Material'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="MS Sheet 2mm" />
            </div>
            <div className="form-group">
              <label className="label">Code *</label>
              <input className="input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="MAT001" />
            </div>
            <div className="form-group">
              <label className="label">Unit *</label>
              <input className="input" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="pcs / kg / meter" />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Electrical / Mechanical" />
            </div>
            <div className="form-group">
              <label className="label">Stock Quantity</label>
              <input className="input" type="number" value={form.stockQuantity} onChange={e => set('stockQuantity', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label">Minimum Stock</label>
              <input className="input" type="number" value={form.minimumStock} onChange={e => set('minimumStock', Number(e.target.value))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={modal === 'bulk'} onClose={() => setModal(null)} title="Bulk Upload Materials">
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
            <p className="text-sm font-medium text-brand-800 mb-1">Excel Format Required</p>
            <p className="text-xs text-brand-600">Columns: Name, Code, Unit, Stock Quantity, Minimum Stock, Category</p>
            <button className="btn-secondary btn btn-sm mt-3" onClick={downloadTemplate}>⬇ Download Template</button>
          </div>
          <div className="form-group">
            <label className="label">Upload Excel File (.xlsx)</label>
            <input type="file" accept=".xlsx,.xls" className="input" onChange={e => setBulkFile(e.target.files[0])} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary btn" onClick={handleBulkUpload} disabled={saving}>{saving ? 'Uploading...' : 'Upload'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
