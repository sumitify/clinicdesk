'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Clock, Bell, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const supabase = createClient()
  const [clinic, setClinic] = useState<{ clinic_name: string; phone: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({ clinic_name: '', phone: '' })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('clinics').select('clinic_name, phone').single()
      if (data) {
        setClinic(data)
        setF({ clinic_name: data.clinic_name, phone: data.phone || '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.from('clinics').update({ clinic_name: f.clinic_name, phone: f.phone || null }).eq('id', clinic?.id)
      toast.success('Settings saved')
    } catch (e: any) { toast.error(e.message || 'Failed') }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-medium text-slate-900">Clinic Profile</h2>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Clinic name</label><input value={f.clinic_name} onChange={e => setF({...f, clinic_name: e.target.value})} className="input" placeholder="Your clinic name" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className="input" placeholder="+91 98765 43210" /></div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-medium text-slate-900">Working Hours</h2>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Coming soon</p>
              <p className="text-sm text-slate-500">Configure your clinic's working hours to prevent appointments outside business hours.</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-medium text-slate-900">Reminders</h2>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Coming soon</p>
              <p className="text-sm text-slate-500">Set up automated WhatsApp and SMS reminders for upcoming appointments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
