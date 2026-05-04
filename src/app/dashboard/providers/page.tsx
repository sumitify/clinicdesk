'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Stethoscope, Pencil, Trash2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function ProvidersPage() {
  const supabase = createClient()
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [f, setF] = useState({ full_name: '', specialty: '' })
  const [editing, setEditing] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await supabase.from('providers').select('*').order('full_name')
    setProviders(res.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { full_name: f.full_name, specialty: f.specialty || null }
      if (editing) await supabase.from('providers').update(payload).eq('id', editing)
      else await supabase.from('providers').insert(payload)
      toast.success(editing ? 'Updated' : 'Created')
      setShowForm(false); setEditing(null); setF({ full_name: '', specialty: '' }); load()
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this provider?')) return
    try { await supabase.from('providers').delete().eq('id', id); toast.success('Deleted'); setProviders(providers.filter(x => x.id !== id)) } catch { toast.error('Failed') }
  }

  const edit = (p: any) => { setF({ full_name: p.full_name, specialty: p.specialty || '' }); setEditing(p.id); setShowForm(true) }
  const filt = providers.filter(p => !search || p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.specialty && p.specialty.toLowerCase().includes(search.toLowerCase())))

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Providers</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setF({ full_name: '', specialty: '' }) }} className="btn-primary"><Plus className="h-4 w-4 mr-2" />New Provider</button>
      </div>
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">{editing ? 'Edit' : 'New'} Provider</h2>
          <form onSubmit={submit} className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Full name *</label><input value={f.full_name} onChange={e => setF({...f, full_name: e.target.value})} required className="input" placeholder="Dr. Jane Smith" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label><input value={f.specialty} onChange={e => setF({...f, specialty: e.target.value})} className="input" placeholder="Cardiologist" /></div>
            <div className="flex gap-3"><button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="card">
        <div className="p-4 border-b border-slate-200"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialty..." className="input pl-10" /></div></div>
        {filt.length === 0 ? (<div className="p-12 text-center text-slate-500"><Stethoscope className="h-12 w-12 mx-auto mb-3 text-slate-300" /><p className="font-medium">No providers found</p></div>) : (
          <table className="w-full"><thead className="bg-slate-50"><tr><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Name</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Specialty</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th></tr></thead>
          <tbody>
            {filt.map(p => (<tr key={p.id} className="border-t border-slate-100"><td className="px-4 py-3 text-sm font-medium text-slate-900">{p.full_name}</td><td className="px-4 py-3 text-sm text-slate-600">{p.specialty || '-'}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => edit(p)} className="text-blue-600 hover:text-blue-700"><Pencil className="h-4 w-4" /></button><button onClick={() => del(p.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>))}
          </tbody></table>
        )}
      </div>
    </div>
  )
}
