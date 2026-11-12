export type DoctorStatus = 'Disponibil' | 'În consultație' | 'Indisponibil'

export type Doctor = {
  id: string
  name: string
  specialty: string
  department: string
  experience: number
  schedule: string
  status: DoctorStatus
  appointments: number
}

export type DoctorInput = Omit<Doctor, 'id' | 'appointments'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDoctorStatus(value: unknown): value is DoctorStatus {
  return value === 'Disponibil' || value === 'În consultație' || value === 'Indisponibil'
}

function isDoctor(value: unknown): value is Doctor {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.specialty === 'string'
    && typeof value.department === 'string'
    && typeof value.experience === 'number'
    && typeof value.schedule === 'string'
    && isDoctorStatus(value.status)
    && typeof value.appointments === 'number'
}

async function readResponse(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(response.ok
      ? 'Răspunsul serviciului pentru medici nu este valid.'
      : 'Solicitarea către serviciul pentru medici nu a putut fi procesată.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea pentru gestionarea medicilor nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

function parseDoctorResponse(payload: unknown): Doctor {
  if (!isRecord(payload) || !isDoctor(payload.doctor)) {
    throw new Error('Răspunsul serviciului pentru medici nu are formatul așteptat.')
  }
  return payload.doctor
}

export async function getDoctors(): Promise<Doctor[]> {
  const response = await fetch('/api/doctors', { credentials: 'same-origin' })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !Array.isArray(payload.doctors) || !payload.doctors.every(isDoctor)) {
    throw new Error('Lista medicilor primită de la server nu are formatul așteptat.')
  }
  return payload.doctors
}

export async function createDoctor(doctor: DoctorInput): Promise<Doctor> {
  const response = await fetch('/api/doctors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(doctor),
  })
  return parseDoctorResponse(await readResponse(response))
}

export async function updateDoctor(id: string, doctor: DoctorInput): Promise<Doctor> {
  const response = await fetch(`/api/doctors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(doctor),
  })
  return parseDoctorResponse(await readResponse(response))
}

export async function deleteDoctor(id: string): Promise<void> {
  const response = await fetch(`/api/doctors/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (response.ok) return

  await readResponse(response)
}
