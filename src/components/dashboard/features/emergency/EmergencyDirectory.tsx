import { useMemo, useState, type FormEvent } from 'react'

type EmergencyPriority = 'Critică' | 'Ridicată' | 'Moderată' | 'Scăzută'
type EmergencyStatus = 'În așteptare' | 'În evaluare' | 'Internat' | 'Transferat' | 'Încheiat'
type AdmissionStatus = 'Internat' | 'Transfer în curs' | 'Externat'
type EmergencyTab = 'Urgențe' | 'Internări'

type EmergencyCase = {
  id: string
  patient: string
  age: number
  reason: string
  priority: EmergencyPriority
  department: string
  doctor: string
  status: EmergencyStatus
  arrivalAt: string
}

type Admission = {
  id: string
  patient: string
  age: number
  department: string
  bed: string
  doctor: string
  admittedAt: string
  status: AdmissionStatus
}

type EmergencyForm = Pick<EmergencyCase, 'patient' | 'reason' | 'priority' | 'department' | 'doctor'> & {
  age: string
}

type AdmissionForm = Pick<Admission, 'patient' | 'department' | 'bed' | 'doctor'> & {
  age: string
}

type EmergencyDirectoryProps = {
  query: string
}

const departmentCapacities: Record<string, number> = {
  Cardiologie: 10,
  Neurologie: 8,
  'Medicină internă': 12,
  Pediatrie: 8,
  Dermatologie: 6,
  Endocrinologie: 6,
}

const departmentNames = Object.keys(departmentCapacities)

const initialCases: EmergencyCase[] = [
  {
    id: 'urg-001',
    patient: 'Mihai Rusu',
    age: 64,
    reason: 'Durere toracică',
    priority: 'Ridicată',
    department: 'Cardiologie',
    doctor: 'Dr. Andrei Popa',
    status: 'În evaluare',
    arrivalAt: new Date(Date.now() - 24 * 60_000).toISOString(),
  },
  {
    id: 'urg-002',
    patient: 'Elena Dobre',
    age: 38,
    reason: 'Migrenă severă',
    priority: 'Moderată',
    department: 'Neurologie',
    doctor: 'Dr. Elena Marin',
    status: 'În așteptare',
    arrivalAt: new Date(Date.now() - 51 * 60_000).toISOString(),
  },
  {
    id: 'urg-003',
    patient: 'Andrei Ilie',
    age: 12,
    reason: 'Febră persistentă',
    priority: 'Moderată',
    department: 'Pediatrie',
    doctor: 'Dr. Ioana Dumitru',
    status: 'În așteptare',
    arrivalAt: new Date(Date.now() - 78 * 60_000).toISOString(),
  },
  {
    id: 'urg-004',
    patient: 'Maria Pavel',
    age: 72,
    reason: 'Amețeală și stare de slăbiciune',
    priority: 'Scăzută',
    department: 'Medicină internă',
    doctor: 'Dr. Radu Cernat',
    status: 'Transferat',
    arrivalAt: new Date(Date.now() - 132 * 60_000).toISOString(),
  },
]

