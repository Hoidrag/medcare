import { useMemo, useState, type FormEvent } from 'react'
import { demoDoctors, type DemoDoctor } from '../shared/demoData'

type DoctorForm = Pick<DemoDoctor, 'name' | 'specialty' | 'department' | 'schedule'> & {
  experience: string
  status: DemoDoctor['status']
}

const emptyForm: DoctorForm = {
  name: '',
  specialty: '',
  department: '',
  experience: '',
  schedule: '',
  status: 'Disponibil',
}

const doctorTones: DemoDoctor['tone'][] = ['green', 'blue', 'amber', 'rose']

function isDoctorStatus(value: string): value is DemoDoctor['status'] {
  return value === 'Disponibil' || value === 'În consultație' || value === 'Indisponibil'
}

type DoctorsDirectoryProps = {
  query: string
}

export default function DoctorsDirectory({ query }: DoctorsDirectoryProps) {
  const [doctors, setDoctors] = useState<DemoDoctor[]>(demoDoctors)
  const [selectedSpecialty, setSelectedSpecialty] = useState('Toate specialitățile')
  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [editingDoctor, setEditingDoctor] = useState<DemoDoctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<DemoDoctor | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
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
  }, [doctors, query, selectedSpecialty])

  function openCreateForm() {
    setEditingDoctor(null)
    setForm(emptyForm)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(doctor: DemoDoctor) {
    setEditingDoctor(doctor)
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      department: doctor.department,
      experience: String(doctor.experience),
      schedule: doctor.schedule,
      status: doctor.status,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const experience = Number(form.experience)
    if (!Number.isInteger(experience) || experience < 0 || experience > 60) {
      setFormError('Introdu experiența în ani, între 0 și 60.')
      return
    }

    const name = form.name.trim()
    const specialty = form.specialty.trim()
    const department = form.department.trim()
    const schedule = form.schedule.trim()
    if (!name || !specialty || !department || !schedule) {
      setFormError('Completează numele, specialitatea, departamentul și programul medicului.')
      return
    }

    const normalizedName = name.toLocaleLowerCase('ro')
    if (doctors.some((doctor) =>
      doctor !== editingDoctor && doctor.name.toLocaleLowerCase('ro') === normalizedName,
    )) {
      setFormError('Există deja un medic cu acest nume în listă.')
      return
    }

    const initials = name.replace(/^Dr\.\s*/i, '').split(/\s+/).slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toLocaleUpperCase('ro')
    if (editingDoctor) {
      setDoctors((currentDoctors) => currentDoctors.map((doctor) =>
        doctor === editingDoctor
          ? { ...doctor, ...form, name, specialty, department, schedule, experience, initials }
          : doctor,
      ))
    } else {
      const newDoctor: DemoDoctor = {
        ...form,
        name,
        specialty,
        department,
        schedule,
        experience,
        initials,
        appointments: 0,
        tone: doctorTones[doctors.length % doctorTones.length],
      }
      setDoctors((currentDoctors) => [newDoctor, ...currentDoctors])
    }
    setSelectedSpecialty('Toate specialitățile')
    setIsFormOpen(false)
    setEditingDoctor(null)
  }

  function handleDelete() {
    if (!doctorToDelete) return
    setDoctors((currentDoctors) => currentDoctors.filter((doctor) => doctor !== doctorToDelete))
    setSelectedSpecialty('Toate specialitățile')
    setDoctorToDelete(null)
  }

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
          <div className="doctors-list-actions">
            <label className="doctor-specialty-filter">
              <span className="visually-hidden">Filtrează după specialitate</span>
              <select value={selectedSpecialty} onChange={(event) => setSelectedSpecialty(event.target.value)}>
                <option>Toate specialitățile</option>
                {specialties.map((specialty) => <option key={specialty}>{specialty}</option>)}
              </select>
            </label>
            <button className="primary-action doctor-add-button" type="button" onClick={openCreateForm}>
              <span aria-hidden="true">＋</span> Adaugă medic
            </button>
          </div>
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
                <th><span className="visually-hidden">Acțiuni</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doctor) => (
                <tr key={doctor.name}>
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
                  <td>
                    <span className="doctor-row-actions">
                      <button type="button" onClick={() => openEditForm(doctor)} aria-label={`Editează ${doctor.name}`}>Editează</button>
                      <button type="button" className="doctor-delete-action" onClick={() => setDoctorToDelete(doctor)} aria-label={`Șterge ${doctor.name}`}>Șterge</button>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredDoctors.length === 0 && (
                <tr><td className="empty-results" colSpan={7}>Nu am găsit medici pentru criteriile selectate.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="doctors-demo-note">Date demonstrative — informațiile nu reprezintă personal medical real. Modificările sunt temporare și nu se salvează în baza de date.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="doctor-form-title">{editingDoctor ? 'Editează medicul' : 'Adaugă medic'}</h2>
                <p>Completează datele demonstrative ale medicului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="patient-form-field">
                Nume medic
                <input autoFocus required maxLength={100} placeholder="ex. Dr. Maria Pop" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Specialitate
                  <input required maxLength={80} value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Departament
                  <input required maxLength={80} value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                </label>
              </div>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Experiență (ani)
                  <input required type="number" min="0" max="60" step="1" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Program
                  <input required maxLength={40} placeholder="08:00–16:00" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
                </label>
              </div>
              <label className="patient-form-field">
                Disponibilitate
                <select value={form.status} onChange={(event) => {
                  if (isDoctorStatus(event.target.value)) {
                    setForm({ ...form, status: event.target.value })
                  }
                }}>
                  <option>Disponibil</option>
                  <option>În consultație</option>
                  <option>Indisponibil</option>
                </select>
              </label>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingDoctor ? 'Salvează modificările' : 'Adaugă medic'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {doctorToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDoctorToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="doctor-delete-title">
            <h2 id="doctor-delete-title">Ștergi medicul?</h2>
            <p><strong>{doctorToDelete.name}</strong> va fi eliminat din lista demonstrativă. Acțiunea nu afectează programările existente.</p>
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDoctorToDelete(null)}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge medicul</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
