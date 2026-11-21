
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useOutletContext,
} from 'react-router-dom'

import Layout from './components/Layout.jsx'
import AdminRoute from './components/AdminRoute.jsx'

import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import StoryDetails from './pages/StoryDetails.jsx'
import Reader from './pages/Reader.jsx'
import Writer from './pages/Writer.jsx'
import Library from './pages/Library.jsx'
import Profile from './pages/Profile.jsx'
import PublicProfile from './pages/PublicProfile.jsx'
import Notifications from './pages/Notifications.jsx'
import Following from './pages/following.jsx'
import Followers from './pages/Followers.jsx'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Admin from './pages/Admin.jsx'
import AdminLogin from './pages/AdminLogin.jsx'

import ApiTest from './api/ApiTest.jsx'

function ProtectedRoute() {
  const token = localStorage.getItem('moonlit_token')
  const outletContext = useOutletContext()

  return token
    ? <Outlet context={outletContext} />
    : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* API Connection Test */}
        <Route path="/api-test" element={<ApiTest />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* User Website */}
        <Route element={<Layout />}>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/story/:id" element={<StoryDetails />} />
          <Route path="/user/:username" element={<PublicProfile />} />

          {/* Protected Pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/reader/:id" element={<Reader />} />
            <Route path="/reader/:id/:chapterId" element={<Reader />} />
            <Route path="/writer" element={<Writer />} />
            <Route path="/library" element={<Library />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/following" element={<Following />} />
            <Route path="/following/:userId" element={<Following />} />

            <Route path="/followers" element={<Followers />} />
            <Route path="/followers/:userId" element={<Followers />} />
          </Route>
        </Route>

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
