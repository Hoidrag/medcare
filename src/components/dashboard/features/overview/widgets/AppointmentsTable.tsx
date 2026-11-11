import { useState } from 'react'
import {
  createDemoAppointments,
  getLocalDateValue,
  type DemoAppointment,
} from '../../shared/demoData'

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
  query: string
  onViewAll: () => void
}

export default function AppointmentsTable({ query, onViewAll }: AppointmentsTableProps) {
  const [today] = useState(() => new Date())
  const todayValue = getLocalDateValue(today)
  const [appointments] = useState<DemoAppointment[]>(() => createDemoAppointments(todayValue))
  const normalizedQuery = query.trim().toLocaleLowerCase('ro')
  const filteredAppointments = appointments.filter((appointment) =>
    `${appointment.patient} ${appointment.doctor} ${appointment.specialty} ${appointment.type}`
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
            <p>{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })} · {filteredAppointments.length} programări</p>
          </div>
        </div>
        <button className="secondary-action" type="button" onClick={onViewAll}>Vezi toate <span aria-hidden="true">→</span></button>
      </div>
      <div className="appointment-date-strip" aria-label="Zilele săptămânii curente">
        <span className="date-month">{formatDate(today, { month: 'long', year: 'numeric' })}</span>
        {getWeekDates(today).map((day) => (
          <span className={`date-chip${day.value === todayValue ? ' selected' : ''}`} key={day.value}>{day.label}</span>
        ))}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>ORĂ</th><th>PACIENT</th><th>MEDIC</th><th>TIPUL VIZITEI</th><th>STATUS</th></tr></thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="appointment-time">{appointment.time}</td>
                <td>
                  <span className="patient-cell">
                    <span className="patient-avatar">{appointment.patient.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                    <span><strong>{appointment.patient}</strong><small>{appointment.age} ani</small></span>
                  </span>
                </td>
                <td><strong className="doctor-cell">{appointment.doctor}</strong><small className="table-subtext">{appointment.specialty}</small></td>
                <td>{appointment.type}</td>
                <td><span className={`appointment-status${appointment.status === 'Confirmată' ? ' status-confirmed' : ''}`}><i />{appointment.status}</span></td>
              </tr>
            ))}
            {filteredAppointments.length === 0 && (
              <tr><td className="empty-results" colSpan={5}>Nu am găsit programări pentru „{query}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
