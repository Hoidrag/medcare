import { useCallback, useEffect, useState } from 'react'
import {
  getAdminActivity,
  getIntegrityReport,
  getSystemStatus,
  type AdminActivity,
  type IntegrityReport,
  type SystemStatus,
} from '../../../../services/administration'
import { formatDateForUser } from '../../../../utils/date'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Administrarea nu a putut fi încărcată.'
}

function formatActivityDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Dată indisponibilă'
  return formatDateForUser(date, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActivityDescription(event: AdminActivity) {
  const actions = {
    create: 'adăugat',
    update: 'modificat',
    delete: 'șters',
  }
  const entities = {
    patient: 'pacient',
    doctor: 'medic',
    appointment: 'programare',
    department: 'departament',
  }
  return `${entities[event.entity]} ${actions[event.action]}`
}

function requestAdministrationData() {
  return Promise.allSettled([
    getSystemStatus(),
    getIntegrityReport(),
    getAdminActivity(),
  ])
}

type AdministrationResults = Awaited<ReturnType<typeof requestAdministrationData>>

export default function AdministrationDirectory({ query }: { query: string }) {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [report, setReport] = useState<IntegrityReport | null>(null)
  const [events, setEvents] = useState<AdminActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const applyAdministrationResults = useCallback(([
    statusResult,
    reportResult,
    activityResult,
  ]: AdministrationResults) => {
    const failures: string[] = []
    if (statusResult.status === 'fulfilled') {
      setStatus(statusResult.value)
    } else {
      failures.push(getErrorMessage(statusResult.reason))
    }

    if (reportResult.status === 'fulfilled') {
      setReport(reportResult.value)
    } else {
      failures.push(getErrorMessage(reportResult.reason))
    }

    if (activityResult.status === 'fulfilled') {
      setEvents(activityResult.value)
    } else {
      failures.push(getErrorMessage(activityResult.reason))
    }

    setLoadError(failures.join(' '))
    setIsLoading(false)
  }, [])

  const loadAdministration = useCallback(async () => {
    applyAdministrationResults(await requestAdministrationData())
  }, [applyAdministrationResults])

  useEffect(() => {
    let isCurrent = true
    requestAdministrationData().then((results) => {
      if (isCurrent) applyAdministrationResults(results)
    })
    return () => {
      isCurrent = false
    }
  }, [applyAdministrationResults])

  const totals = report?.totals
  const systemOnline = status?.status === 'ok' && status.database === 'connected'
  const normalizedQuery = query.trim().toLocaleLowerCase('ro')
  const filteredEvents = events.filter((event) =>
    !normalizedQuery
    || `${getActivityDescription(event)} ${event.entityId} ${event.createdAt}`
      .toLocaleLowerCase('ro')
      .includes(normalizedQuery))
  const filteredIssues = report?.issues.filter((issue) =>
    !normalizedQuery
    || `${issue.title} ${issue.description}`.toLocaleLowerCase('ro').includes(normalizedQuery))

  return (
    <section className="administration-directory" aria-label="Centru de administrare">
      <div className="administration-toolbar">
        <p>Monitorizare read-only a bazei de date și a modificărilor înregistrate.</p>
        <button
          className="secondary-action"
          type="button"
          onClick={() => {
            setIsLoading(true)
            setLoadError('')
            void loadAdministration()
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Se verifică…' : 'Reverifică'}
          <span aria-hidden="true"> ↻</span>
        </button>
      </div>

      {loadError && (
        <div className="administration-error" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => {
            setIsLoading(true)
            setLoadError('')
            void loadAdministration()
          }} disabled={isLoading}>
            Încearcă din nou
          </button>
        </div>
      )}

      <div className="administration-system-card dashboard-card">
        <div className="administration-system-icon" aria-hidden="true">⌁</div>
        <div className="administration-system-copy">
          <span>STAREA SISTEMULUI</span>
          <strong>{status ? (systemOnline ? 'Serviciile sunt disponibile' : 'Baza de date indisponibilă') : 'Se verifică serviciile…'}</strong>
          <small>Starea conexiunii API și MongoDB</small>
        </div>
        <span className={`administration-status${systemOnline ? ' is-online' : status ? ' is-offline' : ''}`}>
          <i aria-hidden="true" />
          {systemOnline ? 'Operațional' : status ? 'Indisponibil' : 'Verificare'}
        </span>
      </div>

      <div className="administration-summary">
        <SummaryCard label="Pacienți" value={totals?.patients} />
        <SummaryCard label="Medici" value={totals?.doctors} />
        <SummaryCard label="Programări" value={totals?.appointments} />
        <SummaryCard label="Departamente" value={totals?.departments} />
      </div>

      <section className="administration-panel dashboard-card" aria-labelledby="integrity-heading">
        <div className="administration-panel-heading">
          <div>
            <h2 id="integrity-heading">Integritatea datelor</h2>
            <p>
              Verificări read-only pentru legăturile programărilor și completarea datelor de contact.
              {report && <> Ultima verificare: {formatActivityDate(report.checkedAt)}.</>}
            </p>
          </div>
        </div>
        {report ? (
          <div className="administration-issues">
            {filteredIssues?.map((issue) => (
              <article className={`administration-issue is-${issue.severity}`} key={issue.id}>
                <span className="administration-issue-icon" aria-hidden="true">
                  {issue.severity === 'ok' ? '✓' : issue.severity === 'critical' ? '!' : 'i'}
                </span>
                <div>
                  <strong>{issue.title}</strong>
                  <p>{issue.description}</p>
                </div>
                {issue.count > 0 && (
                  <span className="administration-issue-count">
                    {issue.count} {issue.count === 1 ? 'înregistrare' : 'înregistrări'}
                  </span>
                )}
              </article>
            ))}
            {filteredIssues?.length === 0 && (
              <p className="administration-empty">Nicio verificare nu corespunde căutării.</p>
            )}
          </div>
        ) : (
          <p className="administration-empty">{isLoading ? 'Se verifică integritatea…' : 'Raportul de integritate nu este disponibil.'}</p>
        )}
      </section>

      <section className="administration-panel dashboard-card" aria-labelledby="activity-heading">
        <div className="administration-panel-heading">
          <div>
            <h2 id="activity-heading">Jurnal de activitate</h2>
            <p>Ultimele 50 de acțiuni persistate pentru contul curent. Datele personale nu sunt incluse în jurnal.</p>
          </div>
          <span className="administration-event-count">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'eveniment' : 'evenimente'}
          </span>
        </div>
        {filteredEvents.length > 0 ? (
          <div className="administration-activity-list">
            {filteredEvents.map((event) => (
              <article className="administration-activity-row" key={event.id}>
                <span className={`administration-activity-mark is-${event.action}`} aria-hidden="true">
                  {event.action === 'create' ? '+' : event.action === 'update' ? '↻' : '−'}
                </span>
                <div className="administration-activity-copy">
                  <strong>{getActivityDescription(event)}</strong>
                  <small>Referință {event.entityId.slice(-6).toUpperCase()} · Contul curent</small>
                </div>
                <time dateTime={event.createdAt}>{formatActivityDate(event.createdAt)}</time>
              </article>
            ))}
          </div>
        ) : (
          <p className="administration-empty">
            {isLoading
              ? 'Se încarcă jurnalul…'
              : events.length > 0
                ? 'Nicio acțiune nu corespunde căutării.'
                : 'Nu există încă acțiuni înregistrate.'}
          </p>
        )}
        <p className="administration-footnote">
          Jurnalul urmărește modificările salvate prin API la pacienți, medici, programări și departamente.
          Datele demonstrative din Farmacie și Urgențe nu sunt persistate și nu apar aici.
        </p>
      </section>
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="administration-summary-card dashboard-card">
      <span>{label}</span>
      <strong>{value === undefined ? '—' : value}</strong>
      <small>în baza de date</small>
    </div>
  )
}
