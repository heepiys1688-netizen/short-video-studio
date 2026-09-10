import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './components/landing/Landing'
import Auth from './components/auth/Auth'
import DashboardApp from './components/dashboard/DashboardApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard/*" element={<DashboardApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
