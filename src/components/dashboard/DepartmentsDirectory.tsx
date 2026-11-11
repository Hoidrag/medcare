import { useMemo, useState, type FormEvent } from 'react'

type DepartmentStatus = 'Activ' | 'Program limitat' | 'În amenajare'

type Department = {
  id: string
  name: string
  description: string
  location: string
  schedule: string
  doctorCount: number
  appointmentCount: number
  status: DepartmentStatus
  doctors: string[]
  tone: 'green' | 'blue' | 'amber' | 'rose'
}

type DepartmentForm = Omit<Department, 'id' | 'doctors' | 'tone'> & {
  doctors: string
}

function isDepartmentStatus(value: string): value is DepartmentStatus {
  return value === 'Activ' || value === 'Program limitat' || value === 'În amenajare'
}

const initialDepartments: Department[] = [
  {
    id: 'DEP-001',
    name: 'Cardiologie',
    description: 'Prevenție, diagnostic și tratamentul afecțiunilor cardiovasculare.',
    location: 'Corp A · Etaj 2 · Cabinetele 201–204',
    schedule: 'Luni–Vineri, 08:00–18:00',
    doctorCount: 4,
    appointmentCount: 28,
    status: 'Activ',
    doctors: ['Dr. Andrei Popa', 'Dr. Cristina Pavel', 'Dr. Ștefan Dima'],
    tone: 'rose',
  },
  {
    id: 'DEP-002',
    name: 'Neurologie',
    description: 'Evaluare și îngrijire pentru afecțiuni ale sistemului nervos.',
    location: 'Corp A · Etaj 1 · Cabinetele 105–107',
    schedule: 'Luni–Vineri, 09:00–17:00',
    doctorCount: 3,
    appointmentCount: 19,
    status: 'Activ',
    doctors: ['Dr. Elena Marin', 'Dr. Paul Rusu'],
    tone: 'blue',
  },
  {
    id: 'DEP-003',
    name: 'Medicină internă',
    description: 'Consultații complexe, diagnostic și monitorizarea stării generale.',
    location: 'Corp B · Etaj 1 · Cabinetele 110–113',
    schedule: 'Luni–Sâmbătă, 08:30–16:30',
    doctorCount: 5,
    appointmentCount: 32,
    status: 'Activ',
    doctors: ['Dr. Radu Cernat', 'Dr. Oana Matei', 'Dr. Vlad Ilie'],
    tone: 'green',
  },
  {
    id: 'DEP-004',
    name: 'Pediatrie',
    description: 'Servicii medicale și consultații dedicate copiilor și adolescenților.',
    location: 'Corp B · Etaj 2 · Cabinetele 220–223',
    schedule: 'Luni–Vineri, 10:00–18:00',
    doctorCount: 3,
    appointmentCount: 16,
    status: 'Program limitat',
    doctors: ['Dr. Ioana Dumitru', 'Dr. Ana Stoica'],
    tone: 'amber',
  },
  {
    id: 'DEP-005',
    name: 'Dermatologie',
    description: 'Consultații pentru sănătatea pielii și proceduri dermatologice.',
    location: 'Corp A · Etaj 3 · Cabinetele 305–306',
    schedule: 'Luni–Vineri, 08:00–14:00',
    doctorCount: 2,
    appointmentCount: 14,
    status: 'Activ',
    doctors: ['Dr. Mihai Stan', 'Dr. Laura Enache'],
    tone: 'blue',
  },
  {
    id: 'DEP-006',
    name: 'Endocrinologie',
    description: 'Diagnostic și monitorizare pentru afecțiuni hormonale și metabolice.',
    location: 'Corp B · Etaj 1 · Cabinetul 118',
    schedule: 'Luni–Joi, 09:00–15:00',
    doctorCount: 2,
    appointmentCount: 11,
    status: 'În amenajare',
    doctors: ['Dr. Ana Ionescu'],
    tone: 'amber',
  },
]

