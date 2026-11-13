import { useCallback, useEffect, useState } from 'react'
import { getAppointments, type Appointment } from '../../../../services/appointments'
import { getDepartments, type Department } from '../../../../services/departments'
import { getDoctors, type Doctor } from '../../../../services/doctors'
import { getPatients, type Patient } from '../../../../services/patients'
import { getLocalDateValue } from '../../../../utils/date'
import AppointmentsBySpecialty from './widgets/AppointmentsBySpecialty'
import AppointmentsTable from './widgets/AppointmentsTable'
import OverviewStats from './widgets/OverviewStats'
import SpecialistsPanel from './widgets/SpecialistsPanel'

type DashboardOverviewProps = {
  query: string
  onNavigate: (section: string) => void
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Datele tabloului de bord nu au putut fi încărcate.'
}

export default function DashboardOverview({ query, onNavigate }: DashboardOverviewProps) {
  const [today] = useState(() => getLocalDateValue(new Date()))
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const fetchOverviewData = useCallback(() => Promise.all([
    getAppointments(),
    getDepartments(),
    getDoctors(),
    getPatients(),
  ]), [])

  const loadOverviewData = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const [loadedAppointments, loadedDepartments, loadedDoctors, loadedPatients] = await fetchOverviewData()
      setAppointments(loadedAppointments)
      setDepartments(loadedDepartments)
      setDoctors(loadedDoctors)
      setPatients(loadedPatients)
    } catch (error) {
      setLoadError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [fetchOverviewData])

  useEffect(() => {
    let isCurrent = true
    fetchOverviewData()
      .then(([loadedAppointments, loadedDepartments, loadedDoctors, loadedPatients]) => {
        if (!isCurrent) return
        setAppointments(loadedAppointments)
        setDepartments(loadedDepartments)
        setDoctors(loadedDoctors)
        setPatients(loadedPatients)
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
  }, [fetchOverviewData])

  if (loadError) {
    return (
      <section className="dashboard-overview-error" role="alert">
        <p>{loadError}</p>
        <button type="button" onClick={() => void loadOverviewData()}>Reîncearcă</button>
      </section>
    )
  }

  return (
    <>
      <OverviewStats
        appointments={appointments}
        departments={departments}
        doctors={doctors}
        isLoading={isLoading}
        patients={patients}
        today={today}
      />
      <div className="dashboard-overview-grid">
        <AppointmentsBySpecialty appointments={appointments} isLoading={isLoading} today={today} />
        <SpecialistsPanel doctors={doctors} isLoading={isLoading} onViewAll={() => onNavigate('Medici')} />
      </div>
      <AppointmentsTable
        appointments={appointments}
        isLoading={isLoading}
        onViewAll={() => onNavigate('Programări')}
        query={query}
        today={today}
      />
    </>
  )
}
