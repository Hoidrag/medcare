import AnalyticsReports from './features/analytics/AnalyticsReports'
import AppointmentsDirectory from './features/appointments/AppointmentsDirectory'
import BillingInsurance from './features/billing/BillingInsurance'
import DepartmentsDirectory from './features/departments/DepartmentsDirectory'
import DoctorsDirectory from './features/doctors/DoctorsDirectory'
import EmergencyDirectory from './features/emergency/EmergencyDirectory'
import DashboardOverview from './features/overview/DashboardOverview'
import PatientsDirectory from './features/patients/PatientsDirectory'
import PharmacyDirectory from './features/pharmacy/PharmacyDirectory'

type DashboardContentProps = {
  activeItem: string
  query: string
  onNavigate: (section: string) => void
}

export default function DashboardContent({
  activeItem,
  query,
  onNavigate,
}: DashboardContentProps) {
  if (activeItem === 'Medici') return <DoctorsDirectory query={query} />
  if (activeItem === 'Pacienți') return <PatientsDirectory query={query} />
  if (activeItem === 'Programări') return <AppointmentsDirectory query={query} />
  if (activeItem === 'Departamente') return <DepartmentsDirectory query={query} />
  if (activeItem === 'Farmacie') return <PharmacyDirectory query={query} />
  if (activeItem === 'Urgențe și internări') return <EmergencyDirectory query={query} />
  if (activeItem === 'Analize și rapoarte') return <AnalyticsReports query={query} />
  if (activeItem === 'Facturare și asigurări') return <BillingInsurance query={query} />

  return <DashboardOverview query={query} onNavigate={onNavigate} />
}
