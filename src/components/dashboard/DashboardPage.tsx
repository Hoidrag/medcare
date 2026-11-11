import { useState } from 'react'
import type { AuthUser } from '../../services/auth'
import DashboardContent from './DashboardContent'
import DashboardSidebar from './layout/DashboardSidebar'
import './styles/dashboard.css'

function formatCurrentDate() {
  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
    .format(new Date())
    .toLocaleUpperCase('ro-RO')
}

type DashboardPageProps = {
  user: AuthUser
  onLogout: () => Promise<void>
}

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [currentDate] = useState(formatCurrentDate)
  const [activeItem, setActiveItem] = useState('Tablou de bord')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const heading =
    activeItem === 'Tablou de bord' ? `Bun venit, ${user.name}!` : activeItem

  function handleSelectItem(item: string) {
    setActiveItem(item)
    if (item !== 'Tablou de bord' && item !== 'Medici' && item !== 'Pacienți' && item !== 'Programări' && item !== 'Departamente' && item !== 'Analize și rapoarte' && item !== 'Facturare și asigurări') {
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

  function handleExport() {
    setNotice(
      'Exportul va fi disponibil după conectarea dashboardului la date reale.',
    )
  }

  return (
    <main className="dashboard-page">
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
                        : activeItem === 'Analize și rapoarte'
                          ? 'Caută medic sau departament în rapoarte...'
                          : activeItem === 'Facturare și asigurări'
                            ? 'Caută factură, pacient sau dosar...'
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
              <span className="dashboard-eyebrow">
                {currentDate}
              </span>
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
                        : activeItem === 'Analize și rapoarte'
                          ? 'Urmărește indicatorii clinici și explorează activitatea agregată.'
                          : activeItem === 'Facturare și asigurări'
                            ? 'Urmărește facturile și solicitările demonstrative de decontare.'
                    : 'O privire de ansamblu asupra activității clinicii tale.'}
              </p>
            </div>
            {activeItem === 'Tablou de bord' && <div className="dashboard-actions">
              <button
                className="secondary-action"
                type="button"
                onClick={handleExport}>
                Exportă raportul <span aria-hidden="true">↓</span>
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={handleExport}>
                Generează raport <span aria-hidden="true">▤</span>
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
          />
        </div>
      </section>
    </main>
  )
}
