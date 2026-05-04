'use client'
import Link from 'next/link'
import { Calendar, Users, Stethoscope, Activity, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Activity },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/providers', label: 'Providers', icon: Stethoscope },
  { href: '/dashboard/visit-types', label: 'Visit Types', icon: Activity },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()
  const handleSignout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return <button onClick={handleSignout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 w-full"><LogOut className="h-4 w-4" /><span>Sign out</span></button>
}

function Sidebar() {
  if (typeof window === 'undefined') return null
  const pathname = window.location.pathname
  return (
    <aside className="w-60 bg-white border-r border-slate-200 min-h-screen p-4 flex flex-col">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-semibold text-slate-900">ClinicDesk</h1>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = item.href === pathname
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          )
        })}
      </nav>
      <SignOutButton />
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
