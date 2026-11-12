import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
  type Doctor,
  type DoctorInput,
  type DoctorStatus,
} from '../../../../services/doctors'

type DoctorForm = Pick<Doctor, 'name' | 'specialty' | 'department' | 'schedule'> & {
  experience: string
  status: DoctorStatus
}

const emptyForm = (): DoctorForm => ({
  name: '',
  specialty: '',
  department: '',
  experience: '',
  schedule: '',
  status: 'Disponibil',
})

const doctorTones = ['green', 'blue', 'amber', 'rose'] as const

function isDoctorStatus(value: string): value is DoctorStatus {
  return value === 'Disponibil' || value === 'În consultație' || value === 'Indisponibil'
}

function getDoctorInitials(name: string) {
  return name.replace(/^Dr\.\s*/i, '').split(/\s+/).slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toLocaleUpperCase('ro')
}

function getDoctorTone(id: string) {
  const toneIndex = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)
    % doctorTones.length
  return doctorTones[toneIndex]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Solicitarea nu a putut fi finalizată.'
}

type DoctorsDirectoryProps = {
  query: string
}

export default function DoctorsDirectory({ query }: DoctorsDirectoryProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('Toate specialitățile')
  const [form, setForm] = useState<DoctorForm>(emptyForm)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.specialty))], [doctors])

  const loadDoctors = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      setDoctors(await getDoctors())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getDoctors()
      .then((loadedDoctors) => {
        if (isCurrent) setDoctors(loadedDoctors)
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(getErrorMessage(error))
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

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
    setForm(emptyForm())
    setFormError('')
    setRequestError('')
    setIsFormOpen(true)
  }

  function openEditForm(doctor: Doctor) {
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
    setRequestError('')
    setIsFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setRequestError('')
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
      doctor.id !== editingDoctor?.id && doctor.name.toLocaleLowerCase('ro') === normalizedName,
    )) {
      setFormError('Există deja un medic cu acest nume în listă.')
      return
    }

    const doctorInput: DoctorInput = {
      name,
      specialty,
      department,
      experience,
      schedule,
      status: form.status,
    }

    setIsSaving(true)
    try {
      const savedDoctor = editingDoctor
        ? await updateDoctor(editingDoctor.id, doctorInput)
        : await createDoctor(doctorInput)
      setDoctors((currentDoctors) => editingDoctor
        ? currentDoctors.map((doctor) => doctor.id === savedDoctor.id ? savedDoctor : doctor)
        : [savedDoctor, ...currentDoctors])
      setSelectedSpecialty('Toate specialitățile')
      setIsFormOpen(false)
      setEditingDoctor(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!doctorToDelete) return
    setIsDeleting(true)
    setRequestError('')
    try {
      await deleteDoctor(doctorToDelete.id)
      setDoctors((currentDoctors) => currentDoctors.filter((doctor) => doctor.id !== doctorToDelete.id))
      setSelectedSpecialty('Toate specialitățile')
      setDoctorToDelete(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="doctors-directory" aria-label="Directorul medicilor">
      <div className="doctors-summary" aria-label="Rezumatul echipei medicale">
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon">✚</span>
          <span><strong>{isLoading || loadError ? '—' : doctors.length}</strong><small>Medici în echipă</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-green">●</span>
          <span><strong>{isLoading || loadError ? '—' : doctors.filter((doctor) => doctor.status === 'Disponibil').length}</strong><small>Disponibili acum</small></span>
        </article>
        <article className="dashboard-card doctor-summary-card">
          <span className="doctor-summary-icon summary-blue">▦</span>
          <span><strong>{isLoading || loadError ? '—' : doctors.reduce((total, doctor) => total + doctor.appointments, 0)}</strong><small>Consultații programate azi</small></span>
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
          {isLoading ? (
            <p className="doctors-load-state" role="status">Se încarcă medicii din baza de date...</p>
          ) : loadError ? (
            <div className="doctors-load-state doctors-load-error" role="alert">
              <p>{loadError}</p>
              <button type="button" onClick={() => void loadDoctors()}>Reîncearcă</button>
            </div>
          ) : (
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
              {filteredDoctors.map((doctor) => {
                const tone = getDoctorTone(doctor.id)
                return (
                  <tr key={doctor.id}>
                    <td>
                      <span className="doctor-directory-person">
                        <span className={`doctor-avatar avatar-${tone}`}>{getDoctorInitials(doctor.name)}</span>
                        <span><strong>{doctor.name}</strong><small>{doctor.department}</small></span>
                      </span>
                    </td>
                    <td>{doctor.specialty}</td>
                    <td>{doctor.experience} ani</td>
                    <td>{doctor.schedule}</td>
                    <td>
                      <span className={`doctor-status doctor-status-${tone}`}>
                        <i />{doctor.status}
                      </span>
                    </td>
                    <td><span className="doctor-appointment-count">{doctor.appointments}</span></td>
                    <td>
                      <span className="doctor-row-actions">
                        <button type="button" onClick={() => openEditForm(doctor)} aria-label={`Editează ${doctor.name}`}>Editează</button>
                        <button
                          type="button"
                          className="doctor-delete-action"
                          onClick={() => {
                            setRequestError('')
                            setDoctorToDelete(doctor)
                          }}
                          aria-label={`Șterge ${doctor.name}`}
                        >
                          Șterge
                        </button>
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredDoctors.length === 0 && (
                <tr><td className="empty-results" colSpan={7}>
                  {doctors.length === 0
                    ? 'Nu există medici salvați în baza de date. Adaugă primul medic.'
                    : 'Nu am găsit medici pentru criteriile selectate.'}
                </td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        <p className="doctors-info-note">Lista și modificările sunt salvate în baza de date pentru contul autentificat.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="doctor-form-title">{editingDoctor ? 'Editează medicul' : 'Adaugă medic'}</h2>
                <p>Completează informațiile medicului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide" disabled={isSaving}>×</button>
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
              {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Anulează</button>
                <button className="primary-action" type="submit" disabled={isSaving}>{isSaving ? 'Se salvează...' : editingDoctor ? 'Salvează modificările' : 'Adaugă medic'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {doctorToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setDoctorToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="doctor-delete-title">
            <h2 id="doctor-delete-title">Ștergi medicul?</h2>
            <p><strong>{doctorToDelete.name}</strong> va fi eliminat din lista salvată. Acțiunea nu afectează programările existente.</p>
            {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDoctorToDelete(null)} disabled={isDeleting}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Se șterge...' : 'Șterge medicul'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
