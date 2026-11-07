import { Navigate, Outlet } from 'react-router-dom'

export default function AdminRoute() {
  const isAdminLoggedIn =
    sessionStorage.getItem('moonlit_admin_logged_in') === 'true'

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin-login" replace />
  }

  return <Outlet />
}