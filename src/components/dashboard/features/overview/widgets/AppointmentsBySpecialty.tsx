import { demoAppointments } from '../../shared/demoData'

const appointmentCounts = demoAppointments.reduce<Record<string, number>>((counts, appointment) => {
  counts[appointment.specialty] = (counts[appointment.specialty] ?? 0) + 1
  return counts
}, {})

const specialties = Object.entries(appointmentCounts)
  .sort((first, second) => second[1] - first[1])

const maximumCount = Math.max(1, ...specialties.map(([, count]) => count))

export default function AppointmentsBySpecialty() {
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
        <span className="overview-demo-badge">Demonstrativ</span>
      </div>
      <div className="overview-specialty-summary">
        <strong>{demoAppointments.length}</strong>
        <span>programări în total astăzi</span>
      </div>
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
      <div className="chart-legend overview-specialty-legend">
        <span><i className="legend-primary" />Programări în lista de astăzi</span>
      </div>
    </section>
  )
}
