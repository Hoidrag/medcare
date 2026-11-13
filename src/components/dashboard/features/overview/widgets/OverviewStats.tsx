import type { Appointment } from '../../../../../services/appointments'
import type { Department } from '../../../../../services/departments'
import type { Doctor } from '../../../../../services/doctors'
import type { Patient } from '../../../../../services/patients'

type OverviewStatsProps = {
  appointments: Appointment[]
  departments: Department[]
  doctors: Doctor[]
  isLoading: boolean
  patients: Patient[]
  today: string
}

export default function OverviewStats({
  appointments,
  departments,
  doctors,
  isLoading,
  patients,
  today,
}: OverviewStatsProps) {
  const appointmentsToday = appointments.filter((appointment) => appointment.date === today)
  const activePatients = patients.filter((patient) => patient.status === 'Activ').length
  const monitoredPatients = patients.filter((patient) => patient.status === 'Monitorizare').length
  const confirmedAppointments = appointmentsToday.filter((appointment) => appointment.status === 'Confirmată').length
  const pendingAppointments = appointmentsToday.filter((appointment) => appointment.status === 'În așteptare').length
  const cancelledAppointments = appointmentsToday.filter((appointment) => appointment.status === 'Anulată').length
  const availableDoctors = doctors.filter((doctor) => doctor.status === 'Disponibil').length
  const activeDepartments = departments.filter((department) => department.status === 'Activ').length

  const stats = [
    {
      label: 'Pacienți în evidență',
      value: isLoading ? '—' : String(patients.length),
      caption: isLoading ? 'Se încarcă datele...' : `${activePatients} activi · ${monitoredPatients} în monitorizare`,
      icon: '♙',
    },
    {
      label: 'Programări astăzi',
      value: isLoading ? '—' : String(appointmentsToday.length),
      caption: isLoading
        ? 'Se încarcă datele...'
        : `${confirmedAppointments} confirmate · ${pendingAppointments} în așteptare · ${cancelledAppointments} anulate`,
      icon: '▦',
    },
    {
      label: 'Medici disponibili',
      value: isLoading ? '—' : String(availableDoctors),
      caption: isLoading ? 'Se încarcă datele...' : `din ${doctors.length} medici în echipă`,
      icon: '✚',
    },
    {
      label: 'Departamente active',
      value: isLoading ? '—' : String(activeDepartments),
      caption: isLoading ? 'Se încarcă datele...' : `din ${departments.length} departamente`,
      icon: '⌂',
    },
  ]

  return (
    <section className="overview-stats" aria-label="Rezumatul clinicii">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-card-heading">
            <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
            <h2>{stat.label}</h2>
          </div>
          <div className="stat-value">{stat.value}</div>
          <p className="stat-change">{stat.caption}</p>
        </article>
      ))}
    </section>
  )
}
