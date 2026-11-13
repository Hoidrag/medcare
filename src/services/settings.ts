import type { AuthUser } from './auth'

export type ClinicDayName =
  | 'Luni'
  | 'Marți'
  | 'Miercuri'
  | 'Joi'
  | 'Vineri'
  | 'Sâmbătă'
  | 'Duminică'

export type ClinicSettings = {
  clinicProfile: {
    name: string
    address: string
    phone: string
    email: string
    logoUrl: string
  }
  workingHours: Array<{
    day: ClinicDayName
    isOpen: boolean
    start: string
    end: string
  }>
  notifications: {
    appointments: boolean
    pharmacy: boolean
    emergencies: boolean
  }
  preferences: {
    theme: 'light' | 'dark'
    language: 'ro'
    dateFormat: 'long' | 'dd.MM.yyyy' | 'dd/MM/yyyy'
  }
}

export type AccountInput = {
  name: string
  email: string
  currentPassword: string
}

export type PasswordInput = {
  currentPassword: string
  newPassword: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isClinicDayName(value: unknown): value is ClinicDayName {
  return value === 'Luni'
    || value === 'Marți'
    || value === 'Miercuri'
    || value === 'Joi'
    || value === 'Vineri'
    || value === 'Sâmbătă'
    || value === 'Duminică'
}

function isClinicSettings(value: unknown): value is ClinicSettings {
  if (!isRecord(value) || !isRecord(value.clinicProfile) || !isRecord(value.notifications)
    || !isRecord(value.preferences) || !Array.isArray(value.workingHours)) {
    return false
  }

  const { clinicProfile, notifications, preferences, workingHours } = value
  return ['name', 'address', 'phone', 'email', 'logoUrl'].every((key) => typeof clinicProfile[key] === 'string')
    && ['appointments', 'pharmacy', 'emergencies'].every((key) => typeof notifications[key] === 'boolean')
    && (preferences.theme === 'light' || preferences.theme === 'dark')
    && preferences.language === 'ro'
    && (preferences.dateFormat === 'long'
      || preferences.dateFormat === 'dd.MM.yyyy'
      || preferences.dateFormat === 'dd/MM/yyyy')
    && workingHours.length === 7
    && workingHours.every((entry) => isRecord(entry)
      && isClinicDayName(entry.day)
      && typeof entry.isOpen === 'boolean'
      && typeof entry.start === 'string'
      && typeof entry.end === 'string')
}

async function readResponse(response: Response): Promise<unknown> {
  let payload: unknown
  try {
    payload = response.status === 204 ? null : await response.json()
  } catch {
    throw new Error('Răspunsul serviciului de setări nu este valid.')
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : 'Solicitarea pentru setări nu a putut fi procesată.'
    throw new Error(message)
  }

  return payload
}

export async function getSettings(): Promise<ClinicSettings> {
  const response = await fetch('/api/auth/settings', { credentials: 'same-origin' })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !isClinicSettings(payload.settings)) {
    throw new Error('Setările primite de la server nu au formatul așteptat.')
  }
  return payload.settings
}

export async function saveSettings(settings: ClinicSettings): Promise<ClinicSettings> {
  const response = await fetch('/api/auth/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(settings),
  })
  const payload = await readResponse(response)
  if (!isRecord(payload) || !isClinicSettings(payload.settings)) {
    throw new Error('Setările salvate nu au formatul așteptat.')
  }
  return payload.settings
}

export async function updateAccount(account: AccountInput): Promise<AuthUser> {
  const response = await fetch('/api/auth/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(account),
  })
  const payload = await readResponse(response)
  if (
    !isRecord(payload)
    || !isRecord(payload.user)
    || typeof payload.user.id !== 'string'
    || typeof payload.user.name !== 'string'
    || typeof payload.user.email !== 'string'
  ) {
    throw new Error('Datele contului primite de la server nu au formatul așteptat.')
  }
  return {
    id: payload.user.id,
    name: payload.user.name,
    email: payload.user.email,
  }
}

export async function changePassword(password: PasswordInput): Promise<void> {
  const response = await fetch('/api/auth/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(password),
  })
  const payload = await readResponse(response)
  if (!isRecord(payload) || typeof payload.message !== 'string') {
    throw new Error('Confirmarea schimbării parolei nu are formatul așteptat.')
  }
}
