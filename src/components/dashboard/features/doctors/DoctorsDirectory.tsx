import { useMemo, useState } from 'react'
import { demoDoctors } from '../shared/demoData'

type DoctorsDirectoryProps = {
  query: string
}

export default function DoctorsDirectory({ query }: DoctorsDirectoryProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState('Toate specialitățile')
  const specialties = [...new Set(demoDoctors.map((doctor) => doctor.specialty))]
  const filteredDoctors = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return demoDoctors.filter((doctor) => {
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
          <span><strong>{demoDoctors.length}</strong><small>Medici în echipă</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-green">●</span>
          <span><strong>{demoDoctors.filter((doctor) => doctor.status === 'Disponibil').length}</strong><small>Disponibili acum</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-blue">▦</span>
          <span><strong>{demoDoctors.reduce((total, doctor) => total + doctor.appointments, 0)}</strong><small>Consultații programate azi</small></span>
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
