'use client'
import { useEffect, useState } from 'react'
import { Calendar, Users, ClipboardCheck, Stethoscope } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { DateRange, DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

const statusColors: Record<string, string> = {
  scheduled: 'badge-scheduled', confirmed: 'badge-confirmed', completed: 'badge-completed', cancelled: 'badge-cancelled', no_show: 'badge-no_show'
}

export default function DashboardPage() {
  const supabase = createClient()
  const [totalAppts, setTotalAppts] = useState(0)
  const [todayAppts, setTodayAppts] = useState(0)
  const [totalPatients, setTotalPatients] = useState(0)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const today = format(new Date(), 'yyyy-MM-dd')
      const [countRes, todayCountRes, patientsRes, upcomingRes] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('patients').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*, visit_types(name, default_duration_minutes)').gte('appointment_date', today).order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true }).limit(7)
      ])
      setTotalAppts(countRes.count || 0)
      setTodayAppts(todayCountRes.count || 0)
      setTotalPatients(patientsRes.count || 0)
      setUpcoming(upcomingRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg"><Calendar className="h-6 w-6 text-blue-600" /></div>
          <div><p className="text-sm text-slate-500">Total Appointments</p><p className="text-2xl font-semibold text-slate-900">{totalAppts}</p></div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg"><ClipboardCheck className="h-6 w-6 text-green-600" /></div>
          <div><p className="text-sm text-slate-500">Today's Appointments</p><p className="text-2xl font-semibold text-slate-900">{todayAppts}</p></div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div>
          <div><p className="text-sm text-slate-500">Total Patients</p><p className="text-2xl font-semibold text-slate-900">{totalPatients}</p></div>
        </div>
      </div>
      <div className="card">
        <div className="p-4 border-b border-slate-200"><h2 className="text-lg font-medium text-slate-900">Upcoming Appointments</h2></div>
        {upcoming.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No upcoming appointments</p>
            <p className="text-sm mt-1">Schedule your first appointment to get started</p>
            <a href="/dashboard/appointments" className="inline-block mt-4 btn-primary">+ New Appointment</a>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50"><tr><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Date</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Time</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Patient</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Type</th><th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th></tr></thead>
            <tbody>
              {upcoming.map(appt => (
                <tr key={appt.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-900">{format(new Date(appt.appointment_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{appt.appointment_time}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{appt.patient_name}</td>
                  <td className="px-4 py-3"><span className="text-sm text-slate-600">{appt.visit_types?.name || '-'}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${statusColors[appt.status]}`}>{appt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
