export type AdminActivityAction = 'create' | 'update' | 'delete'
export type AdminActivityEntity = 'patient' | 'doctor' | 'appointment' | 'department'

export type AdminActivity = {
  id: string
  action: AdminActivityAction
  entity: AdminActivityEntity
  entityId: string
  createdAt: string
}

export type IntegrityIssue = {
  id: string
  severity: 'critical' | 'warning' | 'ok'
  title: string
  description: string
  count: number
}

export type IntegrityReport = {
  checkedAt: string
  totals: {
    patients: number
    doctors: number
    appointments: number
    departments: number
  }
  issues: IntegrityIssue[]
}

export type SystemStatus = {
  status: 'ok' | 'unavailable'
  database: 'connected' | 'disconnected'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isActivityAction(value: unknown): value is AdminActivityAction {
  return value === 'create' || value === 'update' || value === 'delete'
}

function isActivityEntity(value: unknown): value is AdminActivityEntity {
  return value === 'patient'
    || value === 'doctor'
    || value === 'appointment'
    || value === 'department'
}

function isAdminActivity(value: unknown): value is AdminActivity {
  return isRecord(value)
    && typeof value.id === 'string'
    && isActivityAction(value.action)
    && isActivityEntity(value.entity)
    && typeof value.entityId === 'string'
    && typeof value.createdAt === 'string'
}

function isIntegrityIssue(value: unknown): value is IntegrityIssue {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.severity === 'critical' || value.severity === 'warning' || value.severity === 'ok')
    && typeof value.title === 'string'
    && typeof value.description === 'string'
    && typeof value.count === 'number'
}

async function readJson(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('Răspunsul serviciului de administrare nu este valid.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea către serviciul de administrare nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetch('/api/health', { credentials: 'same-origin' })
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('Starea sistemului nu a putut fi citită.')
  }

  if (
    !isRecord(payload)
    || (payload.status !== 'ok' && payload.status !== 'unavailable')
    || (payload.database !== 'connected' && payload.database !== 'disconnected')
  ) {
    throw new Error('Starea sistemului primită de la server nu are formatul așteptat.')
  }

  return { status: payload.status, database: payload.database }
}

export async function getAdminActivity(): Promise<AdminActivity[]> {
  const response = await fetch('/api/admin/activity', { credentials: 'same-origin' })
  const payload = await readJson(response)
  if (!isRecord(payload) || !Array.isArray(payload.events) || !payload.events.every(isAdminActivity)) {
    throw new Error('Jurnalul de activitate primit de la server nu are formatul așteptat.')
  }
  return payload.events
}

export async function getIntegrityReport(): Promise<IntegrityReport> {
  const response = await fetch('/api/admin/integrity', { credentials: 'same-origin' })
  const payload = await readJson(response)
  const totals = isRecord(payload) && isRecord(payload.totals) ? payload.totals : null
  if (
    !isRecord(payload)
    || typeof payload.checkedAt !== 'string'
    || !totals
    || !Array.isArray(payload.issues)
    || !payload.issues.every(isIntegrityIssue)
    || typeof totals.patients !== 'number'
    || typeof totals.doctors !== 'number'
    || typeof totals.appointments !== 'number'
    || typeof totals.departments !== 'number'
  ) {
    throw new Error('Raportul de integritate primit de la server nu are formatul așteptat.')
  }

  return {
    checkedAt: payload.checkedAt,
    totals: {
      patients: totals.patients,
      doctors: totals.doctors,
      appointments: totals.appointments,
      departments: totals.departments,
    },
    issues: payload.issues,
  }
}
