type Appointment = {
  time: string
  patient: string
  age: number
  doctor: string
  specialty: string
  type: string
  status: string
}

const appointments: Appointment[] = [
  { time: '09:30', patient: 'Ana Ionescu', age: 34, doctor: 'Dr. Andrei Popa', specialty: 'Cardiologie', type: 'Control', status: 'Confirmată' },
  { time: '10:15', patient: 'Mihai Georgescu', age: 52, doctor: 'Dr. Elena Marin', specialty: 'Neurologie', type: 'Consultație', status: 'În așteptare' },
  { time: '11:00', patient: 'Ioana Stan', age: 27, doctor: 'Dr. Radu Cernat', specialty: 'Medicină internă', type: 'Control', status: 'Confirmată' },
  { time: '11:45', patient: 'Vlad Dumitrescu', age: 41, doctor: 'Dr. Andrei Popa', specialty: 'Cardiologie', type: 'Consultație', status: 'Confirmată' },
]

type AppointmentsTableProps = {
  query: string
}

export default function AppointmentsTable({ query }: AppointmentsTableProps) {
  const filteredAppointments = appointments.filter((appointment) =>
    `${appointment.patient} ${appointment.doctor} ${appointment.specialty}`.toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro')),
  )

  return (
    <section className="dashboard-card appointments-card">
      <div className="widget-heading appointments-heading">
        <div className="widget-title"><span className="widget-icon">▦</span><div><h2>Programările zilei</h2><p>Marți, 10 noiembrie · {filteredAppointments.length} programări</p></div></div>
        <button className="secondary-action" type="button">Vezi calendarul <span aria-hidden="true">→</span></button>
      </div>
      <div className="appointment-date-strip" aria-label="Zilele săptămânii">
        <span className="date-month">Noiembrie 2026</span>
        {['L 9', 'Ma 10', 'Mi 11', 'J 12', 'V 13', 'S 14', 'D 15'].map((day, index) => (
          <span className={`date-chip${index === 1 ? ' selected' : ''}`} key={day}>{day}</span>
        ))}
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>ORĂ</th><th>PACIENT</th><th>MEDIC</th><th>TIPUL VIZITEI</th><th>STATUS</th></tr></thead>
          <tbody>
            {filteredAppointments.map((appointment) => (
              <tr key={`${appointment.time}-${appointment.patient}`}>
                <td className="appointment-time">{appointment.time}</td>
                <td><span className="patient-cell"><span className="patient-avatar">{appointment.patient.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{appointment.patient}</strong><small>{appointment.age} ani</small></span></span></td>
                <td><strong className="doctor-cell">{appointment.doctor}</strong><small className="table-subtext">{appointment.specialty}</small></td>
                <td>{appointment.type}</td>
                <td><span className={`appointment-status${appointment.status === 'Confirmată' ? ' status-confirmed' : ''}`}><i />{appointment.status}</span></td>
              </tr>
            ))}
            {filteredAppointments.length === 0 && <tr><td className="empty-results" colSpan={5}>Nu am găsit programări pentru „{query}”.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
