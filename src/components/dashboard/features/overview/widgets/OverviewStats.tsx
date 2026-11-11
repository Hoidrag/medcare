import { demoAppointments, demoDepartments, demoDoctors, demoPatients } from '../../shared/demoData'

const activePatients = demoPatients.filter((patient) => patient.status === 'Activ').length
const monitoredPatients = demoPatients.filter((patient) => patient.status === 'Monitorizare').length
const confirmedAppointments = demoAppointments.filter((appointment) => appointment.status === 'Confirmată').length
const availableDoctors = demoDoctors.filter((doctor) => doctor.status === 'Disponibil').length
const activeDepartments = demoDepartments.filter((department) => department.status === 'Activ').length

const stats = [
  {
    label: 'Pacienți în evidență',
    value: String(demoPatients.length),
    caption: `${activePatients} activi · ${monitoredPatients} în monitorizare`,
    icon: '♙',
  },
  {
    label: 'Programări astăzi',
    value: String(demoAppointments.length),
    caption: `${confirmedAppointments} confirmate · ${demoAppointments.length - confirmedAppointments} în așteptare`,
    icon: '▦',
  },
  {
    label: 'Medici disponibili',
    value: String(availableDoctors),
    caption: `din ${demoDoctors.length} medici în echipă`,
    icon: '✚',
  },
  {
    label: 'Departamente active',
    value: String(activeDepartments),
    caption: `din ${demoDepartments.length} departamente`,
    icon: '⌂',
  },
]

export default function OverviewStats() {
  return (
    <>
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
      <p className="dashboard-demo-note">Indicatori calculați din listele demonstrative ale pacienților, medicilor, departamentelor și programărilor.</p>
    </>
  )
}
