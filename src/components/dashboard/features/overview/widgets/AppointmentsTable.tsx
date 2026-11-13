import type { Appointment } from '../../../../../services/appointments'
import { getLocalDateValue } from '../../../../../utils/date'

const weekDays = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']

function getWeekDates(today: Date) {
  const mondayOffset = (today.getDay() + 6) % 7
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)
    return {
      value: getLocalDateValue(date),
      label: `${weekDays[(date.getDay() + 6) % 7]} ${date.getDate()}`,
    }
  })
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('ro-RO', options).format(date)
}

type AppointmentsTableProps = {
  appointments: Appointment[]
  isLoading: boolean
  query: string
  today: string
  onViewAll: () => void
}

export default function AppointmentsTable({
  appointments,
  isLoading,
  query,
  today,
  onViewAll,
}: AppointmentsTableProps) {
  const todayDate = new Date(`${today}T12:00:00`)
  const normalizedQuery = query.trim().toLocaleLowerCase('ro')
  const filteredAppointments = appointments
    .filter((appointment) => appointment.date === today)
    .filter((appointment) =>
      !normalizedQuery
      || `${appointment.patient} ${appointment.doctor} ${appointment.specialty} ${appointment.type}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery),
    )

  return (
    <section className="dashboard-card appointments-card">
      <div className="widget-heading appointments-heading">
        <div className="widget-title">
          <span className="widget-icon">▦</span>
          <div>
            <h2>Programările zilei</h2>
            <p>{formatDate(todayDate, { weekday: 'long', day: 'numeric', month: 'long' })} · {isLoading ? 'Se încarcă...' : `${filteredAppointments.length} programări`}</p>
          </div>
        </div>
        <button className="secondary-action" type="button" onClick={onViewAll}>Vezi toate <span aria-hidden="true">→</span></button>
      </div>
      <div className="appointment-date-strip" aria-label="Zilele săptămânii curente">
        <span className="date-month">{formatDate(todayDate, { month: 'long', year: 'numeric' })}</span>
        {getWeekDates(todayDate).map((day) => (
          <span className={`date-chip${day.value === today ? ' selected' : ''}`} key={day.value}>{day.label}</span>
        ))}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>ORĂ</th><th>PACIENT</th><th>MEDIC</th><th>TIPUL VIZITEI</th><th>STATUS</th></tr></thead>
          <tbody>
            {!isLoading && filteredAppointments.map((appointment) => {
              const statusClass = appointment.status === 'Confirmată'
                ? 'status-confirmed'
                : appointment.status === 'Anulată'
                  ? 'status-cancelled'
                  : ''
              return (
                <tr key={appointment.id}>
                  <td className="appointment-time">{appointment.time}</td>
                  <td>
                    <span className="patient-cell">
                      <span className="patient-avatar">{appointment.patient.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toLocaleUpperCase('ro')}</span>
                      <span><strong>{appointment.patient}</strong><small>{appointment.age} ani</small></span>
                    </span>
                  </td>
                  <td><strong className="doctor-cell">{appointment.doctor}</strong><small className="table-subtext">{appointment.specialty}</small></td>
                  <td>{appointment.type}</td>
                  <td><span className={`appointment-status ${statusClass}`}><i />{appointment.status}</span></td>
                </tr>
              )
            })}
            {!isLoading && filteredAppointments.length === 0 && (
              <tr>
                <td className="empty-results" colSpan={5}>
                  {appointments.some((appointment) => appointment.date === today)
                    ? `Nu am găsit programări pentru „${query}”.`
                    : 'Nu există programări salvate pentru astăzi.'}
                </td>
              </tr>
            )}
            {isLoading && <tr><td className="empty-results" colSpan={5}>Se încarcă programările din baza de date...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
