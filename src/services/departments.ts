export type DepartmentStatus = 'Activ' | 'Program limitat' | 'În amenajare'

export type Department = {
  id: string
  name: string
  description: string
  location: string
  schedule: string
  doctorCount: number
  appointmentCount: number
  status: DepartmentStatus
  doctors: string[]
}

export type DepartmentInput = Omit<Department, 'id'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isDepartmentStatus(value: unknown): value is DepartmentStatus {
  return value === 'Activ' || value === 'Program limitat' || value === 'În amenajare'
}

function isDepartment(value: unknown): value is Department {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.location === 'string'
    && typeof value.schedule === 'string'
    && typeof value.doctorCount === 'number'
    && typeof value.appointmentCount === 'number'
    && isDepartmentStatus(value.status)
    && Array.isArray(value.doctors)
    && value.doctors.every((doctor) => typeof doctor === 'string')
}

async function readResponse(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(response.ok
      ? 'Răspunsul serviciului pentru departamente nu este valid.'
      : 'Solicitarea către serviciul pentru departamente nu a putut fi procesată.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea pentru gestionarea departamentelor nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

function parseDepartmentResponse(payload: unknown): Department {
  if (!isRecord(payload) || !isDepartment(payload.department)) {
    throw new Error('Răspunsul serviciului pentru departamente nu are formatul așteptat.')
  }
  return payload.department
}

export async function getDepartments(): Promise<Department[]> {
  const response = await fetch('/api/departments', { credentials: 'same-origin' })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !Array.isArray(payload.departments) || !payload.departments.every(isDepartment)) {
    throw new Error('Lista departamentelor primită de la server nu are formatul așteptat.')
  }
  return payload.departments
}

export async function createDepartment(department: DepartmentInput): Promise<Department> {
  const response = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(department),
  })
  return parseDepartmentResponse(await readResponse(response))
}

export async function updateDepartment(id: string, department: DepartmentInput): Promise<Department> {
  const response = await fetch(`/api/departments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(department),
  })
  return parseDepartmentResponse(await readResponse(response))
}

export async function deleteDepartment(id: string): Promise<void> {
  const response = await fetch(`/api/departments/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (response.ok) return

  await readResponse(response)
}
