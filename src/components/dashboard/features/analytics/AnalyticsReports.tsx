import { useMemo, useState } from 'react'
import { formatDateForUser } from '../../../../utils/date'

type AnalyticsPeriod = 'Ultimele 7 zile' | 'Ultimele 6 luni' | 'Anul acesta'

type AnalyticsRecord = {
  doctor: string
  department: string
  weeklyAppointments: number[]
  weeklyNewPatients: number[]
  weeklyCancellations: number[]
  monthlyAppointments: number[]
  monthlyNewPatients: number[]
  monthlyCancellations: number[]
  weeklyCapacity: number
  monthlyCapacity: number
}

function isAnalyticsPeriod(value: string): value is AnalyticsPeriod {
  return value === 'Ultimele 7 zile'
    || value === 'Ultimele 6 luni'
    || value === 'Anul acesta'
}

const records: AnalyticsRecord[] = [
  {
    doctor: 'Dr. Andrei Popa', department: 'Cardiologie',
    weeklyAppointments: [8, 10, 7, 11, 9, 5, 2], weeklyNewPatients: [3, 4, 2, 5, 3, 2, 1], weeklyCancellations: [1, 0, 1, 0, 1, 0, 0],
    monthlyAppointments: [44, 42, 48, 46, 51, 49, 53, 55, 51, 58, 54, 60], monthlyNewPatients: [15, 13, 16, 15, 18, 17, 19, 20, 18, 21, 19, 22], monthlyCancellations: [4, 3, 4, 3, 5, 4, 4, 5, 4, 5, 4, 4],
    weeklyCapacity: 14, monthlyCapacity: 70,
  },
  {
    doctor: 'Dr. Elena Marin', department: 'Neurologie',
    weeklyAppointments: [6, 8, 9, 7, 10, 4, 1], weeklyNewPatients: [2, 3, 4, 2, 4, 1, 0], weeklyCancellations: [0, 1, 0, 1, 0, 0, 0],
    monthlyAppointments: [36, 34, 39, 38, 42, 41, 44, 46, 43, 48, 45, 50], monthlyNewPatients: [12, 11, 14, 12, 15, 14, 16, 17, 15, 18, 16, 19], monthlyCancellations: [3, 3, 4, 3, 4, 3, 4, 4, 3, 5, 3, 4],
    weeklyCapacity: 12, monthlyCapacity: 62,
  },
  {
    doctor: 'Dr. Radu Cernat', department: 'Medicină internă',
    weeklyAppointments: [10, 9, 12, 11, 13, 6, 2], weeklyNewPatients: [4, 3, 5, 4, 5, 2, 1], weeklyCancellations: [1, 1, 0, 1, 1, 0, 0],
    monthlyAppointments: [55, 52, 59, 57, 63, 61, 66, 68, 64, 71, 68, 74], monthlyNewPatients: [19, 17, 21, 19, 23, 21, 24, 25, 23, 27, 24, 28], monthlyCancellations: [5, 4, 5, 4, 6, 5, 5, 6, 5, 6, 5, 6],
    weeklyCapacity: 16, monthlyCapacity: 82,
  },
  {
    doctor: 'Dr. Ioana Dumitru', department: 'Pediatrie',
    weeklyAppointments: [7, 8, 6, 9, 8, 5, 1], weeklyNewPatients: [3, 3, 2, 4, 3, 2, 0], weeklyCancellations: [0, 1, 0, 0, 1, 0, 0],
    monthlyAppointments: [40, 38, 43, 41, 46, 44, 48, 50, 47, 53, 49, 55], monthlyNewPatients: [14, 13, 15, 14, 17, 16, 18, 19, 17, 21, 18, 22], monthlyCancellations: [3, 3, 3, 4, 4, 3, 4, 4, 4, 5, 4, 4],
    weeklyCapacity: 13, monthlyCapacity: 68,
  },
  {
    doctor: 'Dr. Mihai Stan', department: 'Dermatologie',
    weeklyAppointments: [8, 6, 9, 8, 10, 3, 1], weeklyNewPatients: [3, 2, 4, 3, 4, 1, 0], weeklyCancellations: [1, 0, 1, 0, 1, 0, 0],
    monthlyAppointments: [38, 36, 42, 40, 45, 43, 47, 49, 46, 51, 48, 54], monthlyNewPatients: [13, 12, 15, 14, 16, 15, 17, 18, 16, 19, 17, 20], monthlyCancellations: [3, 3, 4, 3, 4, 4, 4, 5, 4, 5, 4, 5],
    weeklyCapacity: 13, monthlyCapacity: 66,
  },
  {
    doctor: 'Dr. Ana Ionescu', department: 'Endocrinologie',
    weeklyAppointments: [5, 7, 6, 8, 7, 3, 1], weeklyNewPatients: [2, 3, 2, 3, 3, 1, 0], weeklyCancellations: [0, 1, 0, 1, 0, 0, 0],
    monthlyAppointments: [31, 29, 34, 32, 37, 35, 38, 40, 37, 43, 40, 45], monthlyNewPatients: [11, 10, 12, 11, 14, 13, 14, 15, 14, 17, 15, 18], monthlyCancellations: [2, 2, 3, 2, 3, 3, 3, 3, 3, 4, 3, 3],
    weeklyCapacity: 10, monthlyCapacity: 56,
  },
]

