import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient,
  type Patient,
  type PatientInput,
  type PatientStatus,
} from '../../../../services/patients'

type PatientForm = Omit<PatientInput, 'age'> & { age: string }

function isPatientStatus(value: string): value is PatientStatus {
  return value === 'Activ' || value === 'Monitorizare' || value === 'Externat'
}

const emptyForm = (): PatientForm => ({
  name: '',
  age: '',
  phone: '',
  email: '',
  lastVisit: '',
  status: 'Activ',
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Solicitarea nu a putut fi finalizată.'
}

type PatientsDirectoryProps = {
  query: string
}

export default function PatientsDirectory({ query }: PatientsDirectoryProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<PatientForm>(emptyForm)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPatients = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      setPatients(await getPatients())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getPatients()
      .then((loadedPatients) => {
        if (isCurrent) setPatients(loadedPatients)
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

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    if (!normalizedQuery) return patients
    return patients.filter((patient) =>
      `${patient.id} ${patient.name} ${patient.phone} ${patient.email} ${patient.status}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery),
    )
  }, [patients, query])

  function openCreateForm() {
    setEditingPatient(null)
    setForm(emptyForm())
    setFormError('')
    setRequestError('')
    setIsFormOpen(true)
  }

  function openEditForm(patient: Patient) {
    setEditingPatient(patient)
    setForm({
      name: patient.name,
      age: String(patient.age),
      phone: patient.phone,
      email: patient.email,
      lastVisit: patient.lastVisit,
      status: patient.status,
    })
    setFormError('')
    setRequestError('')
    setIsFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setRequestError('')
    const age = Number(form.age)
    if (!Number.isInteger(age) || age < 0 || age > 125) {
      setFormError('Introdu o vârstă validă, între 0 și 125 de ani.')
      return
    }

    const name = form.name.trim()
    if (name.length < 2) {
      setFormError('Numele pacientului trebuie să aibă cel puțin 2 caractere.')
      return
    }

    const patientInput: PatientInput = {
      name,
      age,
      phone: form.phone.trim(),
      email: form.email.trim(),
      lastVisit: form.lastVisit.trim(),
      status: form.status,
    }

    setIsSaving(true)
    try {
      const savedPatient = editingPatient
        ? await updatePatient(editingPatient.id, patientInput)
        : await createPatient(patientInput)
      setPatients((currentPatients) => editingPatient
        ? currentPatients.map((patient) => patient.id === savedPatient.id ? savedPatient : patient)
        : [savedPatient, ...currentPatients])
      setIsFormOpen(false)
      setEditingPatient(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!patientToDelete) return
    setIsDeleting(true)
    setRequestError('')
    try {
      await deletePatient(patientToDelete.id)
      setPatients((currentPatients) => currentPatients.filter((patient) => patient.id !== patientToDelete.id))
      setPatientToDelete(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="patients-directory" aria-label="Lista pacienților">
      <div className="patients-summary" aria-label="Rezumatul pacienților">
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon">♙</span>
          <span><strong>{isLoading || loadError ? '—' : patients.length}</strong><small>Pacienți în evidență</small></span>
        </article>
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon summary-green">●</span>
          <span><strong>{isLoading || loadError ? '—' : patients.filter((patient) => patient.status === 'Activ').length}</strong><small>Pacienți activi</small></span>
        </article>
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon summary-amber">◷</span>
          <span><strong>{isLoading || loadError ? '—' : patients.filter((patient) => patient.status === 'Monitorizare').length}</strong><small>În monitorizare</small></span>
        </article>
      </div>

      <div className="dashboard-card patients-list-card">
        <div className="patients-list-heading">
          <div>
            <h2>Registrul pacienților</h2>
            <p>Gestionează datele de contact și statusul pacienților.</p>
          </div>
          <button className="primary-action patient-add-button" type="button" onClick={openCreateForm}>
            <span aria-hidden="true">＋</span> Adaugă pacient
          </button>
        </div>

        <div className="patients-table-scroll">
          {isLoading ? (
            <p className="patients-load-state" role="status">Se încarcă pacienții din baza de date...</p>
          ) : loadError ? (
            <div className="patients-load-state patients-load-error" role="alert">
              <p>{loadError}</p>
              <button type="button" onClick={() => void loadPatients()}>Reîncearcă</button>
            </div>
          ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>PACIENT</th>
                <th>VÂRSTĂ</th>
                <th>DATE DE CONTACT</th>
                <th>ULTIMA VIZITĂ</th>
                <th>STATUS</th>
                <th><span className="visually-hidden">Acțiuni</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <span className="patient-directory-person">
                      <span className="patient-avatar">{patient.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</span>
                      <span><strong>{patient.name}</strong></span>
                    </span>
                  </td>
                  <td>{patient.age} ani</td>
                  <td><span className="patient-contact"><strong>{patient.phone || '—'}</strong><small>{patient.email || '—'}</small></span></td>
                  <td>{patient.lastVisit || '—'}</td>
                  <td><span className={`patient-status patient-status-${patient.status === 'Activ' ? 'active' : patient.status === 'Monitorizare' ? 'monitoring' : 'discharged'}`}><i />{patient.status}</span></td>
                  <td>
                    <span className="patient-row-actions">
                      <button type="button" onClick={() => openEditForm(patient)} aria-label={`Editează ${patient.name}`}>Editează</button>
                      <button
                        type="button"
                        className="patient-delete-action"
                        onClick={() => {
                          setRequestError('')
                          setPatientToDelete(patient)
                        }}
                        aria-label={`Șterge ${patient.name}`}
                      >
                        Șterge
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr><td className="empty-results" colSpan={6}>
                  {patients.length === 0
                    ? 'Nu există pacienți salvați în baza de date. Adaugă primul pacient.'
                    : `Nu am găsit pacienți pentru „${query}”.`}
                </td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        <p className="patients-demo-note">Lista și modificările sunt salvate în baza de date pentru contul autentificat.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="patient-form-title">{editingPatient ? 'Editează pacientul' : 'Adaugă pacient'}</h2>
                <p>Completează informațiile pacientului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide" disabled={isSaving}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="patient-form-field">
                Nume complet
                <input autoFocus required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Vârstă
                  <input required type="number" min="0" max="125" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Telefon
                  <input type="tel" maxLength={30} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </label>
              </div>
              <label className="patient-form-field">
                Email
                <input type="email" maxLength={150} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Ultima vizită
                  <input placeholder="ex. 11 nov. 2026" maxLength={30} value={form.lastVisit} onChange={(event) => setForm({ ...form, lastVisit: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Status
                  <select value={form.status} onChange={(event) => {
                    if (isPatientStatus(event.target.value)) {
                      setForm({ ...form, status: event.target.value })
                    }
                  }}>
                    <option value="Activ">Activ</option>
                    <option value="Monitorizare">Monitorizare</option>
                    <option value="Externat">Externat</option>
                  </select>
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Anulează</button>
                <button className="primary-action" type="submit" disabled={isSaving}>{isSaving ? 'Se salvează...' : editingPatient ? 'Salvează modificările' : 'Adaugă pacient'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {patientToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setPatientToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="patient-delete-title">
            <h2 id="patient-delete-title">Ștergi pacientul?</h2>
            <p>Pacientul <strong>{patientToDelete.name}</strong> va fi eliminat din lista salvată.</p>
            {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setPatientToDelete(null)} disabled={isDeleting}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>{isDeleting ? 'Se șterge...' : 'Șterge pacientul'}</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
