'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Pencil, Trash2, Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

const statusColors: Record<string, string> = { scheduled: 'badge-scheduled', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled', no_show: 'badge-no_show' }
const statuses = ['scheduled','confirmed','completed','cancelled','no_show']
const statusLabels = ['Scheduled','Confirmed','Completed','Cancelled','No Show']

export default function AppointmentsPage() {
  const supabase = createClient()
  const [appts, setAppts] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [visitTypes, setVisitTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [f, setF] = useState<any>({ patient_id: '', patient_name: '', patient_phone: '', provider_id: '', visit_type_id: '', appointment_date: '', appointment_time: '', notes: '', status: 'scheduled' })

  useEffect(() => {
    const load = async () => {
      const [a, p, pr, vt] = await Promise.all([ supabase.from('appointments').select('*, patients(full_name), providers(full_name, specialty), visit_types(name, default_duration_minutes)').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }), supabase.from('patients').select('*'), supabase.from('providers').select('*'), supabase.from('visit_types').select('*') ])
      setAppts(a.data || []); setPatients(p.data || []); setProviders(pr.data || []); setVisitTypes(vt.data || []); setLoading(false)
    }
    load()
  }, [])

  const onPatientChange = (id: string) => {
    const p = patients.find(x => x.id === id)
    setF({ ...f, patient_id: id, patient_name: p ? p.full_name : '', patient_phone: p ? p.phone : '' })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { patient_id: f.patient_id || null, provider_id: f.provider_id || null, visit_type_id: f.visit_type_id || null, patient_name: f.patient_name, patient_phone: f.patient_phone, appointment_date: f.appointment_date, appointment_time: f.appointment_time, notes: f.notes || null, status: f.status }
      if (editing) await supabase.from('appointments').update(payload).eq('id', editing)
      else await supabase.from('appointments').insert(payload)
      toast.success(editing ? 'Updated' : 'Created')
      setShowForm(false); setEditing(null)
      const res = await supabase.from('appointments').select('*, patients(full_name), providers(full_name, specialty), visit_types(name, default_duration_minutes)').order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })
      setAppts(res.data || [])
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this appointment?')) return
    try { await supabase.from('appointments').delete().eq('id', id); toast.success('Deleted'); setAppts(appts.filter(x => x.id !== id)) } catch { toast.error('Failed') }
  }

  const edit = (appt: any) => {
    setF({ patient_id: appt.patient_id||'', patient_name: appt.patient_name, patient_phone: appt.patient_phone||'', provider_id: appt.provider_id||'', visit_type_id: appt.visit_type_id||'', appointment_date: String(appt.appointment_date), appointment_time: String(appt.appointment_time), notes: appt.notes||'', status: appt.status })
    setEditing(appt.id); setShowForm(true)
  }

  const filt = appts.filter(a => (!search || a.patient_name.toLowerCase().includes(search.toLowerCase())) && (!statusFilter || a.status === statusFilter))

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Appointments</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setF({ patient_id: '', patient_name: '', patient_phone: '', provider_id: '', visit_type_id: '', appointment_date: '', appointment_time: '', notes: '', status: 'scheduled' }) }} className="btn-primary"><Plus className="h-4 w-4 mr-2" />New Appointment</button>
      </div>
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">{editing ? 'Edit' : 'New'} Appointment</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                <select value={f.patient_id} onChange={e => onPatientChange(e.target.value)} required className="input"><option value="">Select</option>{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name *</label>
                <input value={f.patient_name} onChange={e => setF({...f, patient_name: e.target.value})} required className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Phone</label>
                <input value={f.patient_phone} onChange={e => setF({...f, patient_phone: e.target.value})} className="input" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <select value={f.provider_id} onChange={e => setF({...f, provider_id: e.target.value})} className="input"><option value="">Unassigned</option>{providers.map(p => <option key={p.id} value={p.id}>{p.full_name} {p.specialty ? `(${p.specialty})` : ''}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visit Type</label>
                <select value={f.visit_type_id} onChange={e => setF({...f, visit_type_id: e.target.value})} className="input"><option value="">-</option>{visitTypes.map(v => <option key={v.id} value={v.id}>{v.name} ({v.default_duration_minutes} min)</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select value={f.status} onChange={e => setF({...f, status: e.target.value})} className="input">{statuses.map((s, i) => <option key={s} value={s}>{statusLabels[i]}</option>)}</select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <DayPicker mode="single" selected={f.appointment_date ? new Date(f.appointment_date) : undefined} onSelect={d => setF({...f, appointment_date: d ? format(d, 'yyyy-MM-dd') : ''})} classNames={{ caption: 'font-medium', nav_button: 'h-6 w-6 text-slate-500', today: 'bg-blue-50 font-semibold', day: 'h-9 w-9' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <select value={f.appointment_time} onChange={e => setF({...f, appointment_time: e.target.value})} required className="input"><option value="">Select time</option>{Array.from({length:48}).map((_, i) => { const h = Math.floor(i/4)+8, m = (i%4)*15; return <option key={i} value={`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}>{`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}</option> })}</select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={f.notes} onChange={e => setF({...f, notes: e.target.value})} rows={2} className="input" placeholder="Add notes..." />
            </div>
            <div className="flex gap-3"><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="card">
        <div className="p-4 border-b border-slate-200 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name..." className="input pl-10" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">All Statuses</option>
            {statuses.map((s, i) => <option key={s} value={s}>{statusLabels[i]}</option>)}
          </select>
        </div>
        {filt.length === 0 ? (
          <div className="p-12 text-center text-slate-500"><Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p className="font-medium">No appointments found</p></div>
        ) : (
          <table className="w-full"><thead className="bg-slate-50"><tr><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Date</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Time</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Patient</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Provider</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Type</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filt.map(a => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-sm text-slate-900">{a.appointment_date}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.appointment_time}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{a.patient_name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.providers?.full_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{a.visit_types?.name || '-'}</td>
                <td className="px-4 py-3"><span className={`badge ${statusColors[a.status]}`}>{a.status}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => edit(a)} className="text-blue-600 hover:text-blue-700"><Pencil className="h-4 w-4" /></button><button onClick={() => del(a.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>
            ))}
          </tbody></table>
        )}
      </div>
    </div>
  )
}
