import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  updateAppointment,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
  type AppointmentType,
} from '../../../../services/appointments'
import { getDoctors, type Doctor } from '../../../../services/doctors'
import { getPatients, type Patient } from '../../../../services/patients'

type AppointmentForm = AppointmentInput

const calendarWeekdays = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']

function getLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index)
    return {
      date: getLocalDateValue(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month.getMonth(),
    }
  })
}

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatSelectedDate(date: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${date}T12:00:00`))
}

function getAppointmentStatusClass(status: AppointmentStatus) {
  if (status === 'Confirmată') return 'confirmed'
  if (status === 'Anulată') return 'cancelled'
  return 'pending'
}

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return value === 'Confirmată' || value === 'În așteptare' || value === 'Anulată'
}

function isAppointmentType(value: string): value is AppointmentType {
  return value === 'Consultație' || value === 'Control' || value === 'Investigație'
}

const emptyForm = (): AppointmentForm => ({
  patientId: '',
  doctorId: '',
  date: getLocalDateValue(new Date()),
  time: '',
  type: 'Consultație',
  status: 'Confirmată',
})

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Solicitarea nu a putut fi finalizată.'
}

type AppointmentsDirectoryProps = {
  query: string
}

export default function AppointmentsDirectory({ query }: AppointmentsDirectoryProps) {
  const [today] = useState(() => getLocalDateValue(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedDate, setSelectedDate] = useState(today)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const currentDate = new Date(`${today}T12:00:00`)
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  })
  const [form, setForm] = useState<AppointmentForm>(emptyForm)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState('Toate statusurile')

  const fetchDirectoryData = useCallback(() => Promise.all([
    getAppointments(),
    getPatients(),
    getDoctors(),
  ]), [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const [loadedAppointments, loadedPatients, loadedDoctors] = await fetchDirectoryData()
      setAppointments(loadedAppointments)
      setPatients(loadedPatients)
      setDoctors(loadedDoctors)
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [fetchDirectoryData])

  useEffect(() => {
    let isCurrent = true
    fetchDirectoryData()
      .then(([loadedAppointments, loadedPatients, loadedDoctors]) => {
        if (!isCurrent) return
        setAppointments(loadedAppointments)
        setPatients(loadedPatients)
        setDoctors(loadedDoctors)
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
  }, [fetchDirectoryData])

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return appointments
      .filter((appointment) => statusFilter === 'Toate statusurile' || appointment.status === statusFilter)
      .filter((appointment) =>
        !normalizedQuery
        || `${appointment.patient} ${appointment.doctor} ${appointment.specialty} ${appointment.type} ${appointment.status}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery),
      )
      .sort((first, second) => first.date.localeCompare(second.date) || first.time.localeCompare(second.time))
  }, [appointments, query, statusFilter])

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth])
  const appointmentsByDate = useMemo(() => filteredAppointments.reduce<Record<string, Appointment[]>>(
    (appointmentsByDate, appointment) => {
      appointmentsByDate[appointment.date] ??= []
      appointmentsByDate[appointment.date].push(appointment)
      return appointmentsByDate
    },
    {},
  ), [filteredAppointments])
  const selectedDayAppointments = appointmentsByDate[selectedDate] ?? []
  const monthLabel = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' }).format(visibleMonth)

  function navigateMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1)
    setVisibleMonth(nextMonth)
    setSelectedDate(getLocalDateValue(nextMonth))
  }

  function showToday() {
    const currentDate = new Date(`${today}T12:00:00`)
    setVisibleMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
    setSelectedDate(today)
  }

  function openCreateForm() {
    setEditingAppointment(null)
    setForm({
      ...emptyForm(),
      patientId: patients[0]?.id ?? '',
      doctorId: doctors[0]?.id ?? '',
      date: selectedDate,
    })
    setFormError('')
    setRequestError('')
    setIsFormOpen(true)
  }

  function openEditForm(appointment: Appointment) {
    setEditingAppointment(appointment)
    setForm({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      status: appointment.status,
    })
    setFormError('')
    setRequestError('')
    setIsFormOpen(true)
  }

  function handleDoctorChange(doctorId: string) {
    setForm((currentForm) => ({ ...currentForm, doctorId }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setRequestError('')
    if (!patients.some((patient) => patient.id === form.patientId)) {
      setFormError('Selectează un pacient salvat în baza de date.')
      return
    }
    if (!doctors.some((doctor) => doctor.id === form.doctorId)) {
      setFormError('Selectează un medic salvat în baza de date.')
      return
    }

    const conflictingAppointment = appointments.find((appointment) =>
      appointment.id !== editingAppointment?.id
      && appointment.doctorId === form.doctorId
      && appointment.date === form.date
      && appointment.time === form.time
      && appointment.status !== 'Anulată',
    )

    if (conflictingAppointment) {
      setFormError('Medicul selectat are deja o programare la această dată și oră.')
      return
    }

    setIsSaving(true)
    try {
      const savedAppointment = editingAppointment
        ? await updateAppointment(editingAppointment.id, form)
        : await createAppointment(form)
      setAppointments((currentAppointments) => editingAppointment
        ? currentAppointments.map((appointment) => appointment.id === savedAppointment.id ? savedAppointment : appointment)
        : [...currentAppointments, savedAppointment])
      const appointmentDate = new Date(`${form.date}T12:00:00`)
      setVisibleMonth(new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), 1))
      setSelectedDate(form.date)
      setIsFormOpen(false)
      setEditingAppointment(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!appointmentToDelete) return
    setIsDeleting(true)
    setRequestError('')
    try {
      await deleteAppointment(appointmentToDelete.id)
      setAppointments((currentAppointments) =>
        currentAppointments.filter((appointment) => appointment.id !== appointmentToDelete.id),
      )
      setAppointmentToDelete(null)
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  async function updateStatus(appointment: Appointment, value: string) {
    if (!isAppointmentStatus(value)) return
    setUpdatingAppointmentId(appointment.id)
    setRequestError('')
    try {
      const updatedAppointment = await updateAppointment(appointment.id, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        type: appointment.type,
        status: value,
      })
      setAppointments((currentAppointments) => currentAppointments.map((item) =>
        item.id === updatedAppointment.id ? updatedAppointment : item,
      ))
    } catch (error) {
      setRequestError(getErrorMessage(error))
    } finally {
      setUpdatingAppointmentId('')
    }
  }

  return (
    <section className="appointments-directory" aria-label="Gestionarea programărilor">
      <div className="dashboard-card appointments-directory-card">
        <div className="appointments-directory-heading">
          <div>
            <h2>Programările clinicii</h2>
            <p>Adaugă, actualizează și urmărește programările pacienților.</p>
          </div>
          <button className="primary-action" type="button" onClick={openCreateForm} disabled={isLoading || Boolean(loadError)}>
            <span aria-hidden="true">＋</span> Adaugă programare
          </button>
        </div>

        {isLoading && <p className="appointments-load-state" role="status">Se încarcă programările din baza de date...</p>}
        {loadError && (
          <div className="appointments-load-state appointments-load-error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => void loadData()}>Reîncearcă</button>
          </div>
        )}
        {requestError && <p className="appointments-request-error" role="alert">{requestError}</p>}

        <div className="appointments-toolbar">
          <div className="appointment-calendar-controls" role="group" aria-label="Navighează calendarul">
            <button type="button" className="appointment-calendar-today" onClick={showToday}>Astăzi</button>
            <button type="button" className="appointment-calendar-arrow" aria-label="Luna anterioară" onClick={() => navigateMonth(-1)}>‹</button>
            <button type="button" className="appointment-calendar-arrow" aria-label="Luna următoare" onClick={() => navigateMonth(1)}>›</button>
            <h3>{monthLabel}</h3>
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

        <div className="appointments-calendar-layout">
          <div className="appointment-calendar" role="group" aria-label={`Calendarul programărilor pentru ${monthLabel}`}>
            <div className="appointment-calendar-weekdays" aria-hidden="true">
              {calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="appointment-calendar-grid">
              {calendarDays.map((day) => {
                const dayAppointments = appointmentsByDate[day.date] ?? []
                const isSelected = selectedDate === day.date
                const isToday = today === day.date

                return (
                  <button
                    className={`appointment-calendar-day${day.isCurrentMonth ? '' : ' outside-month'}${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                    type="button"
                    key={day.date}
                    aria-pressed={isSelected}
                    aria-label={`${formatAppointmentDate(day.date)}${dayAppointments.length ? `, ${dayAppointments.length} programări` : ', fără programări'}`}
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <span className="appointment-calendar-day-number">{day.day}</span>
                    <span className="appointment-calendar-events">
                      {dayAppointments.slice(0, 2).map((appointment) => (
                        <span
                          className={`appointment-calendar-event status-${getAppointmentStatusClass(appointment.status)}`}
                          key={appointment.id}
                          title={`${appointment.time} · ${appointment.patient}`}
                        >
                          <strong>{appointment.time}</strong> {appointment.patient}
                        </span>
                      ))}
                      {dayAppointments.length > 2 && (
                        <span className="appointment-calendar-more">+{dayAppointments.length - 2} altele</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="appointment-calendar-legend" aria-label="Legendă statusuri">
              <span><i className="legend-confirmed" />Confirmată</span>
              <span><i className="legend-pending" />În așteptare</span>
              <span><i className="legend-cancelled" />Anulată</span>
            </div>
          </div>

          <aside className="appointment-day-agenda" aria-label={`Programările din ${formatSelectedDate(selectedDate)}`}>
            <div className="appointment-day-agenda-heading">
              <div>
                <span>AGENDA ZILEI</span>
                <h3>{formatSelectedDate(selectedDate)}</h3>
              </div>
              <strong>{selectedDayAppointments.length}</strong>
            </div>
            <div className="appointment-day-agenda-list">
              {selectedDayAppointments.map((appointment) => (
                <article className={`appointment-agenda-card status-${getAppointmentStatusClass(appointment.status)}`} key={appointment.id}>
                  <div className="appointment-agenda-time">{appointment.time}</div>
                  <div className="appointment-agenda-details">
                    <strong>{appointment.patient}</strong>
                    <span>{appointment.doctor}</span>
                    <small>{appointment.specialty} · {appointment.type}</small>
                  </div>
                  <label className={`appointment-directory-status status-${getAppointmentStatusClass(appointment.status)}`}>
                    <span className="visually-hidden">Status pentru {appointment.patient}</span>
                    <select
                      value={appointment.status}
                      disabled={updatingAppointmentId === appointment.id}
                      onChange={(event) => void updateStatus(appointment, event.target.value)}
                    >
                      <option>Confirmată</option>
                      <option>În așteptare</option>
                      <option>Anulată</option>
                    </select>
                  </label>
                  <span className="appointment-row-actions">
                    <button type="button" onClick={() => openEditForm(appointment)} aria-label={`Editează programarea pentru ${appointment.patient}`}>Editează</button>
                    <button
                      type="button"
                      className="appointment-delete-action"
                      onClick={() => {
                        setRequestError('')
                        setAppointmentToDelete(appointment)
                      }}
                      aria-label={`Șterge programarea pentru ${appointment.patient}`}
                    >
                      Șterge
                    </button>
                  </span>
                </article>
              ))}
              {selectedDayAppointments.length === 0 && (
                <div className="appointment-agenda-empty">
                  <span aria-hidden="true">▦</span>
                  <strong>Zi fără programări</strong>
                  <p>
                    {filteredAppointments.length === 0
                      ? appointments.length === 0
                        ? 'Nu există programări salvate. Adaugă prima programare.'
                        : 'Nu există programări pentru filtrele selectate.'
                      : 'Selectează o altă zi sau adaugă o programare nouă.'}
                  </p>
                  <button type="button" onClick={openCreateForm}>＋ Adaugă programare</button>
                </div>
              )}
            </div>
          </aside>
        </div>
        <p className="appointments-demo-note">Programările și modificările sunt salvate în baza de date pentru contul autentificat.</p>
      </div>

      {isFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setIsFormOpen(false)
        }}>
          <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="appointment-form-title">{editingAppointment ? 'Editează programarea' : 'Adaugă programare'}</h2>
                <p>Alege pacientul, medicul și intervalul consultației.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsFormOpen(false)} aria-label="Închide" disabled={isSaving}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {(patients.length === 0 || doctors.length === 0) && (
                <p className="patient-form-error" role="alert">
                  Pentru a crea programări, adaugă mai întâi cel puțin un pacient și un medic în cont.
                </p>
              )}
              <label className="patient-form-field">
                Pacient
                <select required value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                  <option value="">Selectează pacientul</option>
                  {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                </select>
              </label>
              <label className="patient-form-field">
                Medic
                <select required value={form.doctorId} onChange={(event) => handleDoctorChange(event.target.value)}>
                  <option value="">Selectează medicul</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} — {doctor.specialty}</option>)}
                </select>
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Data
                  <input required type="date" min={editingAppointment ? undefined : today} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
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
              {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Anulează</button>
                <button className="primary-action" type="submit" disabled={isSaving || patients.length === 0 || doctors.length === 0}>
                  {isSaving ? 'Se salvează...' : editingAppointment ? 'Salvează modificările' : 'Adaugă programarea'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {appointmentToDelete && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isDeleting) setAppointmentToDelete(null)
        }}>
          <section className="patient-modal patient-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="appointment-delete-title">
            <h2 id="appointment-delete-title">Ștergi programarea?</h2>
            <p>Programarea pentru <strong>{appointmentToDelete.patient}</strong> din {formatAppointmentDate(appointmentToDelete.date)}, la ora {appointmentToDelete.time}, va fi eliminată din baza de date.</p>
            {requestError && <p className="patient-form-error" role="alert">{requestError}</p>}
            <div className="patient-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setAppointmentToDelete(null)} disabled={isDeleting}>Păstrează</button>
              <button className="patient-confirm-delete" type="button" onClick={() => void handleDelete()} disabled={isDeleting}>
                {isDeleting ? 'Se șterge...' : 'Șterge programarea'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
