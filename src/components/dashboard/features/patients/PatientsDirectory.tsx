import { useMemo, useState, type FormEvent } from 'react'

type PatientStatus = 'Activ' | 'Monitorizare' | 'Externat'

type Patient = {
  id: string
  name: string
  age: number
  phone: string
  email: string
  lastVisit: string
  status: PatientStatus
}

type PatientForm = Omit<Patient, 'id' | 'age'> & { age: string }

function isPatientStatus(value: string): value is PatientStatus {
  return value === 'Activ' || value === 'Monitorizare' || value === 'Externat'
}

const demoPatients: Patient[] = [
  { id: 'PAC-001', name: 'Ana Ionescu', age: 34, phone: '0722 123 456', email: 'ana.ionescu@example.test', lastVisit: '10 nov. 2026', status: 'Activ' },
  { id: 'PAC-002', name: 'Mihai Georgescu', age: 52, phone: '0723 234 567', email: 'mihai.georgescu@example.test', lastVisit: '08 nov. 2026', status: 'Monitorizare' },
  { id: 'PAC-003', name: 'Ioana Stan', age: 27, phone: '0724 345 678', email: 'ioana.stan@example.test', lastVisit: '06 nov. 2026', status: 'Activ' },
  { id: 'PAC-004', name: 'Vlad Dumitrescu', age: 41, phone: '0725 456 789', email: 'vlad.dumitrescu@example.test', lastVisit: '02 nov. 2026', status: 'Activ' },
  { id: 'PAC-005', name: 'Maria Popescu', age: 63, phone: '0726 567 890', email: 'maria.popescu@example.test', lastVisit: '28 oct. 2026', status: 'Externat' },
]

const emptyForm: PatientForm = {
  name: '',
  age: '',
  phone: '',
  email: '',
  lastVisit: '',
  status: 'Activ',
}

type PatientsDirectoryProps = {
  query: string
}

export default function PatientsDirectory({ query }: PatientsDirectoryProps) {
  const [patients, setPatients] = useState(demoPatients)
  const [form, setForm] = useState<PatientForm>(emptyForm)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [formError, setFormError] = useState('')

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
    setForm(emptyForm)
    setFormError('')
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
    setIsFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const age = Number(form.age)
    if (!Number.isInteger(age) || age < 0 || age > 125) {
      setFormError('Introdu o vârstă validă, între 0 și 125 de ani.')
      return
    }

    if (editingPatient) {
      setPatients((currentPatients) => currentPatients.map((patient) =>
        patient.id === editingPatient.id ? { ...form, age, id: patient.id } : patient,
      ))
    } else {
      setPatients((currentPatients) => [
        { ...form, age, id: `PAC-${String(Date.now()).slice(-6)}` },
        ...currentPatients,
      ])
    }
    setIsFormOpen(false)
  }

  function handleDelete() {
    if (!patientToDelete) return
    setPatients((currentPatients) => currentPatients.filter((patient) => patient.id !== patientToDelete.id))
    setPatientToDelete(null)
  }

  return (
    <section className="patients-directory" aria-label="Lista pacienților">
      <div className="patients-summary" aria-label="Rezumatul pacienților">
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon">♙</span>
          <span><strong>{patients.length}</strong><small>Pacienți în evidență</small></span>
        </article>
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon summary-green">●</span>
          <span><strong>{patients.filter((patient) => patient.status === 'Activ').length}</strong><small>Pacienți activi</small></span>
        </article>
        <article className="dashboard-card patient-summary-card">
          <span className="patient-summary-icon summary-amber">◷</span>
          <span><strong>{patients.filter((patient) => patient.status === 'Monitorizare').length}</strong><small>În monitorizare</small></span>
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
                      <span><strong>{patient.name}</strong><small>{patient.id}</small></span>
                    </span>
                  </td>
                  <td>{patient.age} ani</td>
                  <td><span className="patient-contact"><strong>{patient.phone || '—'}</strong><small>{patient.email || '—'}</small></span></td>
                  <td>{patient.lastVisit || '—'}</td>
                  <td><span className={`patient-status patient-status-${patient.status === 'Activ' ? 'active' : patient.status === 'Monitorizare' ? 'monitoring' : 'discharged'}`}><i />{patient.status}</span></td>
                  <td>
                    <span className="patient-row-actions">
                      <button type="button" onClick={() => openEditForm(patient)} aria-label={`Editează ${patient.name}`}>Editează</button>
                      <button type="button" className="patient-delete-action" onClick={() => setPatientToDelete(patient)} aria-label={`Șterge ${patient.name}`}>Șterge</button>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr><td className="empty-results" colSpan={6}>Nu am găsit pacienți pentru „{query}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="patients-demo-note">Date demonstrative — nu reprezintă informații despre pacienți reali. Modificările sunt temporare și nu se salvează în baza de date.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="patient-form-title">{editingPatient ? 'Editează pacientul' : 'Adaugă pacient'}</h2>
                <p>Completează datele demonstrative ale pacientului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
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
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingPatient ? 'Salvează modificările' : 'Adaugă pacient'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {patientToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPatientToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="patient-delete-title">
            <h2 id="patient-delete-title">Ștergi pacientul?</h2>
            <p>Pacientul <strong>{patientToDelete.name}</strong> va fi eliminat din lista demonstrativă.</p>
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setPatientToDelete(null)}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge pacientul</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