const initialAdmissions: Admission[] = [
  {
    id: 'int-001',
    patient: 'Ana Marinescu',
    age: 57,
    department: 'Cardiologie',
    bed: 'C-04',
    doctor: 'Dr. Andrei Popa',
    admittedAt: new Date(Date.now() - 5 * 60 * 60_000).toISOString(),
    status: 'Internat',
  },
  {
    id: 'int-002',
    patient: 'Victor Enache',
    age: 46,
    department: 'Neurologie',
    bed: 'N-02',
    doctor: 'Dr. Elena Marin',
    admittedAt: new Date(Date.now() - 19 * 60 * 60_000).toISOString(),
    status: 'Internat',
  },
  {
    id: 'int-003',
    patient: 'Ioana Munteanu',
    age: 31,
    department: 'Medicină internă',
    bed: 'M-08',
    doctor: 'Dr. Radu Cernat',
    admittedAt: new Date(Date.now() - 31 * 60 * 60_000).toISOString(),
    status: 'Transfer în curs',
  },
  {
    id: 'int-004',
    patient: 'Sofia Stan',
    age: 8,
    department: 'Pediatrie',
    bed: 'P-03',
    doctor: 'Dr. Ioana Dumitru',
    admittedAt: new Date(Date.now() - 44 * 60 * 60_000).toISOString(),
    status: 'Internat',
  },
  {
    id: 'int-005',
    patient: 'Paul Neagu',
    age: 69,
    department: 'Medicină internă',
    bed: 'M-11',
    doctor: 'Dr. Radu Cernat',
    admittedAt: new Date(Date.now() - 57 * 60 * 60_000).toISOString(),
    status: 'Internat',
  },
  {
    id: 'int-006',
    patient: 'Daria Pop',
    age: 25,
    department: 'Cardiologie',
    bed: 'C-07',
    doctor: 'Dr. Andrei Popa',
    admittedAt: new Date(Date.now() - 70 * 60 * 60_000).toISOString(),
    status: 'Transfer în curs',
  },
  {
    id: 'int-007',
    patient: 'George Dumitru',
    age: 81,
    department: 'Neurologie',
    bed: '—',
    doctor: 'Dr. Elena Marin',
    admittedAt: new Date(Date.now() - 120 * 60 * 60_000).toISOString(),
    status: 'Externat',
  },
]

const emptyEmergencyForm = (): EmergencyForm => ({
  patient: '',
  age: '',
  reason: '',
  priority: 'Moderată',
  department: departmentNames[0] ?? '',
  doctor: '',
})

const emptyAdmissionForm = (): AdmissionForm => ({
  patient: '',
  age: '',
  department: departmentNames[0] ?? '',
  bed: '',
  doctor: '',
})

function isPriority(value: string): value is EmergencyPriority {
  return value === 'Critică' || value === 'Ridicată' || value === 'Moderată' || value === 'Scăzută'
}

function getPriorityClass(priority: EmergencyPriority) {
  if (priority === 'Critică') return 'critical'
  if (priority === 'Ridicată') return 'high'
  if (priority === 'Moderată') return 'medium'
  return 'low'
}

function isEmergencyStatus(value: string): value is EmergencyStatus {
  return value === 'În așteptare'
    || value === 'În evaluare'
    || value === 'Internat'
    || value === 'Transferat'
    || value === 'Încheiat'
}

function isAdmissionStatus(value: string): value is AdmissionStatus {
  return value === 'Internat' || value === 'Transfer în curs' || value === 'Externat'
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getWaitingTime(arrivalAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(arrivalAt).getTime()) / 60_000))
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours > 0 ? `${hours} h ${remainingMinutes} min` : `${minutes} min`
}

function getActiveCases(cases: EmergencyCase[]) {
  return cases.filter((emergencyCase) =>
    emergencyCase.status !== 'Internat'
    && emergencyCase.status !== 'Transferat'
    && emergencyCase.status !== 'Încheiat',
  )
}

function getActiveAdmissions(admissions: Admission[]) {
  return admissions.filter((admission) => admission.status !== 'Externat')
}

