'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Clock, Bell, AlertTriangle, Whatsapp } from 'lucide-react'
import { toast } from 'sonner'

const days = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
]

export default function SettingsPage() {
  const supabase = createClient()
  const [clinic, setClinic] = useState<{ id: string; clinic_name: string; phone: string } | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState({ clinic_name: '', phone: '', working_hours_start: '09:00', working_hours_end: '18:00', working_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], whatsapp_enabled: false, whatsapp_number: '', reminder_before_minutes: 60, webhook_url: '' })

  useEffect(() => {
    const load = async () => {
      const [cRes, sRes] = await Promise.all([
        supabase.from('clinics').select('id, clinic_name, phone').single(),
        supabase.from('clinic_settings').select('*').single(),
      ])
      if (cRes.data) {
        setClinic(cRes.data)
        setF({ clinic_name: cRes.data.clinic_name, phone: cRes.data.phone || '', working_hours_start: '09:00', working_hours_end: '18:00', working_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], whatsapp_enabled: false, whatsapp_number: '', reminder_before_minutes: 60, webhook_url: '' })
      }
      if (sRes.data) {
        setSettings(sRes.data)
        setF({ clinic_name: f.clinic_name, phone: f.phone, working_hours_start: sRes.data.working_hours_start || '09:00', working_hours_end: sRes.data.working_hours_end || '18:00', working_days: sRes.data.working_days || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], whatsapp_enabled: sRes.data.whatsapp_enabled || false, whatsapp_number: sRes.data.whatsapp_number || '', reminder_before_minutes: sRes.data.reminder_before_minutes || 60, webhook_url: sRes.data.webhook_url || '' })
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.from('clinics').update({ clinic_name: f.clinic_name, phone: f.phone || null }).eq('id', clinic?.id)
      toast.success('Clinic profile saved')
    } catch (e: any) { toast.error(e.message || 'Failed') }
    setSaving(false)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        working_hours_start: f.working_hours_start,
        working_hours_end: f.working_hours_end,
        working_days: f.working_days,
        whatsapp_enabled: f.whatsapp_enabled,
        whatsapp_number: f.whatsapp_number || null,
        reminder_before_minutes: f.reminder_before_minutes,
        webhook_url: f.webhook_url || null,
      }
      await supabase.from('clinic_settings').update(payload).eq('clinic_id', clinic?.id)
      toast.success('Settings saved')
    } catch (e: any) { toast.error(e.message || 'Failed') }
    setSaving(false)
  }

  const toggleDay = (day: string) => {
    setF({ ...f, working_days: f.working_days.includes(day) ? f.working_days.filter(d => d !== day) : [...f.working_days, day] })
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><Settings className="h-5 w-5 text-slate-500" /><h2 className="text-lg font-medium text-slate-900">Clinic Profile</h2></div>
          <form onSubmit={saveClinic} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Clinic name</label><input value={f.clinic_name} onChange={e => setF({...f, clinic_name: e.target.value})} className="input" placeholder="Your clinic name" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone</label><input value={f.phone} onChange={e => setF({...f, phone: e.target.value})} className="input" placeholder="+91 98765 43210" /></div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save changes'}</button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><Clock className="h-5 w-5 text-slate-500" /><h2 className="text-lg font-medium text-slate-900">Working Hours</h2></div>
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Start time</label><input type="time" value={f.working_hours_start} onChange={e => setF({...f, working_hours_start: e.target.value})} className="input" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">End time</label><input type="time" value={f.working_hours_end} onChange={e => setF({...f, working_hours_end: e.target.value})} className="input" /></div>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2">Working days</label><div className="flex flex-wrap gap-2">{days.map(d => (<button key={d.value} type="button" onClick={() => toggleDay(d.value)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${f.working_days.includes(d.value) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{d.label}</button>))}</div></div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save working hours'}</button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4"><Bell className="h-5 w-5 text-slate-500" /><h2 className="text-lg font-medium text-slate-900">WhatsApp Reminders</h2></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-sm text-slate-700">Enable automated WhatsApp appointment reminders</p><p className="text-xs text-slate-500 mt-1">Requires webhook connection via Make.com</p></div><button type="button" onClick={() => setF({...f, whatsapp_enabled: !f.whatsapp_enabled})} className={`w-12 h-6 rounded-full transition-colors ${f.whatsapp_enabled ? 'bg-blue-600' : 'bg-slate-300'} relative`}><span className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${f.whatsapp_enabled ? 'translate-x-6' : ''}`} /></span></button></div>
            {f.whatsapp_enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Clinic WhatsApp number</label><input value={f.whatsapp_number} onChange={e => setF({...f, whatsapp_number: e.target.value})} className="input" placeholder="+91 98765 43210" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Send reminder (minutes before)</label><select value={f.reminder_before_minutes} onChange={e => setF({...f, reminder_before_minutes: Number(e.target.value)})} className="input"><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2 hours</option><option value={1440}>1 day</option></select></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Make.com Webhook URL</label><input value={f.webhook_url} onChange={e => setF({...f, webhook_url: e.target.value})} className="input" placeholder="https://hook.make.com/..." /><p className="text-xs text-slate-500 mt-1">Create a webhook scenario in Make.com that sends WhatsApp messages</p></div>
              </div>
            )}
            <button type="button" onClick={saveSettings} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save reminder settings'}</button>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-yellow-600" /><div><p className="text-sm font-medium text-slate-900">About WhatsApp Reminders</p><p className="text-sm text-slate-600 mt-1">Reminders are queued automatically when an appointment is created. A webhook trigger needs to be set up in Make.com (or similar) to fetch pending reminders and send WhatsApp messages. The webhook URL above should point to a Make.com scenario that: 1) fetches pending reminders, 2) sends WhatsApp via Twilio/Meta, 3) updates reminder status to 'sent'.</p></div></div>
        </div>
      </div>
    </div>
  )
}
