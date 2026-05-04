'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  patient_name: string
  appointment_date: string
  appointment_time: string
  status: string
  patients?: { full_name: string }
  providers?: { name: string }
}

export default function CalendarPage() {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAppointments()
  }, [currentDate])

  const loadAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('owner_user_id', user.id)
        .single()

      if (!clinic) return

      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd')

      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(full_name),
          providers(name)
        `)
        .eq('clinic_id', clinic.id)
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd)
        .order('appointment_time')

      setAppointments(data || [])
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  })

  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Calendar View</h1>
          <p className="text-gray-600 mt-1">Visual overview of all appointments</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <Link
          href="/dashboard/appointments"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Appointment
        </Link>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-600 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startOfMonth(currentDate).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r p-2 min-h-[120px] bg-gray-50" />
          ))}

          {/* Days of month */}
          {daysInMonth.map(day => {
            const dayAppointments = getAppointmentsForDay(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r p-2 min-h-[120px] hover:bg-gray-50 ${
                  isCurrentDay ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentDay ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-600'
                }`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(apt => (
                    <Link
                      key={apt.id}
                      href="/dashboard/appointments"
                      className={`block text-xs p-1.5 rounded ${statusColors[apt.status] || statusColors.scheduled} hover:opacity-80 transition`}
                    >
                      <div className="font-medium truncate">
                        {apt.appointment_time} {apt.patient_name || apt.patients?.full_name}
                      </div>
                    </Link>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1.5">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="font-medium">Status:</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 rounded" />
          <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-100 rounded" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-100 rounded" />
          <span>Cancelled</span>
        </div>
      </div>
    </div>
  )
}
