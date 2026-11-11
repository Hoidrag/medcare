import { useMemo, useState, type FormEvent } from 'react'
import {
  createDemoAppointments,
  demoDoctors,
  demoPatients,
  getLocalDateValue,
  type DemoAppointment,
  type DemoAppointmentStatus,
  type DemoAppointmentType,
} from '../shared/demoData'

type AppointmentForm = Omit<DemoAppointment, 'id' | 'age'>
type DateFilter = 'today' | 'all'

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function isAppointmentStatus(value: string): value is DemoAppointmentStatus {
  return value === 'Confirmată' || value === 'În așteptare' || value === 'Anulată'
}

function isAppointmentType(value: string): value is DemoAppointmentType {
  return value === 'Consultație' || value === 'Control' || value === 'Investigație'
}

function getStatusClass(status: DemoAppointmentStatus) {
  if (status === 'Confirmată') return 'confirmed'
  if (status === 'Anulată') return 'cancelled'
  return 'pending'
}

const emptyForm = (): AppointmentForm => ({
  patient: '',
  doctor: demoDoctors[0].name,
  specialty: demoDoctors[0].specialty,
  date: getLocalDateValue(new Date()),
  time: '',
  type: 'Consultație',
  status: 'Confirmată',
})

type AppointmentsDirectoryProps = {
  query: string
}

