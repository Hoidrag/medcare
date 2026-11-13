import { useCallback, useEffect, useState } from 'react'
import type { AuthUser } from '../../services/auth'
import { getSettings, type ClinicSettings } from '../../services/settings'
import { getAppointments } from '../../services/appointments'
import { getDepartments } from '../../services/departments'
import { getDoctors } from '../../services/doctors'
import { getPatients } from '../../services/patients'
import DashboardContent from './DashboardContent'
import { downloadDashboardCsv, downloadDashboardHtml } from './dashboardReport'
import DashboardSidebar from './layout/DashboardSidebar'
import './styles/dashboard.css'

function formatCurrentDate(dateFormat: ClinicSettings['preferences']['dateFormat']) {
  const date = new Date()
  if (dateFormat === 'dd.MM.yyyy' || dateFormat === 'dd/MM/yyyy') {
    const separator = dateFormat === 'dd.MM.yyyy' ? '.' : '/'
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${day}${separator}${month}${separator}${date.getFullYear()}`
  }

  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(date)
    .toLocaleUpperCase('ro-RO')
}

type DashboardPageProps = {
  user: AuthUser
  onUserUpdated: (user: AuthUser) => void
  onLogout: () => Promise<void>
}

export default function DashboardPage({ user, onUserUpdated, onLogout }: DashboardPageProps) {
  const [theme, setTheme] = useState<ClinicSettings['preferences']['theme']>('light')
  const [dateFormat, setDateFormat] = useState<ClinicSettings['preferences']['dateFormat']>('long')
  const [clinicName, setClinicName] = useState('')
  const [activeItem, setActiveItem] = useState('Tablou de bord')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [reportAction, setReportAction] = useState<'csv' | 'html' | null>(null)

  const handleDateFormatChange = useCallback((format: ClinicSettings['preferences']['dateFormat']) => {
    document.documentElement.dataset.dateFormat = format
    setDateFormat(format)
  }, [])

  useEffect(() => {
    let isCurrent = true
    document.documentElement.dataset.dateFormat = 'long'
    getSettings()
      .then((settings) => {
        if (!isCurrent) return
        setTheme(settings.preferences.theme)
        setClinicName(settings.clinicProfile.name)
        handleDateFormatChange(settings.preferences.dateFormat)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice(error instanceof Error
            ? `Preferințele nu au putut fi încărcate: ${error.message}`
            : 'Preferințele nu au putut fi încărcate.')
        }
      })
    return () => {
      isCurrent = false
      delete document.documentElement.dataset.dateFormat
    }
  }, [handleDateFormatChange])

  const currentDate = formatCurrentDate(dateFormat)
  const heading =
    activeItem === 'Tablou de bord' ? `Bun venit, ${user.name}!` : activeItem

  function handleSelectItem(item: string) {
    setActiveItem(item)
    if (item !== 'Tablou de bord' && item !== 'Medici' && item !== 'Pacienți' && item !== 'Programări' && item !== 'Departamente' && item !== 'Farmacie' && item !== 'Urgențe și internări' && item !== 'Analize și rapoarte' && item !== 'Facturare și asigurări' && item !== 'Setări') {
      setNotice(`Secțiunea „${item}” va fi disponibilă după autentificare.`)
    } else {
      setNotice('')
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Nu am putut încheia sesiunea.',
      )
    } finally {
      setIsLoggingOut(false)
    }
  }

  async function handleReportAction(format: 'csv' | 'html') {
    setNotice('')
    setReportAction(format)
    try {
      const [appointments, departments, doctors, patients] = await Promise.all([
        getAppointments(),
        getDepartments(),
        getDoctors(),
        getPatients(),
      ])
      const reportOptions = {
        appointments,
        departments,
        doctors,
        patients,
        generatedAt: new Date(),
        generatedBy: user.name,
      }

      if (format === 'csv') {
        downloadDashboardCsv(reportOptions)
        setNotice('Raportul CSV cu datele actuale ale clinicii a fost descărcat.')
      } else {
        downloadDashboardHtml(reportOptions)
        setNotice('Raportul HTML a fost descărcat. Îl poți deschide și imprima sau salva ca PDF.')
      }
    } catch (error) {
      setNotice(error instanceof Error
        ? error.message
        : 'Raportul nu a putut fi generat. Încearcă din nou.')
    } finally {
      setReportAction(null)
    }
  }

  return (
    <main className="dashboard-page" data-theme={theme}>
      <DashboardSidebar
        activeItem={activeItem}
        userName={user.name}
        onSelect={handleSelectItem}
        onLogout={handleLogout}
      />
      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <label className="dashboard-search">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              id="dashboard-search"
              type="search"
              placeholder={
                activeItem === 'Medici'
                  ? 'Caută medic sau specialitate...'
                  : activeItem === 'Pacienți'
                    ? 'Caută pacient după nume sau contact...'
                    : activeItem === 'Programări'
                      ? 'Caută pacient, medic sau tip de vizită...'
                      : activeItem === 'Departamente'
                        ? 'Caută departament, medic sau locație...'
                        : activeItem === 'Farmacie'
                          ? 'Caută medicament, lot sau furnizor...'
                        : activeItem === 'Urgențe și internări'
                          ? 'Caută pacient, secție sau medic...'
                        : activeItem === 'Analize și rapoarte'
                          ? 'Caută medic sau departament în rapoarte...'
                          : activeItem === 'Facturare și asigurări'
                            ? 'Caută factură, pacient sau dosar...'
                            : activeItem === 'Setări'
                              ? 'Caută o categorie de setări...'
                    : 'Caută pacienți sau programări...'
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="topbar-actions">
            <div className="topbar-profile">
              <span className="profile-avatar">
                {user.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('')
                  .toUpperCase()}
              </span>
              <span>
                <strong>{user.name}</strong>
                <small>Cont MedCare</small>
              </span>
            </div>
            <button
              className="dashboard-logout"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M8 3H4.5A1.5 1.5 0 0 0 3 4.5v11A1.5 1.5 0 0 0 4.5 17H8m3-3 4-4-4-4m4 4H7" />
              </svg>
              {isLoggingOut ? 'Se deconectează…' : 'Deconectare'}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <div className="dashboard-heading-meta">
                <span className="dashboard-eyebrow">{currentDate}</span>
                {clinicName.trim() && (
                  <span className="dashboard-clinic-badge" title={clinicName}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M3 17V5l7-3 7 3v12M7 17v-4h6v4M7 7h.01M10 7h.01M13 7h.01M7 10h.01M10 10h.01M13 10h.01" />
                    </svg>
                    <span>{clinicName}</span>
                  </span>
                )}
              </div>
              <h1>{heading}</h1>
              <p>
                {activeItem === 'Medici'
                  ? 'Explorează echipa medicală și disponibilitatea specialiștilor.'
                  : activeItem === 'Pacienți'
                    ? 'Gestionează registrul și datele de contact ale pacienților.'
                    : activeItem === 'Programări'
                      ? 'Planifică și urmărește consultațiile din clinică.'
                      : activeItem === 'Departamente'
                        ? 'Explorează specialitățile, echipele și organizarea clinicii.'
                        : activeItem === 'Farmacie'
                          ? 'Gestionează stocurile, loturile și datele de expirare.'
                        : activeItem === 'Urgențe și internări'
                          ? 'Urmărește cazurile de urgență și pacienții internați.'
                        : activeItem === 'Analize și rapoarte'
                          ? 'Urmărește indicatorii clinici și explorează activitatea agregată.'
                          : activeItem === 'Facturare și asigurări'
                            ? 'Urmărește facturile și solicitările demonstrative de decontare.'
                            : activeItem === 'Setări'
                              ? 'Configurează profilul clinicii, programul și preferințele contului.'
                    : 'O privire de ansamblu asupra activității clinicii tale.'}
              </p>
            </div>
            {activeItem === 'Tablou de bord' && <div className="dashboard-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={() => void handleReportAction('csv')}
                disabled={reportAction !== null}>
                {reportAction === 'csv' ? 'Se exportă...' : 'Exportă raportul'} <span aria-hidden="true">↓</span>
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={() => void handleReportAction('html')}
                disabled={reportAction !== null}>
                {reportAction === 'html' ? 'Se generează...' : 'Generează raport'} <span aria-hidden="true">▤</span>
              </button>
            </div>}
          </div>

          {notice && (
            <p className="dashboard-notice" role="status">
              {notice}
            </p>
          )}
          <DashboardContent
            activeItem={activeItem}
            query={query}
            onNavigate={handleSelectItem}
            user={user}
            onUserUpdated={onUserUpdated}
            onClinicNameChange={setClinicName}
            onThemeChange={setTheme}
            onDateFormatChange={handleDateFormatChange}
          />
        </div>
      </section>
    </main>
  )
}
