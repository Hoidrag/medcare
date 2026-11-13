import type { Appointment } from '../../services/appointments'
import type { Department } from '../../services/departments'
import type { Doctor } from '../../services/doctors'
import type { Patient } from '../../services/patients'
import { getLocalDateValue } from '../../utils/date'

export type DashboardReportData = {
  appointments: Appointment[]
  departments: Department[]
  doctors: Doctor[]
  patients: Patient[]
}

type DashboardReportOptions = DashboardReportData & {
  generatedAt: Date
  generatedBy: string
}

function getAppointmentStatusCounts(appointments: Appointment[]) {
  return {
    total: appointments.length,
    confirmed: appointments.filter((appointment) => appointment.status === 'Confirmată').length,
    pending: appointments.filter((appointment) => appointment.status === 'În așteptare').length,
    cancelled: appointments.filter((appointment) => appointment.status === 'Anulată').length,
  }
}

function getAppointmentsBySpecialty(appointments: Appointment[]) {
  const counts = appointments.reduce<Record<string, number>>((result, appointment) => {
    result[appointment.specialty] = (result[appointment.specialty] ?? 0) + 1
    return result
  }, {})
  return Object.entries(counts).sort((first, second) => second[1] - first[1])
}

function formatGeneratedAt(date: Date) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function formatCsvValue(value: string | number) {
  const text = String(value)
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function downloadDashboardCsv(options: DashboardReportOptions) {
  const { appointments, departments, doctors, patients, generatedAt, generatedBy } = options
  const todayAppointments = appointments.filter((appointment) =>
    appointment.date === getLocalDateValue(generatedAt),
  )
  const appointmentCounts = getAppointmentStatusCounts(todayAppointments)
  const patientCounts = {
    total: patients.length,
    active: patients.filter((patient) => patient.status === 'Activ').length,
    monitoring: patients.filter((patient) => patient.status === 'Monitorizare').length,
    discharged: patients.filter((patient) => patient.status === 'Externat').length,
  }
  const doctorCounts = {
    total: doctors.length,
    available: doctors.filter((doctor) => doctor.status === 'Disponibil').length,
    consulting: doctors.filter((doctor) => doctor.status === 'În consultație').length,
    unavailable: doctors.filter((doctor) => doctor.status === 'Indisponibil').length,
  }
  const departmentCounts = {
    total: departments.length,
    active: departments.filter((department) => department.status === 'Activ').length,
    limited: departments.filter((department) => department.status === 'Program limitat').length,
    setup: departments.filter((department) => department.status === 'În amenajare').length,
  }
  const rows: (string | number)[][] = [
    ['Raport de activitate MedCare'],
    ['Generat la', formatGeneratedAt(generatedAt)],
    ['Generat de', generatedBy],
    [],
    ['Indicator', 'Valoare'],
    ['Pacienți în evidență', patientCounts.total],
    ['Pacienți activi', patientCounts.active],
    ['Pacienți în monitorizare', patientCounts.monitoring],
    ['Pacienți externați', patientCounts.discharged],
    ['Medici în echipă', doctorCounts.total],
    ['Medici disponibili', doctorCounts.available],
    ['Medici în consultație', doctorCounts.consulting],
    ['Medici indisponibili', doctorCounts.unavailable],
    ['Departamente', departmentCounts.total],
    ['Departamente active', departmentCounts.active],
    ['Departamente cu program limitat', departmentCounts.limited],
    ['Departamente în amenajare', departmentCounts.setup],
    ['Programări astăzi', appointmentCounts.total],
    ['Programări confirmate astăzi', appointmentCounts.confirmed],
    ['Programări în așteptare astăzi', appointmentCounts.pending],
    ['Programări anulate astăzi', appointmentCounts.cancelled],
    [],
    ['Programări de astăzi pe specialitate', 'Număr'],
    ...getAppointmentsBySpecialty(todayAppointments),
    [],
    ['Departament', 'Status', 'Medici', 'Programări'],
    ...departments.map((department) => [
      department.name,
      department.status,
      department.doctorCount,
      department.appointmentCount,
    ]),
    [],
    ['Raportul conține date agregate și nu include date personale ale pacienților.'],
  ]
  const csv = `\uFEFF${rows.map((row) =>
    row.map(formatCsvValue).join(','),
  ).join('\r\n')}`
  downloadFile(
    `medcare-raport-${getLocalDateValue(generatedAt)}.csv`,
    csv,
    'text/csv;charset=utf-8',
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function downloadDashboardHtml(options: DashboardReportOptions) {
  const { appointments, departments, doctors, patients, generatedAt, generatedBy } = options
  const todayAppointments = appointments.filter((appointment) =>
    appointment.date === getLocalDateValue(generatedAt),
  )
  const appointmentCounts = getAppointmentStatusCounts(todayAppointments)
  const specialties = getAppointmentsBySpecialty(todayAppointments)
  const availableDoctors = doctors.filter((doctor) => doctor.status === 'Disponibil').length
  const activePatients = patients.filter((patient) => patient.status === 'Activ').length
  const activeDepartments = departments.filter((department) => department.status === 'Activ').length

  const specialtyRows = specialties.length > 0
    ? specialties.map(([specialty, count]) => `<tr><td>${escapeHtml(specialty)}</td><td>${count}</td></tr>`).join('')
    : '<tr><td colspan="2">Nu există programări astăzi.</td></tr>'
  const departmentRows = departments.length > 0
    ? departments.map((department) => `<tr><td>${escapeHtml(department.name)}</td><td>${escapeHtml(department.status)}</td><td>${department.doctorCount}</td><td>${department.appointmentCount}</td></tr>`).join('')
    : '<tr><td colspan="4">Nu există departamente înregistrate.</td></tr>'

  const html = `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Raport de activitate MedCare</title>
  <style>
    :root{font-family:Arial,sans-serif;color:#203b33;background:#f3f6f4}
    body{max-width:1000px;margin:32px auto;padding:32px;background:#fff}
    h1{margin:0 0 8px;font-size:26px}
    h2{margin:28px 0 12px;font-size:18px}
    p,.meta{color:#66776e}
    .meta{font-size:13px;line-height:1.7}
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}
    .metric{padding:16px;border:1px solid #e3ebe5;border-radius:10px;background:#f8fbf8}
    .metric span{display:block;color:#718179;font-size:12px}
    .metric strong{display:block;margin-top:8px;font-size:24px}
    table{width:100%;border-collapse:collapse;font-size:14px}
    th,td{padding:10px 12px;border-bottom:1px solid #e8eeea;text-align:left}
    th{color:#718179;font-size:12px;text-transform:uppercase}
    .privacy{margin-top:24px;font-size:12px}
    .print{padding:10px 16px;border:0;border-radius:7px;color:#fff;background:#327c61;font-size:14px;cursor:pointer}
    @media(max-width:650px){body{margin:0;padding:20px}.metrics{grid-template-columns:repeat(2,1fr)}}
    @media print{body{max-width:none;margin:0;padding:0}.print{display:none}*:not(.metric){break-inside:avoid}}
  </style>
</head>
<body>
  <button class="print" type="button" onclick="window.print()">Imprimă / Salvează ca PDF</button>
  <h1>Raport de activitate MedCare</h1>
  <p class="meta">Generat la ${escapeHtml(formatGeneratedAt(generatedAt))}<br>Generat de ${escapeHtml(generatedBy)}</p>
  <div class="metrics">
    <div class="metric"><span>Pacienți în evidență</span><strong>${patients.length}</strong></div>
    <div class="metric"><span>Pacienți activi</span><strong>${activePatients}</strong></div>
    <div class="metric"><span>Medici disponibili</span><strong>${availableDoctors} / ${doctors.length}</strong></div>
    <div class="metric"><span>Departamente active</span><strong>${activeDepartments} / ${departments.length}</strong></div>
  </div>
  <h2>Programări astăzi</h2>
  <p>${appointmentCounts.total} programări · ${appointmentCounts.confirmed} confirmate · ${appointmentCounts.pending} în așteptare · ${appointmentCounts.cancelled} anulate</p>
  <table><thead><tr><th>Specialitate</th><th>Programări</th></tr></thead><tbody>${specialtyRows}</tbody></table>
  <h2>Departamente</h2>
  <table><thead><tr><th>Departament</th><th>Status</th><th>Medici</th><th>Programări</th></tr></thead><tbody>${departmentRows}</tbody></table>
  <p class="privacy">Raportul conține date agregate și nu include nume sau date de identificare ale pacienților.</p>
</body>
</html>`

  downloadFile(
    `medcare-raport-${getLocalDateValue(generatedAt)}.html`,
    html,
    'text/html;charset=utf-8',
  )
}
