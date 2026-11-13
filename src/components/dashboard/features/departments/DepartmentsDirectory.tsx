import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  type Department,
  type DepartmentInput,
  type DepartmentStatus,
} from '../../../../services/departments'

type DepartmentForm = Omit<DepartmentInput, 'doctors'> & {
  doctors: string
}

type DepartmentTone = 'green' | 'blue' | 'amber' | 'rose'

function isDepartmentStatus(value: string): value is DepartmentStatus {
  return value === 'Activ' || value === 'Program limitat' || value === 'În amenajare'
}

function getDepartmentTone(id: string): DepartmentTone {
  const tones: DepartmentTone[] = ['green', 'blue', 'amber', 'rose']
  const toneIndex = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)
    % tones.length
  return tones[toneIndex]
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Solicitarea nu a putut fi finalizată.'
}

const emptyForm = (): DepartmentForm => ({
  name: '',
  description: '',
  location: '',
  schedule: '',
  doctorCount: 0,
  appointmentCount: 0,
  status: 'Activ',
  doctors: '',
})

type DepartmentsDirectoryProps = {
  query: string
}

export default function DepartmentsDirectory({ query }: DepartmentsDirectoryProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [expandedDepartmentId, setExpandedDepartmentId] = useState<string | null>(null)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [form, setForm] = useState<DepartmentForm>(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      setDepartments(await getDepartments())
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getDepartments()
      .then((loadedDepartments) => {
        if (isCurrent) setDepartments(loadedDepartments)
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

  const filteredDepartments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    if (!normalizedQuery) return departments
    return departments.filter((department) =>
      `${department.name} ${department.description} ${department.location} ${department.status} ${department.doctors.join(' ')}`
        .toLocaleLowerCase('ro')
        .includes(normalizedQuery),
    )
  }, [departments, query])

  const statsUnavailable = isLoading || Boolean(loadError)
  const activeCount = departments.filter((department) => department.status === 'Activ').length
  const totalDoctors = departments.reduce((total, department) => total + department.doctorCount, 0)
  const totalAppointments = departments.reduce((total, department) => total + department.appointmentCount, 0)

  function openCreateForm() {
    setEditingDepartment(null)
    setForm(emptyForm())
    setFormError('')
    setRequestError('')
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
    setRequestError('')
    setIsFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setRequestError('')
    const name = form.name.trim()
    if (name.length < 2) {
      setFormError('Numele departamentului trebuie să aibă cel puțin 2 caractere.')
      return
    }

    const nameExists = departments.some((department) =>
      department.name.toLocaleLowerCase('ro') === name.toLocaleLowerCase('ro')
      && department.id !== editingDepartment?.id,
    )
    if (nameExists) {
      setFormError('Există deja un departament cu acest nume.')
      return
    }

    const departmentInput: DepartmentInput = {
      name,
      description: form.description.trim(),
      location: form.location.trim(),
      schedule: form.schedule.trim(),
      doctorCount: form.doctorCount,
      appointmentCount: form.appointmentCount,
      status: form.status,
      doctors: form.doctors.split(',').map((doctor) => doctor.trim()).filter(Boolean),
    }

    setIsSaving(true)
    try {
      const savedDepartment = editingDepartment
        ? await updateDepartment(editingDepartment.id, departmentInput)
        : await createDepartment(departmentInput)
      setDepartments((currentDepartments) => editingDepartment
        ? currentDepartments.map((department) => department.id === savedDepartment.id ? savedDepartment : department)
        : [...currentDepartments, savedDepartment])
      setIsFormOpen(false)
      setEditingDepartment(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!departmentToDelete) return
    setIsDeleting(true)
    setRequestError('')
    try {
      await deleteDepartment(departmentToDelete.id)
      setDepartments((currentDepartments) =>
        currentDepartments.filter((department) => department.id !== departmentToDelete.id),
      )
      if (expandedDepartmentId === departmentToDelete.id) setExpandedDepartmentId(null)
      setDepartmentToDelete(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="departments-directory" aria-label="Catalogul departamentelor">
      <div className="departments-summary">
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon">✚</span>
          <span><strong>{statsUnavailable ? '—' : departments.length}</strong><small>Departamente în clinică</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-green">●</span>
          <span><strong>{statsUnavailable ? '—' : activeCount}</strong><small>Departamente active</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-blue">♙</span>
          <span><strong>{statsUnavailable ? '—' : totalDoctors}</strong><small>Medici repartizați</small></span>
        </article>
        <article className="dashboard-card department-summary-card">
          <span className="department-summary-icon summary-amber">▦</span>
          <span><strong>{statsUnavailable ? '—' : totalAppointments}</strong><small>Programări în evidență</small></span>
        </article>
      </div>

      <div className="departments-list-heading">
        <div>
          <h2>Departamentele clinicii</h2>
          <p>Specialități, locații și activitatea echipelor medicale.</p>
        </div>
        <button className="primary-action" type="button" onClick={openCreateForm} disabled={isLoading || Boolean(loadError)}>
          <span aria-hidden="true">＋</span> Adaugă departament
        </button>
      </div>

      {isLoading ? (
        <p className="departments-load-state" role="status">Se încarcă departamentele din baza de date...</p>
      ) : loadError ? (
        <div className="dashboard-card departments-empty departments-load-error" role="alert">
          <p>{loadError}</p>
          <button type="button" onClick={() => void loadDepartments()}>Reîncearcă</button>
        </div>
      ) : filteredDepartments.length > 0 ? (
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
                  <span className={`department-icon department-icon-${getDepartmentTone(department.id)}`} aria-hidden="true">✚</span>
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
          {departments.length === 0
            ? 'Nu există departamente salvate. Adaugă primul departament.'
            : `Nu am găsit departamente pentru „${query}”.`}
        </div>
      )}
      {requestError && !isFormOpen && !departmentToDelete && (
        <p className="department-request-error" role="alert">{requestError}</p>
      )}
      <p className="departments-info-note">Departamentele și modificările sunt salvate în baza de date pentru contul autentificat.</p>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="department-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="department-form-title">{editingDepartment ? 'Editează departamentul' : 'Adaugă departament'}</h2>
                <p>Completează informațiile departamentului.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide" disabled={isSaving}>×</button>
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
              {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Anulează</button>
                <button className="primary-action" type="submit" disabled={isSaving}>
                  {isSaving ? 'Se salvează...' : editingDepartment ? 'Salvează modificările' : 'Adaugă departamentul'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {departmentToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setDepartmentToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="department-delete-title">
            <h2 id="department-delete-title">Ștergi departamentul?</h2>
            <p><strong>{departmentToDelete.name}</strong> va fi eliminat din catalogul salvat.</p>
            {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setDepartmentToDelete(null)} disabled={isDeleting}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? 'Se șterge...' : 'Șterge departamentul'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
