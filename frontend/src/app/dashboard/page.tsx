'use client'

import { motion } from 'framer-motion'
import { Plus, Search, FileText, Settings, Database } from 'lucide-react'

export default function Home() {
  return (
    <div className="space-y-section-margin">
      {/* Header Section */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-display-lg text-ink">ExamModel Hub</h1>
          <p className="text-body-lg text-slate-500 mt-2">Editorial Scholarship Design System Active</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-white text-ink px-6 py-3 rounded-md shadow-sm font-semibold hover:shadow-md transition-all">
            <Search size={18} />
            Search
          </button>
          <button className="flex items-center gap-2 bg-ink text-white px-6 py-3 rounded-md shadow-lg font-semibold hover:opacity-90 transition-all">
            <Plus size={18} />
            New Assessment
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-card-gap">
        {/* Sidebar / Stats */}
        <aside className="col-span-3 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium space-y-4"
          >
            <h3 className="text-label-sm uppercase tracking-wider text-slate-400">System Status</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-semibold text-ink">Concurrency Ready</span>
            </div>
            <p className="text-body-md text-slate-500">Optimized for 1,000+ concurrent sessions.</p>
          </motion.div>

          <nav className="space-y-2">
            {[
              { icon: FileText, label: 'Question Bank', active: true },
              { icon: Database, label: 'Assessments', active: false },
              { icon: Settings, label: 'Settings', active: false },
            ].map((item, i) => (
              <button 
                key={i}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                  item.active ? 'bg-slate-200 text-ink font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="col-span-9 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-premium min-h-[400px] flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <FileText size={40} />
            </div>
            <div className="max-w-md">
              <h2 className="text-headline-md text-ink">No Assessments Selected</h2>
              <p className="text-body-md text-slate-500 mt-2">
                Select an assessment from the bank or create a new one using the "New Assessment" button above.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
