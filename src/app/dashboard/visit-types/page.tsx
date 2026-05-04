'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function VisitTypesPage() {
  const supabase = createClient()
  const [visitTypes, setVisitTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ name: '', default_duration_minutes: 30 })
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await supabase.from('visit_types').select('*').order('name')
    setVisitTypes(res.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { name: f.name, default_duration_minutes: f.default_duration_minutes }
      if (editing) await supabase.from('visit_types').update(payload).eq('id', editing)
      else await supabase.from('visit_types').insert(payload)
      toast.success(editing ? 'Updated' : 'Created')
      setShowForm(false); setEditing(null); setF({ name: '', default_duration_minutes: 30 }); load()
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this visit type?')) return
    try { await supabase.from('visit_types').delete().eq('id', id); toast.success('Deleted'); setVisitTypes(visitTypes.filter(x => x.id !== id)) } catch { toast.error('Failed') }
  }

  const edit = (vt: any) => { setF({ name: vt.name, default_duration_minutes: vt.default_duration_minutes }); setEditing(vt.id); setShowForm(true) }
  const filt = visitTypes.filter(vt => !search || vt.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Visit Types</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setF({ name: '', default_duration_minutes: 30 }) }} className="btn-primary"><Plus className="h-4 w-4 mr-2" />New Visit Type</button>
      </div>
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">{editing ? 'Edit' : 'New'} Visit Type</h2>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Name *</label><input value={f.name} onChange={e => setF({...f, name: e.target.value})} required className="input" placeholder="Consultation" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label><select value={f.default_duration_minutes} onChange={e => setF({...f, default_duration_minutes: Number(e.target.value)})} className="input">{Array.from({length:96}).map((_,i)=>i*5+5).filter(m=>m>=5&&m<=480).map(m=><option key={m} value={m}>{m} minutes</option>)}</select></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="card">
        <div className="p-4 border-b border-slate-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..." className="input pl-10" /></div></div>
        {filt.length === 0 ? (<div className="p-12 text-center text-slate-500"><Activity className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p className="font-medium">No visit types found</p></div>) : (
          <table className="w-full"><thead className="bg-slate-50"><tr><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Name</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Duration</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filt.map(vt => (<tr key={vt.id} className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-medium text-slate-900">{vt.name}</td><td className="px-4 py-3"><span className="badge bg-blue-100 text-blue-700">{vt.default_duration_minutes} min</span></td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => edit(vt)} className="text-blue-600 hover:text-blue-700"><Pencil className="h-4 w-4" /></button><button onClick={() => del(vt.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>))}
          </tbody></table>
        )}
      </div>
    </div>
  )
}
