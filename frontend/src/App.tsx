import type { ReactNode } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "@/auth"
import { Layout } from "@/components/Layout"
import { PageSkeleton } from "@/components/shared"
import { CalendarPage } from "@/pages/Calendar"
import { CampaignDetailPage } from "@/pages/CampaignDetail"
import { CampaignsPage } from "@/pages/Campaigns"
import { ClientsPage } from "@/pages/Clients"
import { DashboardPage } from "@/pages/Dashboard"
import { LoginPage } from "@/pages/Login"
import { PlatformsPage } from "@/pages/Platforms"
import { ReportsPage } from "@/pages/Reports"

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-12"><PageSkeleton /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user && !loading ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="campanhas" element={<CampaignsPage />} />
        <Route path="campanhas/:id" element={<CampaignDetailPage />} />
        <Route path="calendario" element={<CalendarPage />} />
        <Route path="plataformas" element={<PlatformsPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
