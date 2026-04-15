import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notificationAPI } from '../../api'
import { hasAccess } from '../../utils/helpers'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⊞', exact: true, module: 'dashboard' },
  { to: '/enquiries', label: 'Enquiries', icon: '📋', module: 'enquiries' },
  { to: '/quotations', label: 'Quotations', icon: '📄', module: 'quotations' },
  { to: '/purchase', label: 'Purchase Orders', icon: '🛒', module: 'purchase' },
  { to: '/materials', label: 'Materials', icon: '📦', module: 'materials' },
  { to: '/production', label: 'Production', icon: '🏭', module: 'production' },
  { to: '/material-requests', label: 'Material Requests', icon: '📝', module: 'material-requests' },
  { to: '/reports', label: 'Reports', icon: '📊', module: 'reports' },
  { to: '/users', label: 'Users', icon: '👥', module: 'users' },
  { to: '/notifications', label: 'Notifications', icon: '🔔', module: 'notifications' },
]

export default function AppLayout() {
  const { user, logout, can } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    notificationAPI.list({ limit: 1 }).then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    const interval = setInterval(() => {
      notificationAPI.list({ limit: 1 }).then(r => setUnread(r.data.unreadCount || 0)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const visibleNav = NAV.filter(n => hasAccess(user?.role, n.module))

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-30`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">PT</div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">Pratiksha Tech</p>
              <p className="text-xs text-slate-400 truncate">ERP System</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${!sidebarOpen ? 'justify-center' : ''}`
              }
            >
              <span className="text-base leading-none flex-shrink-0 relative">
                {item.icon}
                {item.module === 'notifications' && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-semibold text-xs flex-shrink-0">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors text-lg" title="Logout">↩</button>
            </div>
          ) : (
            <button onClick={logout} className="w-full flex justify-center py-2 text-slate-400 hover:text-red-500 text-lg">↩</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl"
          >☰</button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="badge badge-blue text-xs">{user?.role?.replace(/_/g, ' ')}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