export default function AppointmentsDirectory({ query }: AppointmentsDirectoryProps) {
  const [today] = useState(() => getLocalDateValue(new Date()))
  const [appointments, setAppointments] = useState(createDemoAppointments)
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [editingAppointment, setEditingAppointment] = useState<DemoAppointment | null>(null)
  const [appointmentToDelete, setAppointmentToDelete] = useState<DemoAppointment | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [statusFilter, setStatusFilter] = useState('Toate statusurile')

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return appointments
      .filter((appointment) => dateFilter === 'all' || appointment.date === today)
      .filter((appointment) => statusFilter === 'Toate statusurile' || appointment.status === statusFilter)
      .filter((appointment) =>
        !normalizedQuery
        || `${appointment.patient} ${appointment.doctor} ${appointment.specialty} ${appointment.type} ${appointment.status}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery),
      )
      .sort((first, second) => first.date.localeCompare(second.date) || first.time.localeCompare(second.time))
  }, [appointments, dateFilter, query, statusFilter, today])

  const todaysAppointments = appointments.filter((appointment) => appointment.date === today)

  function openCreateForm() {
    setEditingAppointment(null)
    setForm(emptyForm())
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(appointment: DemoAppointment) {
    setEditingAppointment(appointment)
    setForm({
      patient: appointment.patient,
      doctor: appointment.doctor,
      specialty: appointment.specialty,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  function handleDoctorChange(doctorName: string) {
    const doctor = demoDoctors.find((option) => option.name === doctorName)
    if (!doctor) return
    setForm((currentForm) => ({
      ...currentForm,
      doctor: doctor.name,
      specialty: doctor.specialty,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const patientAge = demoPatients.find((patient) => patient.name === form.patient)?.age
    if (patientAge === undefined) {
      setFormError('Selectează un pacient din lista demonstrativă.')
      return
    }

    const conflictingAppointment = appointments.find((appointment) =>
      appointment.id !== editingAppointment?.id
      && appointment.doctor === form.doctor
      && appointment.date === form.date
      && appointment.time === form.time
      && appointment.status !== 'Anulată',
    )

    if (conflictingAppointment) {
      setFormError('Medicul selectat are deja o programare la această dată și oră.')
      return
    }

    if (editingAppointment) {
      setAppointments((currentAppointments) => currentAppointments.map((appointment) =>
        appointment.id === editingAppointment.id
          ? { ...form, age: patientAge, id: appointment.id }
          : appointment,
      ))
    } else {
      setAppointments((currentAppointments) => [
        { ...form, age: patientAge, id: `PROG-${crypto.randomUUID()}` },
        ...currentAppointments,
      ])
    }
    setIsFormOpen(false)
  }

  function handleDelete() {
    if (!appointmentToDelete) return
    setAppointments((currentAppointments) =>
      currentAppointments.filter((appointment) => appointment.id !== appointmentToDelete.id),
    )
    setAppointmentToDelete(null)
  }

  function updateStatus(appointment: DemoAppointment, value: string) {
    if (!isAppointmentStatus(value)) return
    setAppointments((currentAppointments) => currentAppointments.map((item) =>
      item.id === appointment.id ? { ...item, status: value } : item,
    ))
  }

  return (
    <section className="appointments-directory" aria-label="Gestionarea programărilor">
      <div className="appointments-summary">
        <article className="dashboard-card appointment-summary-card">
          <span className="appointment-summary-icon">▦</span>
          <span><strong>{todaysAppointments.length}</strong><small>Programări astăzi</small></span>
        </article>
        <article className="dashboard-card appointment-summary-card">
          <span className="appointment-summary-icon summary-green">✓</span>
          <span><strong>{todaysAppointments.filter((appointment) => appointment.status === 'Confirmată').length}</strong><small>Confirmate</small></span>
        </article>
        <article className="dashboard-card appointment-summary-card">
          <span className="appointment-summary-icon summary-amber">◷</span>
          <span><strong>{todaysAppointments.filter((appointment) => appointment.status === 'În așteptare').length}</strong><small>În așteptare</small></span>
        </article>
      </div>

      <div className="dashboard-card appointments-directory-card">
        <div className="appointments-directory-heading">
          <div>
            <h2>Programările clinicii</h2>
            <p>Adaugă, actualizează și urmărește programările pacienților.</p>
          </div>
          <button className="primary-action" type="button" onClick={openCreateForm}>
            <span aria-hidden="true">＋</span> Adaugă programare
          </button>
        </div>

        <div className="appointments-toolbar">
          <div className="appointment-date-filter" role="group" aria-label="Filtrează programările după dată">
            <button type="button" className={dateFilter === 'today' ? 'active' : ''} onClick={() => setDateFilter('today')}>Astăzi</button>
            <button type="button" className={dateFilter === 'all' ? 'active' : ''} onClick={() => setDateFilter('all')}>Toate datele</button>
          </div>
          <label className="appointment-status-filter">
            <span className="visually-hidden">Filtrează după status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>Toate statusurile</option>
              <option>Confirmată</option>
              <option>În așteptare</option>
              <option>Anulată</option>
            </select>
          </label>
        </div>

        <div className="appointments-directory-table-scroll">
          <table className="appointments-directory-table">
            <thead>
              <tr><th>DATA ȘI ORA</th><th>PACIENT</th><th>MEDIC</th><th>TIPUL VIZITEI</th><th>STATUS</th><th><span className="visually-hidden">Acțiuni</span></th></tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td><span className="appointment-date-cell"><strong>{formatAppointmentDate(appointment.date)}</strong><small>{appointment.time}</small></span></td>
                  <td><strong className="appointment-person-name">{appointment.patient}</strong></td>
                  <td><span className="appointment-doctor-cell"><strong>{appointment.doctor}</strong><small>{appointment.specialty}</small></span></td>
                  <td>{appointment.type}</td>
                  <td>
                    <label className={`appointment-directory-status status-${getStatusClass(appointment.status)}`}>
                      <span className="visually-hidden">Status pentru {appointment.patient}</span>
                      <select value={appointment.status} onChange={(event) => updateStatus(appointment, event.target.value)}>
                        <option>Confirmată</option>
                        <option>În așteptare</option>
                        <option>Anulată</option>
                      </select>
                    </label>
                  </td>
                  <td>
                    <span className="appointment-row-actions">
                      <button type="button" onClick={() => openEditForm(appointment)} aria-label={`Editează programarea pentru ${appointment.patient}`}>Editează</button>
                      <button type="button" className="appointment-delete-action" onClick={() => setAppointmentToDelete(appointment)} aria-label={`Șterge programarea pentru ${appointment.patient}`}>Șterge</button>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredAppointments.length === 0 && (
                <tr><td className="empty-results" colSpan={6}>Nu există programări pentru filtrele selectate.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="appointments-demo-note">Date demonstrative — programările și modificările sunt temporare și nu se salvează în baza de date.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="appointment-form-title">{editingAppointment ? 'Editează programarea' : 'Adaugă programare'}</h2>
                <p>Alege pacientul, medicul și intervalul consultației.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="patient-form-field">
                Pacient
                <select required value={form.patient} onChange={(event) => setForm({ ...form, patient: event.target.value })}>
                  <option value="">Selectează pacientul</option>
                  {demoPatients.map((patient) => <option key={patient.id}>{patient.name}</option>)}
                </select>
              </label>
              <label className="patient-form-field">
                Medic
                <select required value={form.doctor} onChange={(event) => handleDoctorChange(event.target.value)}>
                  {demoDoctors.map((doctor) => <option key={doctor.name} value={doctor.name}>{doctor.name} — {doctor.specialty}</option>)}
                </select>
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Data
                  <input required type="date" min={today} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Ora
                  <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
                </label>
              </div>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Tipul vizitei
                  <select value={form.type} onChange={(event) => {
                    if (isAppointmentType(event.target.value)) {
                      setForm({ ...form, type: event.target.value })
                    }
                  }}>
                    <option>Consultație</option>
                    <option>Control</option>
                    <option>Investigație</option>
                  </select>
                </label>
                <label className="patient-form-field">
                  Status
                  <select value={form.status} onChange={(event) => {
                    if (isAppointmentStatus(event.target.value)) {
                      setForm({ ...form, status: event.target.value })
                    }
                  }}>
                    <option>Confirmată</option>
                    <option>În așteptare</option>
                    <option>Anulată</option>
                  </select>
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingAppointment ? 'Salvează modificările' : 'Adaugă programarea'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {appointmentToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAppointmentToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="appointment-delete-title">
            <h2 id="appointment-delete-title">Ștergi programarea?</h2>
            <p>Programarea pentru <strong>{appointmentToDelete.patient}</strong> din {formatAppointmentDate(appointmentToDelete.date)}, la ora {appointmentToDelete.time}, va fi eliminată din lista demonstrativă.</p>
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setAppointmentToDelete(null)}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={handleDelete}>Șterge programarea</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
