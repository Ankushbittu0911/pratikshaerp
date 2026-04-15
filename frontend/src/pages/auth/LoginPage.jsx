import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Enter email and password')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-brand-900/50">PT</div>
          <h1 className="text-2xl font-bold text-white">Pratiksha Technologies</h1>
          <p className="text-brand-300 mt-1 text-sm">Enterprise Resource Planning</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@pratiksha.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary btn w-full justify-center py-2.5 mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-2">Demo credentials:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
              {[
                ['Super Admin', 'superadmin@pratiksha.com'],
                ['Sales Admin', 'sales@pratiksha.com'],
                ['Quotation', 'quotation@pratiksha.com'],
                ['Purchase', 'purchase@pratiksha.com'],
                ['Fabrication', 'fabrication@pratiksha.com'],
                ['Electrical', 'electrical@pratiksha.com'],
              ].map(([role, email]) => (
                <button
                  key={email}
                  onClick={() => setForm({ email, password: 'Admin@123' })}
                  className="text-left px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                >
                  <span className="text-brand-600 font-medium">{role}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Password: Admin@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