const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec']
const weekdayNames = ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']

function getWeekDates(today: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index)
    return {
      label: weekdayNames[date.getDay()],
      date: formatDateForUser(date, { day: 'numeric', month: 'short' }),
      weekdayIndex: (date.getDay() + 6) % 7,
    }
  })
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ro-RO').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 1 }).format(value)
}

function getPeriods(period: AnalyticsPeriod, today: Date) {
  if (period === 'Ultimele 7 zile') {
    return getWeekDates(today).map((day) => ({
      label: day.label,
      detail: day.date,
      index: day.weekdayIndex,
      source: 'week' as const,
    }))
  }

  const isCalendarYear = period === 'Anul acesta'
  const visibleMonthCount = isCalendarYear ? today.getMonth() + 1 : 6
  return Array.from({ length: visibleMonthCount }, (_, index) => {
    const date = isCalendarYear
      ? new Date(today.getFullYear(), index, 1)
      : new Date(today.getFullYear(), today.getMonth() - visibleMonthCount + 1 + index, 1)
    return {
      label: monthNames[date.getMonth()],
      detail: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
      index: date.getMonth(),
      source: 'month' as const,
    }
  })
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = `\uFEFF${rows.map((row) =>
    row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
  ).join('\r\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

type AnalyticsReportsProps = {
  query: string
}

export default function AnalyticsReports({ query }: AnalyticsReportsProps) {
  const [today] = useState(() => new Date())
  const [period, setPeriod] = useState<AnalyticsPeriod>('Ultimele 6 luni')
  const [department, setDepartment] = useState('Toate departamentele')
  const [doctor, setDoctor] = useState('Toți medicii')
  const [exportNotice, setExportNotice] = useState('')

  const departments = [...new Set(records.map((record) => record.department))]
  const availableDoctors = records.filter((record) =>
    department === 'Toate departamentele' || record.department === department,
  )
  const timePeriods = getPeriods(period, today)
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ro')
    return records.filter((record) => {
      const matchesDepartment = department === 'Toate departamentele' || record.department === department
      const matchesDoctor = doctor === 'Toți medicii' || record.doctor === doctor
      const matchesQuery = !normalizedQuery
        || `${record.doctor} ${record.department}`.toLocaleLowerCase('ro').includes(normalizedQuery)
      return matchesDepartment && matchesDoctor && matchesQuery
    })
  }, [department, doctor, query])

  const chartData = timePeriods.map((timePoint) => {
    const total = filteredRecords.reduce((sum, record) => sum + (
      timePoint.source === 'week'
        ? record.weeklyAppointments[timePoint.index]
        : record.monthlyAppointments[timePoint.index]
    ), 0)
    const newPatients = filteredRecords.reduce((sum, record) => sum + (
      timePoint.source === 'week'
        ? record.weeklyNewPatients[timePoint.index]
        : record.monthlyNewPatients[timePoint.index]
    ), 0)
    const cancellations = filteredRecords.reduce((sum, record) => sum + (
      timePoint.source === 'week'
        ? record.weeklyCancellations[timePoint.index]
        : record.monthlyCancellations[timePoint.index]
    ), 0)
    return { ...timePoint, total, newPatients, cancellations }
  })

  const totalAppointments = chartData.reduce((sum, point) => sum + point.total, 0)
  const totalNewPatients = chartData.reduce((sum, point) => sum + point.newPatients, 0)
  const totalCancellations = chartData.reduce((sum, point) => sum + point.cancellations, 0)
  const capacity = filteredRecords.reduce((sum, record) =>
    sum + (period === 'Ultimele 7 zile' ? record.weeklyCapacity : record.monthlyCapacity)
      * (period === 'Ultimele 6 luni' ? 6 : period === 'Anul acesta' ? today.getMonth() + 1 : 1),
  0)
  const occupancy = capacity === 0 ? 0 : Math.min(100, (totalAppointments / capacity) * 100)
  const cancellationRate = totalAppointments === 0 ? 0 : (totalCancellations / totalAppointments) * 100
  const maximumChartValue = Math.max(1, ...chartData.map((point) => point.total))
  const appointmentPoints = chartData.map((point, index) => {
    const x = chartData.length === 1 ? 350 : (index / (chartData.length - 1)) * 700
    const y = 166 - (point.total / maximumChartValue) * 140
    return `${x},${y}`
  }).join(' ')
  const patientPoints = chartData.map((point, index) => {
    const x = chartData.length === 1 ? 350 : (index / (chartData.length - 1)) * 700
    const y = 166 - (point.newPatients / maximumChartValue) * 140
    return `${x},${y}`
  }).join(' ')
  const departmentStats = departments
    .map((name) => ({
      name,
      count: filteredRecords
        .filter((record) => record.department === name)
        .reduce((sum, record) => sum + chartData.reduce((periodTotal, point) => {
          if (point.source === 'week') {
            return periodTotal + record.weeklyAppointments[point.index]
          }
          return periodTotal + record.monthlyAppointments[point.index]
        }, 0), 0),
    }))
    .filter((stat) => stat.count > 0)
    .sort((first, second) => second.count - first.count)
  const maximumDepartmentCount = Math.max(1, ...departmentStats.map((stat) => stat.count))
  const doctorStats = filteredRecords.map((record) => {
    const appointments = chartData.reduce((sum, point) => sum + (
      point.source === 'week'
        ? record.weeklyAppointments[point.index]
        : record.monthlyAppointments[point.index]
    ), 0)
    const doctorCapacity = (period === 'Ultimele 7 zile' ? record.weeklyCapacity : record.monthlyCapacity)
      * (period === 'Ultimele 6 luni' ? 6 : period === 'Anul acesta' ? 12 : 1)
    return {
      name: record.doctor,
      department: record.department,
      appointments,
      occupancy: doctorCapacity === 0 ? 0 : Math.min(100, (appointments / doctorCapacity) * 100),
    }
  }).sort((first, second) => second.occupancy - first.occupancy)

  function handleDepartmentChange(value: string) {
    setDepartment(value)
    setDoctor('Toți medicii')
  }

  function handleExport() {
    const filename = `medcare-raport-${period.toLocaleLowerCase('ro').replaceAll(' ', '-')}.csv`
    const rows = [
      ['Raport MedCare - date demonstrative'],
      ['Perioadă', period],
      ['Departament', department],
      ['Medic', doctor],
      [],
      ['Indicator', 'Valoare'],
      ['Programări', String(totalAppointments)],
      ['Pacienți noi (agregat)', String(totalNewPatients)],
      ['Grad de ocupare (%)', formatPercent(occupancy)],
      ['Rată anulări (%)', formatPercent(cancellationRate)],
      [],
      ['Perioadă', 'Programări', 'Pacienți noi (agregat)', 'Anulări'],
      ...chartData.map((point) => [
        point.detail,
        String(point.total),
        String(point.newPatients),
        String(point.cancellations),
      ]),
    ]
    downloadCsv(filename, rows)
    setExportNotice('Raportul CSV demonstrativ a fost descărcat.')
  }

  return (
    <section className="analytics-reports" aria-label="Analize și rapoarte">
      <div className="analytics-demo-banner">
        <span aria-hidden="true">ⓘ</span>
        <p>Analiză demonstrativă. Indicatorii sunt fictivi și nu sunt conectați la date reale.</p>
        <button type="button" className="analytics-export-button" onClick={handleExport}>
          Descarcă CSV <span aria-hidden="true">↓</span>
        </button>
      </div>
      {exportNotice && <p className="dashboard-notice" role="status">{exportNotice}</p>}

      <div className="analytics-filters" aria-label="Filtre pentru rapoarte">
        <label>
          <span>Perioadă</span>
          <select value={period} onChange={(event) => {
            if (isAnalyticsPeriod(event.target.value)) setPeriod(event.target.value)
          }}>
            <option>Ultimele 7 zile</option>
            <option>Ultimele 6 luni</option>
            <option>Anul acesta</option>
          </select>
        </label>
        <label>
          <span>Departament</span>
          <select value={department} onChange={(event) => handleDepartmentChange(event.target.value)}>
            <option>Toate departamentele</option>
            {departments.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label>
          <span>Medic</span>
          <select value={doctor} onChange={(event) => setDoctor(event.target.value)}>
            <option>Toți medicii</option>
            {availableDoctors.map((record) => <option key={record.doctor}>{record.doctor}</option>)}
          </select>
        </label>
      </div>

      <div className="analytics-kpis">
        <article className="dashboard-card analytics-kpi">
          <span className="analytics-kpi-icon">▦</span>
          <span className="analytics-kpi-label">Programări</span>
          <strong>{formatNumber(totalAppointments)}</strong>
          <small>în perioada selectată</small>
        </article>
        <article className="dashboard-card analytics-kpi">
          <span className="analytics-kpi-icon kpi-blue">♙</span>
          <span className="analytics-kpi-label">Pacienți noi</span>
          <strong>{formatNumber(totalNewPatients)}</strong>
          <small>număr agregat, fără identificatori</small>
        </article>
        <article className="dashboard-card analytics-kpi">
          <span className="analytics-kpi-icon kpi-amber">◷</span>
          <span className="analytics-kpi-label">Grad de ocupare</span>
          <strong>{formatPercent(occupancy)}%</strong>
          <small>din capacitatea estimată</small>
        </article>
        <article className="dashboard-card analytics-kpi">
          <span className="analytics-kpi-icon kpi-rose">↘</span>
          <span className="analytics-kpi-label">Rată anulări</span>
          <strong>{formatPercent(cancellationRate)}%</strong>
          <small>{formatNumber(totalCancellations)} anulări în total</small>
        </article>
      </div>

      <div className="analytics-charts-grid">
        <section className="dashboard-card analytics-chart-card">
          <div className="analytics-section-heading">
            <div><h2>Evoluția activității</h2><p>Programări și pacienți noi, pe perioada selectată</p></div>
            <span className="analytics-period-badge">{period}</span>
          </div>
          {chartData.length > 0 ? (
            <div className="analytics-line-chart">
              <div className="analytics-chart-y"><span>{formatNumber(maximumChartValue)}</span><span>{formatNumber(Math.round(maximumChartValue * .66))}</span><span>{formatNumber(Math.round(maximumChartValue * .33))}</span><span>0</span></div>
              <svg viewBox="0 0 700 180" preserveAspectRatio="none" role="img" aria-label={`Evoluția programărilor și a pacienților noi pentru ${period}`}>
                <path className="chart-gridline" d="M0 25H700M0 72H700M0 119H700M0 166H700" />
                <polyline className="analytics-line appointments-line" points={appointmentPoints} />
                <polyline className="analytics-line new-patients-line" points={patientPoints} />
                {chartData.map((point, index) => {
                  const x = chartData.length === 1 ? 350 : (index / (chartData.length - 1)) * 700
                  const y = 166 - (point.total / maximumChartValue) * 140
                  return <circle className="analytics-data-point" key={`${point.label}-${index}`} cx={x} cy={y} r="3.5"><title>{point.detail}: {point.total} programări</title></circle>
                })}
              </svg>
              <div className="analytics-chart-x">
                {chartData.map((point, index) => <span key={`${point.label}-${index}`}>{point.label}</span>)}
              </div>
            </div>
          ) : (
            <div className="analytics-empty">Nu există date pentru filtrele selectate.</div>
          )}
          <div className="analytics-chart-legend">
            <span><i className="legend-appointments" />Programări</span>
            <span><i className="legend-new-patients" />Pacienți noi</span>
          </div>
        </section>

        <section className="dashboard-card analytics-chart-card">
          <div className="analytics-section-heading">
            <div><h2>Activitate pe departamente</h2><p>Programări în perioada selectată</p></div>
          </div>
          <div className="analytics-department-bars">
            {departmentStats.map((stat, index) => (
              <div className="analytics-department-row" key={stat.name}>
                <div><span>{stat.name}</span><strong>{formatNumber(stat.count)}</strong></div>
                <div className="analytics-bar-track"><span className={`analytics-bar-fill analytics-bar-${index % 4}`} style={{ width: `${(stat.count / maximumDepartmentCount) * 100}%` }} /></div>
              </div>
            ))}
            {departmentStats.length === 0 && <div className="analytics-empty">Nu există date pentru filtrele selectate.</div>}
          </div>
        </section>
      </div>

      <section className="dashboard-card analytics-doctor-card">
        <div className="analytics-section-heading">
          <div><h2>Grad de ocupare pe medic</h2><p>Raport estimativ între programări și capacitatea disponibilă</p></div>
        </div>
        <div className="analytics-doctor-list">
          {doctorStats.map((stat) => (
            <div className="analytics-doctor-row" key={stat.name}>
              <div className="analytics-doctor-name"><strong>{stat.name}</strong><small>{stat.department}</small></div>
              <div className="analytics-doctor-progress"><span><i style={{ width: `${stat.occupancy}%` }} /></span></div>
              <strong className="analytics-doctor-percent">{formatPercent(stat.occupancy)}%</strong>
              <small className="analytics-doctor-count">{stat.appointments} programări</small>
            </div>
          ))}
          {doctorStats.length === 0 && <div className="analytics-empty">Nu există date pentru filtrele selectate.</div>}
        </div>
      </section>
      <p className="analytics-privacy-note">Rapoartele afișează exclusiv date agregate și nu includ nume sau alte date identificabile ale pacienților.</p>
    </section>
  )
}
