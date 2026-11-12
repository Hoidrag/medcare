export type PatientStatus = 'Activ' | 'Monitorizare' | 'Externat'

export type Patient = {
  id: string
  name: string
  age: number
  phone: string
  email: string
  lastVisit: string
  status: PatientStatus
}

export type PatientInput = Omit<Patient, 'id'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPatientStatus(value: unknown): value is PatientStatus {
  return value === 'Activ' || value === 'Monitorizare' || value === 'Externat'
}

function isPatient(value: unknown): value is Patient {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.age === 'number'
    && typeof value.phone === 'string'
    && typeof value.email === 'string'
    && typeof value.lastVisit === 'string'
    && isPatientStatus(value.status)
}

async function readResponse(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(response.ok
      ? 'Răspunsul serviciului pentru pacienți nu este valid.'
      : 'Solicitarea către serviciul pentru pacienți nu a putut fi procesată.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea pentru gestionarea pacienților nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

function parsePatientResponse(payload: unknown): Patient {
  if (!isRecord(payload) || !isPatient(payload.patient)) {
    throw new Error('Răspunsul serviciului pentru pacienți nu are formatul așteptat.')
  }
  return payload.patient
}

export async function getPatients(): Promise<Patient[]> {
  const response = await fetch('/api/patients', { credentials: 'same-origin' })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !Array.isArray(payload.patients) || !payload.patients.every(isPatient)) {
    throw new Error('Lista pacienților primită de la server nu are formatul așteptat.')
  }
  return payload.patients
}

export async function createPatient(patient: PatientInput): Promise<Patient> {
  const response = await fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(patient),
  })
  return parsePatientResponse(await readResponse(response))
}

export async function updatePatient(id: string, patient: PatientInput): Promise<Patient> {
  const response = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(patient),
  })
  return parsePatientResponse(await readResponse(response))
}

export async function deletePatient(id: string): Promise<void> {
  const response = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (response.ok) return

  await readResponse(response)
}
