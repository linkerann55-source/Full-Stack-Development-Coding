
import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  const token = localStorage.getItem('moonlit_admin_token')
  const isAdminLoggedIn =
    localStorage.getItem('moonlit_admin_logged_in') === 'true'

  if (!token || !isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
