import { createClient } from './supabase/client'

export interface TimeSlot {
  time: string
  available: boolean
}

/**
 * Fetch available appointment slots for a given provider and date
 * Uses the get_available_slots() Postgres function
 */
export async function getAvailableSlots(
  clinicId: string,
  providerId: string,
  date: string
): Promise<TimeSlot[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_clinic_id: clinicId,
      p_provider_id: providerId,
      p_date: date
    })

    if (error) {
      console.error('Error fetching available slots:', error)
      return []
    }

    // Transform the response into TimeSlot objects
    return (data || []).map((slot: any) => ({
      time: slot.slot_time,
      available: true
    }))
  } catch (error) {
    console.error('Error calling get_available_slots:', error)
    return []
  }
}

/**
 * Check if a specific time slot has conflicts
 * Uses the check_appointment_conflict() Postgres function
 */
export async function checkSlotConflict(
  clinicId: string,
  providerId: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('check_appointment_conflict', {
      p_clinic_id: clinicId,
      p_provider_id: providerId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_appointment_id: excludeAppointmentId || null
    })

    if (error) {
      console.error('Error checking conflict:', error)
      return true // Assume conflict on error for safety
    }

    return data === true
  } catch (error) {
    console.error('Error calling check_appointment_conflict:', error)
    return true
  }
}
