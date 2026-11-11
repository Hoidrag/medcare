import { useMemo, useState } from 'react'

type Doctor = {
  name: string
  initials: string
  specialty: string
  department: string
  experience: number
  schedule: string
  status: 'Disponibil' | 'În consultație' | 'Indisponibil'
  appointments: number
  tone: 'green' | 'blue' | 'amber' | 'rose'
}

const doctors: Doctor[] = [
  { name: 'Dr. Andrei Popa', initials: 'AP', specialty: 'Cardiologie', department: 'Cardiologie', experience: 12, schedule: '08:00–16:00', status: 'Disponibil', appointments: 8, tone: 'green' },
  { name: 'Dr. Elena Marin', initials: 'EM', specialty: 'Neurologie', department: 'Neurologie', experience: 9, schedule: '09:00–17:00', status: 'În consultație', appointments: 6, tone: 'blue' },
  { name: 'Dr. Radu Cernat', initials: 'RC', specialty: 'Medicină internă', department: 'Medicină internă', experience: 15, schedule: '08:30–16:30', status: 'Disponibil', appointments: 7, tone: 'amber' },
  { name: 'Dr. Ioana Dumitru', initials: 'ID', specialty: 'Pediatrie', department: 'Pediatrie', experience: 7, schedule: '10:00–18:00', status: 'Indisponibil', appointments: 5, tone: 'rose' },
  { name: 'Dr. Mihai Stan', initials: 'MS', specialty: 'Dermatologie', department: 'Dermatologie', experience: 11, schedule: '08:00–14:00', status: 'Disponibil', appointments: 9, tone: 'blue' },
  { name: 'Dr. Ana Ionescu', initials: 'AI', specialty: 'Endocrinologie', department: 'Endocrinologie', experience: 6, schedule: '09:00–15:00', status: 'În consultație', appointments: 4, tone: 'green' },
]

type DoctorsDirectoryProps = {
  query: string
}

export default function DoctorsDirectory({ query }: DoctorsDirectoryProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Toate specialitățile')
  const specialties = [...new Set(doctors.map((doctor) => doctor.specialty))]
  const filteredDoctors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return doctors.filter((doctor) => {
      const matchesSpecialty = selectedSpecialty === 'Toate specialitățile'
        || doctor.specialty === selectedSpecialty
      const matchesQuery = !normalizedQuery
        || `${doctor.name} ${doctor.specialty} ${doctor.department} ${doctor.status}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery)
      return matchesSpecialty && matchesQuery
    })
  }, [query, selectedSpecialty])

  return (
    <section className="doctors-directory" aria-label="Directorul medicilor">
      <div className="doctors-summary" aria-label="Rezumatul echipei medicale">
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon">✚</span>
          <span><strong>{doctors.length}</strong><small>Medici în echipă</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-green">●</span>
          <span><strong>{doctors.filter((doctor) => doctor.status === 'Disponibil').length}</strong><small>Disponibili acum</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-blue">▦</span>
          <span><strong>{doctors.reduce((total, doctor) => total + doctor.appointments, 0)}</strong><small>Consultații programate azi</small></span>
        </article>
      </div>

      <div className="dashboard-card doctors-list-card">
        <div className="doctors-list-heading">
          <div>
            <h2>Directorul medicilor</h2>
            <p>Specialități, program și disponibilitate pentru ziua de astăzi.</p>
          </div>
          <label className="doctor-specialty-filter">
            <span className="visually-hidden">Filtrează după specialitate</span>
            <select value={selectedSpecialty} onChange={(event) => setSelectedSpecialty(event.target.value)}>
              <option>Toate specialitățile</option>
              {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
            </select>
          </label>
        </div>

        <div className="doctors-table-scroll">
          <table className="doctors-table">
            <thead>
              <tr>
                <th>MEDIC</th>
                <th>SPECIALITATE</th>
                <th>EXPERIENȚĂ</th>
                <th>PROGRAM ASTĂZI</th>
                <th>DISPONIBILITATE</th>
                <th>PROGRAMĂRI</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.initials}>
                  <td>
                    <span className="doctor-directory-person">
                      <span className={`doctor-avatar avatar-${doctor.tone}`}>{doctor.initials}</span>
                      <span><strong>{doctor.name}</strong><small>{doctor.department}</small></span>
                    </span>
                  </td>
                  <td>{doctor.specialty}</td>
                  <td>{doctor.experience} ani</td>
                  <td>{doctor.schedule}</td>
                  <td>
                    <span className={`doctor-status doctor-status-${doctor.tone}`}>
                      <i />{doctor.status}
                    </span>
                  </td>
                  <td><span className="doctor-appointment-count">{doctor.appointments}</span></td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr><td className="empty-results" colSpan={6}>Nu am găsit medici pentru criteriile selectate.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="doctors-demo-note">Date demonstrative — informațiile nu reprezintă personal medical real.</p>
      </div>
    </section>
  )
}
