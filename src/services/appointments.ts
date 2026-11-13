export type AppointmentStatus = 'Confirmată' | 'În așteptare' | 'Anulată'
export type AppointmentType = 'Consultație' | 'Control' | 'Investigație'

export type Appointment = {
  id: string
  patientId: string
  patient: string
  age: number
  doctorId: string
  doctor: string
  specialty: string
  date: string
  time: string
  type: AppointmentType
  status: AppointmentStatus
}

export type AppointmentInput = Pick<
  Appointment,
  'patientId' | 'doctorId' | 'date' | 'time' | 'type' | 'status'
>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return value === 'Confirmată' || value === 'În așteptare' || value === 'Anulată'
}

function isAppointmentType(value: unknown): value is AppointmentType {
  return value === 'Consultație' || value === 'Control' || value === 'Investigație'
}

function isAppointment(value: unknown): value is Appointment {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.patientId === 'string'
    && typeof value.patient === 'string'
    && typeof value.age === 'number'
    && typeof value.doctorId === 'string'
    && typeof value.doctor === 'string'
    && typeof value.specialty === 'string'
    && typeof value.date === 'string'
    && typeof value.time === 'string'
    && isAppointmentType(value.type)
    && isAppointmentStatus(value.status)
}

async function readResponse(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(response.ok
      ? 'Răspunsul serviciului pentru programări nu este valid.'
      : 'Solicitarea către serviciul pentru programări nu a putut fi procesată.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea pentru gestionarea programărilor nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

function parseAppointmentResponse(payload: unknown): Appointment {
  if (!isRecord(payload) || !isAppointment(payload.appointment)) {
    throw new Error('Răspunsul serviciului pentru programări nu are formatul așteptat.')
  }
  return payload.appointment
}

export async function getAppointments(): Promise<Appointment[]> {
  const response = await fetch('/api/appointments', { credentials: 'same-origin' })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !Array.isArray(payload.appointments) || !payload.appointments.every(isAppointment)) {
    throw new Error('Lista programărilor primită de la server nu are formatul așteptat.')
  }
  return payload.appointments
}

export async function createAppointment(appointment: AppointmentInput): Promise<Appointment> {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(appointment),
  })
  return parseAppointmentResponse(await readResponse(response))
}

export async function updateAppointment(id: string, appointment: AppointmentInput): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(appointment),
  })
  return parseAppointmentResponse(await readResponse(response))
}

export async function deleteAppointment(id: string): Promise<void> {
  const response = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (response.ok) return

  await readResponse(response)
}