const emptyForm: DepartmentForm = {
  name: '',
  description: '',
  location: '',
  schedule: '',
  doctorCount: 0,
  appointmentCount: 0,
  status: 'Activ',
  doctors: '',
}

type DepartmentsDirectoryProps = {
  query: string
}

export default function DepartmentsDirectory({ query }: DepartmentsDirectoryProps) {
  const [departments, setDepartments] = useState(initialDepartments)
  const [expandedDepartmentId, setExpandedDepartmentId] = useState<string | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const filteredDepartments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    if (!normalizedQuery) return departments
    return departments.filter((department) =>
      `${department.name} ${department.description} ${department.location} ${department.status} ${department.doctors.join(' ')}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery),
    )
  }, [departments, query])

  const activeCount = departments.filter((department) => department.status === 'Activ').length
  const totalDoctors = departments.reduce((total, department) => total + department.doctorCount, 0)
  const totalAppointments = departments.reduce((total, department) => total + department.appointmentCount, 0)

  function openCreateForm() {
    setEditingDepartment(null)
    setForm(emptyForm)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(department: Department) {
    setEditingDepartment(department)
    setForm({
      name: department.name,
      description: department.description,
      location: department.location,
      schedule: department.schedule,
      doctorCount: department.doctorCount,
      appointmentCount: department.appointmentCount,
      status: department.status,
      doctors: department.doctors.join(', '),
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nameExists = departments.some((department) =>
      department.name.toLocaleLowerCase('ro') === form.name.trim().toLocaleLowerCase('ro')
      && department.id !== editingDepartment?.id,
    )
    if (nameExists) {
      setFormError('Există deja un departament cu acest nume.')
      return
    }

    const tone: Department['tone'] = editingDepartment?.tone ?? 'green'
    const departmentData = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      schedule: form.schedule.trim(),
      doctors: form.doctors.split(',').map((doctor) => doctor.trim()).filter(Boolean),
      tone,
    }

    if (editingDepartment) {
      setDepartments((currentDepartments) => currentDepartments.map((department) =>
        department.id === editingDepartment.id
          ? { ...departmentData, id: department.id }
          : department,
      ))
    } else {
      setDepartments((currentDepartments) => [
        { ...departmentData, id: `DEP-${crypto.randomUUID()}` },
        ...currentDepartments,
      ])
    }
    setIsFormOpen(false)
  }

  function handleDelete() {
    if (!departmentToDelete) return
    setDepartments((currentDepartments) =>
      currentDepartments.filter((department) => department.id !== departmentToDelete.id),
    )
    if (expandedDepartmentId === departmentToDelete.id) setExpandedDepartmentId(null)
    setDepartmentToDelete(null)
  }

  return (
    <section className="departments-directory" aria-label="Catalogul departamentelor">
      <div className="departments-summary">
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon">✚</span>
          <span><strong>{departments.length}</strong><small>Departamente în clinică</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-green">●</span>
          <span><strong>{activeCount}</strong><small>Departamente active</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-blue">♙</span>
          <span><strong>{totalDoctors}</strong><small>Medici repartizați</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-amber">▦</span>
          <span><strong>{totalAppointments}</strong><small>Programări în evidență</small></span>
        </article>
      </div>

      <div className="departments-list-heading">
        <div>
          <h2>Departamentele clinicii</h2>
          <p>Specialități, locații și activitatea echipelor medicale.</p>
        </div>
        <button className="primary-action" type="button" onClick={openCreateForm}>
          <span aria-hidden="true">＋</span> Adaugă departament
        </button>
      </div>

      {filteredDepartments.length > 0 ? (
        <div className="departments-grid">
          {filteredDepartments.map((department) => {
            const isExpanded = expandedDepartmentId === department.id
            const statusClass = department.status === 'Activ'
              ? 'active'
              : department.status === 'Program limitat'
                ? 'limited'
                : 'setup'
            return (
              <article className="dashboard-card department-card" key={department.id}>
                <div className="department-card-top">
                  <span className={`department-icon department-icon-${department.tone}`} aria-hidden="true">✚</span>
                  <span className={`department-status department-status-${statusClass}`}><i />{department.status}</span>
                </div>
                <h3>{department.name}</h3>
                <p className="department-description">{department.description}</p>
                <div className="department-metrics">
                  <span><strong>{department.doctorCount}</strong><small>Medici</small></span>
                  <span><strong>{department.appointmentCount}</strong><small>Programări</small></span>
                </div>
                <div className="department-meta">
                  <span><i aria-hidden="true">⌖</i>{department.location}</span>
                  <span><i aria-hidden="true">◷</i>{department.schedule}</span>
                </div>
                {isExpanded && (
                  <div className="department-doctors">
                    <strong>Echipa medicală</strong>
                    {department.doctors.length > 0
                      ? <p>{department.doctors.join(' · ')}</p>
                      : <p>Nu sunt medici asociați încă.</p>}
                  </div>
                )}
                <div className="department-card-actions">
                  <button type="button" onClick={() => setExpandedDepartmentId(isExpanded ? null : department.id)}>
                    {isExpanded ? 'Ascunde detaliile' : 'Vezi echipa'} <span aria-hidden="true">{isExpanded ? '↑' : '→'}</span>
                  </button>
                  <span>
                    <button type="button" onClick={() => openEditForm(department)} aria-label={`Editează ${department.name}`}>Editează</button>
                    <button type="button" className="department-delete-action" onClick={() => setDepartmentToDelete(department)} aria-label={`Șterge ${department.name}`}>Șterge</button>
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="dashboard-card departments-empty">
          Nu am găsit departamente pentru „{query}”.
        </div>
      )}
      <p className="departments-demo-note">Date demonstrative — numărul personalului și al programărilor nu este conectat la date reale.</p>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="department-form-title">{editingDepartment ? 'Editează departamentul' : 'Adaugă departament'}</h2>
                <p>Completează informațiile demonstrative despre departament.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="patient-form-field">
                Numele departamentului
                <input required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="patient-form-field">
                Descriere
                <textarea required maxLength={240} rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="patient-form-field">
                Locație / cabinete
                <input required maxLength={120} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
              </label>
              <label className="patient-form-field">
                Program
                <input required maxLength={80} placeholder="ex. Luni–Vineri, 08:00–16:00" value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Număr medici
                  <input required type="number" min="0" max="500" value={form.doctorCount} onChange={(event) => setForm({ ...form, doctorCount: Number(event.target.value) })} />
                </label>
                <label className="patient-form-field">
                  Programări
                  <input required type="number" min="0" max="10000" value={form.appointmentCount} onChange={(event) => setForm({ ...form, appointmentCount: Number(event.target.value) })} />
                </label>
              </div>
              <label className="patient-form-field">
                Medici (separați prin virgulă)
                <input maxLength={300} placeholder="ex. Dr. Ana Pop, Dr. Mihai Stan" value={form.doctors} onChange={(event) => setForm({ ...form, doctors: event.target.value })} />
              </label>
              <label className="patient-form-field">
                Status
                <select value={form.status} onChange={(event) => {
                  if (isDepartmentStatus(event.target.value)) {
                    setForm({ ...form, status: event.target.value })
                  }
                }}>
                  <option value="Activ">Activ</option>
                  <option value="Program limitat">Program limitat</option>
                  <option value="În amenajare">În amenajare</option>
                </select>
              </label>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingDepartment ? 'Salvează modificările' : 'Adaugă departamentul'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {departmentToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDepartmentToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="department-delete-title">
            <h2 id="department-delete-title">Ștergi departamentul?</h2>
            <p><strong>{departmentToDelete.name}</strong> va fi eliminat din catalogul demonstrativ.</p>
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDepartmentToDelete(null)}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge departamentul</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
