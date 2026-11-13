import type { Appointment } from '../../../../../services/appointments'

type AppointmentsBySpecialtyProps = {
  appointments: Appointment[]
  isLoading: boolean
  today: string
}

export default function AppointmentsBySpecialty({
  appointments,
  isLoading,
  today,
}: AppointmentsBySpecialtyProps) {
  const appointmentCounts = appointments
    .filter((appointment) => appointment.date === today)
    .reduce<Record<string, number>>((counts, appointment) => {
      counts[appointment.specialty] = (counts[appointment.specialty] ?? 0) + 1
      return counts
    }, {})
  const specialties = Object.entries(appointmentCounts)
    .sort((first, second) => second[1] - first[1])
  const maximumCount = Math.max(1, ...specialties.map(([, count]) => count))

  return (
    <section className="dashboard-card trends-card overview-specialty-card">
      <div className="widget-heading">
        <div className="widget-title">
          <span className="widget-icon">⌁</span>
          <div>
            <h2>Programări pe specialitate</h2>
            <p>Distribuția programărilor de astăzi</p>
          </div>
        </div>
      </div>
      <div className="overview-specialty-summary">
        <strong>{isLoading ? '—' : specialties.reduce((total, [, count]) => total + count, 0)}</strong>
        <span>programări în total astăzi</span>
      </div>
      {isLoading ? (
        <p className="overview-widget-empty">Se încarcă programările...</p>
      ) : specialties.length > 0 ? (
        <div className="analytics-department-bars overview-specialty-bars">
          {specialties.map(([specialty, count], index) => (
            <div className="analytics-department-row" key={specialty}>
              <div><span>{specialty}</span><strong>{count}</strong></div>
              <div className="analytics-bar-track">
                <span
                  className={`analytics-bar-fill analytics-bar-${index % 4}`}
                  style={{ width: `${(count / maximumCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="overview-widget-empty">Nu există programări astăzi.</p>
      )}
      <div className="chart-legend overview-specialty-legend">
        <span><i className="legend-primary" />Programări din baza de date</span>
      </div>
    </section>
  )
}
