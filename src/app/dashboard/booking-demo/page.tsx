'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getAvailableSlots, TimeSlot } from '@/lib/slots'
import { format } from 'date-fns'
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function BookingDemoPage() {
  const supabase = createClient()
  const [providers, setProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [clinicId, setClinicId] = useState('')

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
      setClinicId(clinic.id)

      // Load providers
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .eq('clinic_id', clinic.id)

      setProviders(providerData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    }
  }

  const fetchAvailableSlots = async () => {
    if (!selectedProvider || !selectedDate || !clinicId) {
      toast.error('Please select both provider and date')
      return
    }

    setLoading(true)
    try {
      const availableSlots = await getAvailableSlots(
        clinicId,
        selectedProvider,
        selectedDate
      )
      
      setSlots(availableSlots)
      
      if (availableSlots.length === 0) {
        toast.info('No available slots found for this date')
      } else {
        toast.success(`Found ${availableSlots.length} available slots`)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to fetch available slots')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Smart Booking Demo</h1>
        <p className="text-gray-600 mt-1">Test the available slots system with conflict detection</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Provider Selection */}
        <div className="bg-white rounded-xl border p-6">
          <label className="block text-sm font-medium mb-2">
            <Calendar className="inline mr-2" size={16} />
            Select Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Choose a provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.specialty ? `- ${p.specialty}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-xl border p-6">
          <label className="block text-sm font-medium mb-2">
            <Clock className="inline mr-2" size={16} />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Check Availability Button */}
      <div className="mb-6">
        <button
          onClick={fetchAvailableSlots}
          disabled={loading || !selectedProvider || !selectedDate}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Loading...' : 'Check Available Slots'}
        </button>
      </div>

      {/* Available Slots Display */}
      {slots.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            <CheckCircle2 className="inline text-green-600 mr-2" size={20} />
            Available Time Slots
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {slots.map((slot, index) => (
              <button
                key={index}
                className="p-3 border-2 border-green-200 bg-green-50 hover:bg-green-100 rounded-lg text-sm font-medium text-green-700 transition"
              >
                {slot.time}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            ✓ These slots respect clinic working hours, existing appointments, and provider availability blocks
          </p>
        </div>
      )}

      {slots.length === 0 && !loading && selectedProvider && selectedDate && (
        <div className="bg-white rounded-xl border p-6">
          <div className="text-center py-8">
            <XCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600">No available slots for this selection</p>
            <p className="text-sm text-gray-500 mt-2">Try selecting a different date or provider</p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Calls the <code className="bg-blue-100 px-1 rounded">get_available_slots()</code> Postgres function</li>
          <li>• Automatically checks for appointment conflicts</li>
          <li>• Respects provider availability blocks (time off)</li>
          <li>• Honors clinic working hours from settings</li>
          <li>• Generates 30-minute time slots</li>
        </ul>
      </div>
    </div>
  )
}
