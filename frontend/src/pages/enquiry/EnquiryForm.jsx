import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { enquiryAPI } from '../../api'
import { PageHeader } from '../../components/common'
import toast from 'react-hot-toast'

export default function EnquiryForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ clientName: '', companyName: '', email: '', phone: '', requirementDetails: '', notes: '' })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientName || !form.companyName || !form.email || !form.phone || !form.requirementDetails)
      return toast.error('Please fill all required fields')

    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      files.forEach(f => fd.append('files', f))
      const { data } = await enquiryAPI.create(fd)
      toast.success(`Enquiry ${data.data.enquiryNumber} created!`)
      navigate(`/enquiries/${data.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create enquiry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Enquiry" subtitle="Record client enquiry and upload relevant documents" />

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Client Name *</label>
                <input className="input" value={form.clientName} onChange={e => set('clientName', e.target.value)} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="label">Company Name *</label>
                <input className="input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="ABC Industries" />
              </div>
              <div className="form-group">
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="client@company.com" />
              </div>
              <div className="form-group">
                <label className="label">Phone *</label>
                <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Requirement Details *</label>
              <textarea
                className="input min-h-28 resize-none"
                value={form.requirementDetails}
                onChange={e => set('requirementDetails', e.target.value)}
                placeholder="Describe the client's panel manufacturing requirements in detail..."
              />
            </div>

            <div className="form-group">
              <label className="label">Internal Notes</label>
              <textarea className="input min-h-16 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any internal notes..." />
            </div>

            <div className="form-group">
              <label className="label">Attachments (drawings, BOM, PDFs, images)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.dwg,.dxf"
                  onChange={e => setFiles(Array.from(e.target.files))}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-2xl mb-2">📎</p>
                  <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, Images, Excel, CAD files up to 50MB each</p>
                </label>
                {files.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded px-2 py-1">
                        <span>📄</span><span className="truncate">{f.name}</span>
                        <span className="text-slate-400 ml-auto">{(f.size / 1024).toFixed(0)}KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary btn" disabled={loading}>{loading ? 'Creating...' : 'Create Enquiry'}</button>
              <button type="button" className="btn-secondary btn" onClick={() => navigate('/enquiries')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
