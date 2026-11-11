import AnalyticsReports from './features/analytics/AnalyticsReports'
import AppointmentsDirectory from './features/appointments/AppointmentsDirectory'
import BillingInsurance from './features/billing/BillingInsurance'
import DepartmentsDirectory from './features/departments/DepartmentsDirectory'
import DoctorsDirectory from './features/doctors/DoctorsDirectory'
import OverviewStats from './features/overview/widgets/OverviewStats'
import AppointmentsTable from './features/overview/widgets/AppointmentsTable'
import PatientTrends from './features/overview/widgets/PatientTrends'
import SpecialistsPanel from './features/overview/widgets/SpecialistsPanel'
import PatientsDirectory from './features/patients/PatientsDirectory'

type DashboardContentProps = {
  activeItem: string
  query: string
  period: string
}

export default function DashboardContent({
  activeItem,
  query,
  period,
}: DashboardContentProps) {
  if (activeItem === 'Medici') return <DoctorsDirectory query={query} />
  if (activeItem === 'Pacienți') return <PatientsDirectory query={query} />
  if (activeItem === 'Programări') return <AppointmentsDirectory query={query} />
  if (activeItem === 'Departamente') return <DepartmentsDirectory query={query} />
  if (activeItem === 'Analize și rapoarte') return <AnalyticsReports query={query} />
  if (activeItem === 'Facturare și asigurări') return <BillingInsurance query={query} />

  return (
    <>
      <OverviewStats />
      <div className="dashboard-overview-grid">
        <PatientTrends period={period} />
        <SpecialistsPanel />
      </div>
      <AppointmentsTable query={query} />
    </>
  )
}
