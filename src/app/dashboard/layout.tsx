import { Link } from 'next/link'
import { User, Calendar, Users, Stethoscope, Activity, Settings, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/providers', label: 'Providers', icon: Stethoscope },
  { href: '/dashboard/visit-types', label: 'Visit Types', icon: Activity },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-screen p-4 flex flex-col">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-semibold text-slate-900">ClinicDesk</h1>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.href === activePath
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          )
        })}
      </nav>
      <form action="/api/sign-out" method="POST">
        <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 w-full">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>
    </aside>
  )
}

export default function DashboardLayout({ children, params }: { children: React.ReactNode, params: Promise<{ clinicSlug?: string }> }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar activePath={typeof window !== 'undefined' ? window.location.pathname : '/dashboard'} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
