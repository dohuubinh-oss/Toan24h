import Sidebar from '../../components/layout/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-page-bg">
      <Sidebar />
      <div className="flex-1 p-8 ml-64 max-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
