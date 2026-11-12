export type DemoPatientStatus = 'Activ' | 'Monitorizare' | 'Externat'

export type DemoPatient = {
  id: string
  name: string
  age: number
  phone: string
  email: string
  lastVisit: string
  status: DemoPatientStatus
}

export const demoPatients: DemoPatient[] = [
  { id: 'PAC-001', name: 'Ana Ionescu', age: 34, phone: '0722 123 456', email: 'ana.ionescu@example.test', lastVisit: '10 nov. 2026', status: 'Activ' },
  { id: 'PAC-002', name: 'Mihai Georgescu', age: 52, phone: '0723 234 567', email: 'mihai.georgescu@example.test', lastVisit: '08 nov. 2026', status: 'Monitorizare' },
  { id: 'PAC-003', name: 'Ioana Stan', age: 27, phone: '0724 345 678', email: 'ioana.stan@example.test', lastVisit: '06 nov. 2026', status: 'Activ' },
  { id: 'PAC-004', name: 'Vlad Dumitrescu', age: 41, phone: '0725 456 789', email: 'vlad.dumitrescu@example.test', lastVisit: '02 nov. 2026', status: 'Activ' },
  { id: 'PAC-005', name: 'Maria Popescu', age: 63, phone: '0726 567 890', email: 'maria.popescu@example.test', lastVisit: '28 oct. 2026', status: 'Externat' },
]

export type DemoDoctor = {
  name: string
  initials: string
  specialty: string
  department: string
  experience: number
  schedule: string
  status: 'Disponibil' | 'În consultație' | 'Indisponibil'
  appointments: number
  tone: 'green' | 'blue' | 'amber' | 'rose'
}

export const demoDoctors: DemoDoctor[] = [
  { name: 'Dr. Andrei Popa', initials: 'AP', specialty: 'Cardiologie', department: 'Cardiologie', experience: 12, schedule: '08:00–16:00', status: 'Disponibil', appointments: 8, tone: 'green' },
  { name: 'Dr. Elena Marin', initials: 'EM', specialty: 'Neurologie', department: 'Neurologie', experience: 9, schedule: '09:00–17:00', status: 'În consultație', appointments: 6, tone: 'blue' },
  { name: 'Dr. Radu Cernat', initials: 'RC', specialty: 'Medicină internă', department: 'Medicină internă', experience: 15, schedule: '08:30–16:30', status: 'Disponibil', appointments: 7, tone: 'amber' },
  { name: 'Dr. Ioana Dumitru', initials: 'ID', specialty: 'Pediatrie', department: 'Pediatrie', experience: 7, schedule: '10:00–18:00', status: 'Indisponibil', appointments: 5, tone: 'rose' },
  { name: 'Dr. Mihai Stan', initials: 'MS', specialty: 'Dermatologie', department: 'Dermatologie', experience: 11, schedule: '08:00–14:00', status: 'Disponibil', appointments: 9, tone: 'blue' },
  { name: 'Dr. Ana Ionescu', initials: 'AI', specialty: 'Endocrinologie', department: 'Endocrinologie', experience: 6, schedule: '09:00–15:00', status: 'În consultație', appointments: 4, tone: 'green' },
]

export type DemoAppointmentStatus = 'Confirmată' | 'În așteptare' | 'Anulată'
export type DemoAppointmentType = 'Consultație' | 'Control' | 'Investigație'

export type DemoAppointment = {
  id: string
  date: string
  time: string
  patient: string
  age: number
  doctor: string
  specialty: string
  type: DemoAppointmentType
  status: DemoAppointmentStatus
}

export function getLocalDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDemoAppointments(date = getLocalDateValue(new Date())): DemoAppointment[] {
  return [
    { id: 'PROG-001', date, time: '09:30', patient: 'Ana Ionescu', age: 34, doctor: 'Dr. Andrei Popa', specialty: 'Cardiologie', type: 'Control', status: 'Confirmată' },
    { id: 'PROG-002', date, time: '10:15', patient: 'Mihai Georgescu', age: 52, doctor: 'Dr. Elena Marin', specialty: 'Neurologie', type: 'Consultație', status: 'În așteptare' },
    { id: 'PROG-003', date, time: '11:00', patient: 'Ioana Stan', age: 27, doctor: 'Dr. Radu Cernat', specialty: 'Medicină internă', type: 'Control', status: 'Confirmată' },
    { id: 'PROG-004', date, time: '11:45', patient: 'Vlad Dumitrescu', age: 41, doctor: 'Dr. Andrei Popa', specialty: 'Cardiologie', type: 'Consultație', status: 'Confirmată' },
    { id: 'PROG-005', date, time: '13:00', patient: 'Maria Popescu', age: 63, doctor: 'Dr. Ioana Dumitru', specialty: 'Pediatrie', type: 'Investigație', status: 'În așteptare' },
  ]
}

export function createDemoCalendarAppointments(date = getLocalDateValue(new Date())): DemoAppointment[] {
  const firstDay = new Date(`${date}T12:00:00`)
  const firstMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1)
  const appointments = createDemoAppointments(date)
  const appointmentDays = [
    { monthOffset: 0, days: [6, 21] },
    ...Array.from({ length: 5 }, (_, index) => ({
      monthOffset: index + 1,
      days: [4, 11, 18, 25],
    })),
  ]
  const visitTypes: DemoAppointmentType[] = ['Consultație', 'Control', 'Investigație']
  const statuses: DemoAppointmentStatus[] = ['Confirmată', 'În așteptare', 'Confirmată', 'Confirmată']
  const times = ['09:00', '10:30', '13:30', '15:00']
  let appointmentIndex = 0

  for (const month of appointmentDays) {
    for (const day of month.days) {
      const patient = demoPatients[(appointmentIndex + 1) % demoPatients.length]
      const doctor = demoDoctors[(appointmentIndex + 1) % demoDoctors.length]
      const appointmentDate = new Date(
        firstMonth.getFullYear(),
        firstMonth.getMonth() + month.monthOffset,
        day,
      )

      appointments.push({
        id: `PROG-CAL-${String(appointmentIndex + 1).padStart(3, '0')}`,
        date: getLocalDateValue(appointmentDate),
        time: times[appointmentIndex % times.length],
        patient: patient.name,
        age: patient.age,
        doctor: doctor.name,
        specialty: doctor.specialty,
        type: visitTypes[appointmentIndex % visitTypes.length],
        status: statuses[appointmentIndex % statuses.length],
      })
      appointmentIndex += 1
    }
  }

  return appointments
}

export const demoAppointments = createDemoAppointments()

export type DemoDepartmentStatus = 'Activ' | 'Program limitat' | 'În amenajare'

export type DemoDepartment = {
  id: string
  name: string
  description: string
  location: string
  schedule: string
  doctorCount: number
  appointmentCount: number
  status: DemoDepartmentStatus
  doctors: string[]
  tone: 'green' | 'blue' | 'amber' | 'rose'
}

export const demoDepartments: DemoDepartment[] = [
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
