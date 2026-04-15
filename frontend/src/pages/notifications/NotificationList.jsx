import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationAPI } from '../../api'
import { PageHeader, Spinner, EmptyState } from '../../components/common'
import { timeAgo } from '../../utils/helpers'
import toast from 'react-hot-toast'

const TYPE_ICON = {
  ENQUIRY: '📋', QUOTATION: '📄', PURCHASE: '🛒',
  PRODUCTION: '🏭', MATERIAL: '📦', SYSTEM: '🔔'
}

export default function NotificationList() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await notificationAPI.list({ limit: 50 })
      setItems(data.data)
      setUnread(data.unreadCount || 0)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id)
      setItems(p => p.map(n => n._id === id ? { ...n, _isRead: true } : n))
      setUnread(p => Math.max(0, p - 1))
    } catch (e) { console.error(e) }
  }

  const markAll = async () => {
    try {
      await notificationAPI.markAllRead()
      toast.success('All notifications marked as read')
      load()
    } catch (e) { toast.error('Failed') }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notifications` : 'All caught up!'}
        action={unread > 0 && (
          <button className="btn-secondary btn btn-sm" onClick={markAll}>Mark all read</button>
        )}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState title="No notifications" icon="🔔" subtitle="You're all caught up!" />
      ) : (
        <div className="card divide-y divide-slate-100">
          {items.map(n => {
            const isRead = n.readBy?.includes?.(undefined) || n._isRead
            return (
              <div
                key={n._id}
                className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!isRead ? 'bg-brand-50/40' : ''}`}
                onClick={() => {
                  markRead(n._id)
                  if (n.link) navigate(n.link)
                }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${!isRead ? 'bg-brand-100' : 'bg-slate-100'}`}>
                  {TYPE_ICON[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!isRead ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {n.title}
                    </p>
                    {!isRead && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
