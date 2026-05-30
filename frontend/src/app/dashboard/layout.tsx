import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import { ExamProvider } from '../../contexts/ExamContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ExamProvider>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <TopBar />
        <div className="flex flex-1 max-w-7xl mx-auto w-full gap-4">
          <Sidebar />
          <main className="flex-1 bg-slate-50 py-4 pr-4 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ExamProvider>
  )
}
