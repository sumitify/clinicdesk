'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Trash2, Plus, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { DayPicker } from 'react-day-picker'

interface AvailabilityBlock {
  id: string
  provider_id: string
  start_time: string
  end_time: string
  reason: string
  created_at: string
  provider_name?: string
}

export default function ProviderAvailabilityPage() {
  const supabase = createClient()
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    provider_id: '',
    start_date: new Date(),
    start_time: '09:00',
    end_time: '17:00',
    reason: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's clinic
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (!clinic) return

      // Load providers
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('clinic_id', clinic.id)

      setProviders(providerData || [])

      // Load availability blocks
      const { data: blockData } = await supabase
        .from('provider_availability_blocks')
        .select(`
          *,
          providers(name)
        `)
        .eq('clinic_id', clinic.id)
        .order('start_time', { ascending: true })

      setBlocks(blockData?.map((b: any) => ({
        ...b,
        provider_name: b.providers?.name
      })) || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load availability data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (!clinic) return

      // Combine date and time
      const startDateTime = new Date(formData.start_date)
      const [startHour, startMin] = formData.start_time.split(':')
      startDateTime.setHours(parseInt(startHour), parseInt(startMin))

      const endDateTime = new Date(formData.start_date)
      const [endHour, endMin] = formData.end_time.split(':')
      endDateTime.setHours(parseInt(endHour), parseInt(endMin))

      const { error } = await supabase
        .from('provider_availability_blocks')
        .insert({
          clinic_id: clinic.id,
          provider_id: formData.provider_id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          reason: formData.reason
        })

      if (error) throw error

      toast.success('Availability block added successfully')
      setShowForm(false)
      setFormData({
        provider_id: '',
        start_date: new Date(),
        start_time: '09:00',
        end_time: '17:00',
        reason: ''
      })
      loadData()
    } catch (error) {
      console.error('Error adding block:', error)
      toast.error('Failed to add availability block')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this availability block?')) return

    try {
      const { error } = await supabase
        .from('provider_availability_blocks')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Availability block deleted')
      loadData()
    } catch (error) {
      console.error('Error deleting block:', error)
      toast.error('Failed to delete availability block')
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Provider Availability</h1>
          <p className="text-gray-600 mt-1">Block time off for providers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Block
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">New Availability Block</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Provider</label>
              <select
                value={formData.provider_id}
                onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Select provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={format(formData.start_date, 'yyyy-MM-dd')}
                onChange={(e) => setFormData({ ...formData, start_date: new Date(e.target.value) })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Vacation, Conference, Personal Time"
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Block
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Blocked Time Slots</h2>
        </div>
        <div className="divide-y">
          {blocks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No availability blocks. Add one to block time off for providers.
            </div>
          ) : (
            blocks.map((block) => (
              <div key={block.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{block.provider_name}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {format(new Date(block.start_time), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {format(new Date(block.start_time), 'h:mm a')} - {format(new Date(block.end_time), 'h:mm a')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Reason: {block.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(block.id)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