export default function EmergencyDirectory({ query }: EmergencyDirectoryProps) {
  const [activeTab, setActiveTab] = useState<EmergencyTab>('Urgențe')
  const [emergencyCases, setEmergencyCases] = useState(initialCases)
  const [admissions, setAdmissions] = useState(initialAdmissions)
  const [caseFilter, setCaseFilter] = useState('Toate cazurile')
  const [admissionFilter, setAdmissionFilter] = useState('Toate internările')
  const [caseForm, setCaseForm] = useState<EmergencyForm>(emptyEmergencyForm)
  const [admissionForm, setAdmissionForm] = useState<AdmissionForm>(emptyAdmissionForm)
  const [editingCase, setEditingCase] = useState<EmergencyCase | null>(null)
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null)
  const [caseForAdmission, setCaseForAdmission] = useState<EmergencyCase | null>(null)
  const [isCaseFormOpen, setIsCaseFormOpen] = useState(false)
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const activeCases = getActiveCases(emergencyCases)
  const activeAdmissions = getActiveAdmissions(admissions)
  const totalBeds = Object.values(departmentCapacities).reduce((total, capacity) => total + capacity, 0)
  const waitingCount = activeCases.filter((emergencyCase) => emergencyCase.status === 'În așteptare').length

  const filteredCases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return emergencyCases
      .filter((emergencyCase) => caseFilter === 'Toate cazurile' || emergencyCase.status === caseFilter)
      .filter((emergencyCase) =>
        !normalizedQuery
        || `${emergencyCase.patient} ${emergencyCase.reason} ${emergencyCase.department} ${emergencyCase.doctor} ${emergencyCase.priority}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery),
      )
      .sort((first, second) => first.arrivalAt.localeCompare(second.arrivalAt))
  }, [caseFilter, emergencyCases, query])

  const filteredAdmissions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return admissions
      .filter((admission) => admissionFilter === 'Toate internările' || admission.status === admissionFilter)
      .filter((admission) =>
        !normalizedQuery
        || `${admission.patient} ${admission.department} ${admission.bed} ${admission.doctor} ${admission.status}`
          .toLocaleLowerCase('ro')
          .includes(normalizedQuery),
      )
      .sort((first, second) => second.admittedAt.localeCompare(first.admittedAt))
  }, [admissionFilter, admissions, query])

  function openCreateCaseForm() {
    setEditingCase(null)
    setCaseForm(emptyEmergencyForm())
    setFormError('')
    setIsCaseFormOpen(true)
  }

  function openEditCaseForm(emergencyCase: EmergencyCase) {
    setEditingCase(emergencyCase)
    setCaseForm({
      patient: emergencyCase.patient,
      age: String(emergencyCase.age),
      reason: emergencyCase.reason,
      priority: emergencyCase.priority,
      department: emergencyCase.department,
      doctor: emergencyCase.doctor,
    })
    setFormError('')
    setIsCaseFormOpen(true)
  }

  function handleCaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const age = Number(caseForm.age)
    if (!caseForm.patient.trim() || !caseForm.reason.trim() || !Number.isInteger(age) || age < 0 || age > 125) {
      setFormError('Completează numele, motivul prezentării și o vârstă validă.')
      return
    }

    if (editingCase) {
      setEmergencyCases((currentCases) => currentCases.map((emergencyCase) =>
        emergencyCase.id === editingCase.id
          ? {
            ...emergencyCase,
            ...caseForm,
            patient: caseForm.patient.trim(),
            reason: caseForm.reason.trim(),
            doctor: caseForm.doctor.trim(),
            age,
          }
          : emergencyCase,
      ))
    } else {
      setEmergencyCases((currentCases) => [{
        id: `urg-${crypto.randomUUID()}`,
        patient: caseForm.patient.trim(),
        age,
        reason: caseForm.reason.trim(),
        priority: caseForm.priority,
        department: caseForm.department,
        doctor: caseForm.doctor.trim(),
        status: 'În așteptare',
        arrivalAt: new Date().toISOString(),
      }, ...currentCases])
    }
    setIsCaseFormOpen(false)
    setEditingCase(null)
  }

  function updateCaseStatus(id: string, value: string) {
    if (!isEmergencyStatus(value)) return
    setEmergencyCases((currentCases) => currentCases.map((emergencyCase) =>
      emergencyCase.id === id ? { ...emergencyCase, status: value } : emergencyCase,
    ))
  }

  function openCreateAdmissionForm(emergencyCase?: EmergencyCase) {
    setEditingAdmission(null)
    setCaseForAdmission(emergencyCase ?? null)
    setAdmissionForm(emergencyCase
      ? {
        patient: emergencyCase.patient,
        age: String(emergencyCase.age),
        department: emergencyCase.department,
        bed: '',
        doctor: emergencyCase.doctor,
      }
      : emptyAdmissionForm())
    setFormError('')
    setIsAdmissionFormOpen(true)
  }

  function openEditAdmissionForm(admission: Admission) {
    setEditingAdmission(admission)
    setCaseForAdmission(null)
    setAdmissionForm({
      patient: admission.patient,
      age: String(admission.age),
      department: admission.department,
      bed: admission.bed === '—' ? '' : admission.bed,
      doctor: admission.doctor,
    })
    setFormError('')
    setIsAdmissionFormOpen(true)
  }

  function handleAdmissionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const age = Number(admissionForm.age)
    if (
      !admissionForm.patient.trim()
      || !admissionForm.bed.trim()
      || !admissionForm.doctor.trim()
      || !Number.isInteger(age)
      || age < 0
      || age > 125
    ) {
      setFormError('Completează pacientul, patul, medicul responsabil și o vârstă validă.')
      return
    }

    const activeAdmissionBeingEdited = editingAdmission?.status !== 'Externat'
    if (!editingAdmission || activeAdmissionBeingEdited) {
      const targetCapacity = departmentCapacities[admissionForm.department] ?? 0
      const occupiedInDepartment = activeAdmissions.filter((admission) =>
        admission.department === admissionForm.department
        && admission.id !== editingAdmission?.id,
      ).length
      if (occupiedInDepartment >= targetCapacity) {
        setFormError('Nu mai sunt paturi disponibile în departamentul selectat.')
        return
      }
      const bedAlreadyOccupied = activeAdmissions.some((admission) =>
        admission.department === admissionForm.department
        && admission.bed.toLocaleLowerCase('ro') === admissionForm.bed.trim().toLocaleLowerCase('ro')
        && admission.id !== editingAdmission?.id,
      )
      if (bedAlreadyOccupied) {
        setFormError('Patul selectat este deja ocupat în acest departament.')
        return
      }
    }

    if (editingAdmission) {
      setAdmissions((currentAdmissions) => currentAdmissions.map((admission) =>
        admission.id === editingAdmission.id
          ? {
            ...admission,
            ...admissionForm,
            patient: admissionForm.patient.trim(),
            bed: admissionForm.bed.trim(),
            doctor: admissionForm.doctor.trim(),
            age,
          }
          : admission,
      ))
    } else {
      setAdmissions((currentAdmissions) => [{
        id: `int-${crypto.randomUUID()}`,
        patient: admissionForm.patient.trim(),
        age,
        department: admissionForm.department,
        bed: admissionForm.bed.trim(),
        doctor: admissionForm.doctor.trim(),
        admittedAt: new Date().toISOString(),
        status: 'Internat',
      }, ...currentAdmissions])
      if (caseForAdmission) {
        setEmergencyCases((currentCases) => currentCases.map((emergencyCase) =>
          emergencyCase.id === caseForAdmission.id
            ? { ...emergencyCase, status: 'Internat' }
            : emergencyCase,
        ))
      }
    }
    setIsAdmissionFormOpen(false)
    setEditingAdmission(null)
    setCaseForAdmission(null)
  }

  function updateAdmissionStatus(id: string, value: string) {
    if (!isAdmissionStatus(value)) return
    setAdmissions((currentAdmissions) => currentAdmissions.map((admission) =>
      admission.id === id ? { ...admission, status: value } : admission,
    ))
  }

  function getOccupiedBeds(department: string) {
    return activeAdmissions.filter((admission) => admission.department === department).length
  }

  return (
    <section className="emergency-directory" aria-label="Urgențe și internări">
      <div className="emergency-demo-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>Prototip demonstrativ: datele și modificările sunt temporare. Prioritatea este consemnată de personal, nu calculată automat.</p>
      </div>

      <div className="emergency-summary">
        <article className="dashboard-card emergency-summary-card">
          <span className="emergency-summary-icon">✚</span>
          <span><strong>{activeCases.length}</strong><small>Cazuri active</small></span>
        </article>
        <article className="dashboard-card emergency-summary-card">
          <span className="emergency-summary-icon summary-amber">◷</span>
          <span><strong>{waitingCount}</strong><small>În așteptare</small></span>
        </article>
        <article className="dashboard-card emergency-summary-card">
          <span className="emergency-summary-icon summary-blue">▦</span>
          <span><strong>{activeAdmissions.length}</strong><small>Pacienți internați</small></span>
        </article>
        <article className="dashboard-card emergency-summary-card">
          <span className="emergency-summary-icon summary-green">⌂</span>
          <span><strong>{totalBeds - activeAdmissions.length}</strong><small>Paturi disponibile · {totalBeds} total</small></span>
        </article>
      </div>

      <div className="emergency-tabs" role="tablist" aria-label="Urgențe și internări">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'Urgențe'}
          className={activeTab === 'Urgențe' ? 'active' : ''}
          onClick={() => setActiveTab('Urgențe')}
        >
          Urgențe <span>{activeCases.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'Internări'}
          className={activeTab === 'Internări' ? 'active' : ''}
          onClick={() => setActiveTab('Internări')}
        >
          Internări <span>{activeAdmissions.length}</span>
        </button>
      </div>

      {activeTab === 'Urgențe' ? (
        <section className="dashboard-card emergency-workspace" role="tabpanel">
          <div className="emergency-workspace-heading">
            <div>
              <h2>Cazuri de urgență</h2>
              <p>Înregistrează sosirea și urmărește starea cazurilor active.</p>
            </div>
            <button className="primary-action" type="button" onClick={openCreateCaseForm}>
              <span aria-hidden="true">＋</span> Înregistrează caz
            </button>
          </div>
          <div className="emergency-toolbar">
            <span>{filteredCases.length} cazuri afișate</span>
            <label>
              <span className="visually-hidden">Filtrează cazurile</span>
              <select value={caseFilter} onChange={(event) => setCaseFilter(event.target.value)}>
                <option>Toate cazurile</option>
                <option>În așteptare</option>
                <option>În evaluare</option>
                <option>Internat</option>
                <option>Transferat</option>
                <option>Încheiat</option>
              </select>
            </label>
          </div>
          <div className="emergency-table-scroll">
            <table className="emergency-table">
              <thead>
                <tr><th>SOSIRE</th><th>PACIENT</th><th>MOTIVUL PREZENTĂRII</th><th>PRIORITATE</th><th>AȘTEPTARE</th><th>STARE</th><th><span className="visually-hidden">Acțiuni</span></th></tr>
              </thead>
              <tbody>
                {filteredCases.map((emergencyCase) => (
                  <tr key={emergencyCase.id}>
                    <td>{formatTime(emergencyCase.arrivalAt)}</td>
                    <td>
                      <span className="emergency-patient-cell">
                        <strong>{emergencyCase.patient}</strong>
                        <small>{emergencyCase.age} ani · {emergencyCase.department}</small>
                      </span>
                    </td>
                    <td>{emergencyCase.reason}</td>
                    <td><span className={`emergency-priority emergency-priority-${getPriorityClass(emergencyCase.priority)}`}>{emergencyCase.priority}</span></td>
                    <td>{getWaitingTime(emergencyCase.arrivalAt)}</td>
                    <td>
                      <select
                        className={`emergency-case-status emergency-case-status-${emergencyCase.status === 'Încheiat' ? 'closed' : emergencyCase.status === 'Transferat' || emergencyCase.status === 'Internat' ? 'resolved' : emergencyCase.status === 'În evaluare' ? 'review' : 'waiting'}`}
                        aria-label={`Starea cazului pentru ${emergencyCase.patient}`}
                        value={emergencyCase.status}
                        onChange={(event) => {
                          if (event.target.value === 'Internat') {
                            openCreateAdmissionForm(emergencyCase)
                          } else {
                            updateCaseStatus(emergencyCase.id, event.target.value)
                          }
                        }}
                      >
                        <option>În așteptare</option>
                        <option>În evaluare</option>
                        <option>Internat</option>
                        <option>Transferat</option>
                        <option>Încheiat</option>
                      </select>
                    </td>
                    <td><button className="emergency-edit-button" type="button" onClick={() => openEditCaseForm(emergencyCase)}>Detalii</button></td>
                  </tr>
                ))}
                {filteredCases.length === 0 && (
                  <tr><td className="emergency-empty-cell" colSpan={7}>Nu există cazuri pentru filtrele selectate.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="emergency-workspace-note">Ora de așteptare este calculată de la ora sosirii înregistrată.</p>
        </section>
      ) : (
        <section className="emergency-workspace" role="tabpanel">
          <div className="dashboard-card emergency-workspace-card">
            <div className="emergency-workspace-heading">
              <div>
                <h2>Pacienți internați</h2>
                <p>Urmărește secția, patul și starea internării.</p>
              </div>
              <button className="primary-action" type="button" onClick={() => openCreateAdmissionForm()}>
                <span aria-hidden="true">＋</span> Înregistrează internare
              </button>
            </div>
            <div className="emergency-toolbar">
              <span>{filteredAdmissions.length} înregistrări afișate</span>
              <label>
                <span className="visually-hidden">Filtrează internările</span>
                <select value={admissionFilter} onChange={(event) => setAdmissionFilter(event.target.value)}>
                  <option>Toate internările</option>
                  <option>Internat</option>
                  <option>Transfer în curs</option>
                  <option>Externat</option>
                </select>
              </label>
            </div>
            <div className="emergency-table-scroll">
              <table className="emergency-table admission-table">
                <thead>
                  <tr><th>PACIENT</th><th>SECȚIE / PAT</th><th>MEDIC RESPONSABIL</th><th>INTERNAT LA</th><th>STARE</th><th><span className="visually-hidden">Acțiuni</span></th></tr>
                </thead>
                <tbody>
                  {filteredAdmissions.map((admission) => (
                    <tr key={admission.id}>
                      <td><span className="emergency-patient-cell"><strong>{admission.patient}</strong><small>{admission.age} ani</small></span></td>
                      <td><span className="emergency-ward-cell"><strong>{admission.department}</strong><small>Pat {admission.bed}</small></span></td>
                      <td>{admission.doctor}</td>
                      <td>{formatDateTime(admission.admittedAt)}</td>
                      <td>
                        <select
                          className={`admission-status admission-status-${admission.status === 'Externat' ? 'discharged' : admission.status === 'Transfer în curs' ? 'transfer' : 'active'}`}
                          aria-label={`Starea internării pentru ${admission.patient}`}
                          value={admission.status}
                          disabled={admission.status === 'Externat'}
                          onChange={(event) => updateAdmissionStatus(admission.id, event.target.value)}
                        >
                          <option>Internat</option>
                          <option>Transfer în curs</option>
                          <option>Externat</option>
                        </select>
                      </td>
                      <td>
                        <span className="admission-row-actions">
                          <button type="button" onClick={() => openEditAdmissionForm(admission)}>Editează</button>
                          {admission.status !== 'Externat' && (
                            <button type="button" className="admission-discharge-button" onClick={() => updateAdmissionStatus(admission.id, 'Externat')}>Externează</button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAdmissions.length === 0 && (
                    <tr><td className="emergency-empty-cell" colSpan={6}>Nu există internări pentru filtrele selectate.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-card emergency-ward-card">
            <div className="emergency-workspace-heading">
              <div><h2>Ocuparea paturilor</h2><p>Numărul internărilor active raportat la capacitatea demonstrativă.</p></div>
              <strong>{activeAdmissions.length} / {totalBeds}</strong>
            </div>
            <div className="emergency-ward-grid">
              {departmentNames.map((department) => {
                const capacity = departmentCapacities[department] ?? 0
                const occupied = getOccupiedBeds(department)
                return (
                  <article className="emergency-ward-item" key={department}>
                    <div><strong>{department}</strong><span>{occupied} / {capacity} paturi</span></div>
                    <div className="emergency-ward-track"><span style={{ width: `${capacity > 0 ? Math.min(100, (occupied / capacity) * 100) : 0}%` }} /></div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {isCaseFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsCaseFormOpen(false)
        }}>
          <section className="patient-modal emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emergency-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="emergency-form-title">{editingCase ? 'Editează cazul' : 'Înregistrează caz de urgență'}</h2>
                <p>Prioritatea și informațiile sunt introduse de personal.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsCaseFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleCaseSubmit}>
              <label className="patient-form-field">
                Nume pacient
                <input required maxLength={100} value={caseForm.patient} onChange={(event) => setCaseForm({ ...caseForm, patient: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Vârstă
                  <input required type="number" min="0" max="125" value={caseForm.age} onChange={(event) => setCaseForm({ ...caseForm, age: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Prioritate consemnată
                  <select value={caseForm.priority} onChange={(event) => {
                    if (isPriority(event.target.value)) setCaseForm({ ...caseForm, priority: event.target.value })
                  }}>
                    <option>Critică</option>
                    <option>Ridicată</option>
                    <option>Moderată</option>
                    <option>Scăzută</option>
                  </select>
                </label>
              </div>
              <label className="patient-form-field">
                Motivul prezentării
                <input required maxLength={160} value={caseForm.reason} onChange={(event) => setCaseForm({ ...caseForm, reason: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Departament
                  <select value={caseForm.department} onChange={(event) => setCaseForm({ ...caseForm, department: event.target.value })}>
                    {departmentNames.map((department) => <option key={department}>{department}</option>)}
                  </select>
                </label>
                <label className="patient-form-field">
                  Medic responsabil
                  <input maxLength={100} value={caseForm.doctor} onChange={(event) => setCaseForm({ ...caseForm, doctor: event.target.value })} />
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsCaseFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingCase ? 'Salvează modificările' : 'Înregistrează cazul'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isAdmissionFormOpen && (
        <div className="patient-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsAdmissionFormOpen(false)
        }}>
          <section className="patient-modal emergency-modal" role="dialog" aria-modal="true" aria-labelledby="admission-form-title">
            <div className="patient-modal-heading">
              <div>
                <h2 id="admission-form-title">{editingAdmission ? 'Editează internarea' : 'Înregistrează internare'}</h2>
                <p>Completează secția, patul și medicul responsabil.</p>
              </div>
              <button type="button" className="patient-modal-close" onClick={() => setIsAdmissionFormOpen(false)} aria-label="Închide">×</button>
            </div>
            <form onSubmit={handleAdmissionSubmit}>
              <label className="patient-form-field">
                Nume pacient
                <input required maxLength={100} value={admissionForm.patient} onChange={(event) => setAdmissionForm({ ...admissionForm, patient: event.target.value })} />
              </label>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Vârstă
                  <input required type="number" min="0" max="125" value={admissionForm.age} onChange={(event) => setAdmissionForm({ ...admissionForm, age: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Departament
                  <select value={admissionForm.department} onChange={(event) => setAdmissionForm({ ...admissionForm, department: event.target.value })}>
                    {departmentNames.map((department) => <option key={department}>{department}</option>)}
                  </select>
                </label>
              </div>
              <div className="patient-form-grid">
                <label className="patient-form-field">
                  Pat
                  <input required maxLength={20} placeholder="ex. C-04" value={admissionForm.bed} onChange={(event) => setAdmissionForm({ ...admissionForm, bed: event.target.value })} />
                </label>
                <label className="patient-form-field">
                  Medic responsabil
                  <input required maxLength={100} value={admissionForm.doctor} onChange={(event) => setAdmissionForm({ ...admissionForm, doctor: event.target.value })} />
                </label>
              </div>
              {formError && <p className="patient-form-error" role="alert">{formError}</p>}
              <div className="patient-modal-actions">
                <button className="secondary-action" type="button" onClick={() => setIsAdmissionFormOpen(false)}>Anulează</button>
                <button className="primary-action" type="submit">{editingAdmission ? 'Salvează modificările' : 'Adaugă internarea'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
